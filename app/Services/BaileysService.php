<?php

namespace App\Services;

use App\Exceptions\BaileysServiceException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BaileysService
{
    private string $baseUrl;

    private string $apiKey;

    private int $timeout;

    private int $retryAttempts;

    private int $retryDelay;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.baileys.url', 'http://localhost:3002'), '/');
        $this->apiKey = config('services.baileys.api_key', '');
        $this->timeout = config('services.baileys.timeout', 30);
        $this->retryAttempts = config('services.baileys.retry_attempts', 3);
        $this->retryDelay = config('services.baileys.retry_delay', 1000);
    }

    /**
     * Ambil QR Code untuk authentication
     */
    public function getQRCode(): ?string
    {
        try {
            $response = $this->makeRequest('GET', '/auth/qr');

            if ($response->successful() && $response->json('qr')) {
                // Cache QR code untuk performa
                Cache::put(
                    'baileys.qr_code',
                    $response->json('qr'),
                    now()->addSeconds(30) // QR expired 30 detik
                );

                Log::info('QR Code berhasil diambil dari Baileys service');

                return $response->json('qr');
            }

            Log::warning('Gagal mendapatkan QR code', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Error mendapatkan QR code', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    /**
     * Request pairing code untuk authentication via nomor telepon
     */
    public function requestPairingCode(string $phone): ?string
    {
        try {
            // Sanitize phone number (hapus +, spasi, dll)
            $cleanPhone = preg_replace('/[^\d]/', '', $phone);

            if (empty($cleanPhone)) {
                throw new BaileysServiceException('Nomor telepon tidak valid');
            }

            $response = $this->makeRequest('POST', '/auth/pairing-code', [
                'phone' => $cleanPhone,
            ]);

            if ($response->successful() && $response->json('pairing_code')) {
                $pairingCode = $response->json('pairing_code');

                Log::info('Pairing code berhasil diambil', [
                    'phone' => $cleanPhone,
                    'pairing_code' => $pairingCode,
                ]);

                return $pairingCode;
            }

            Log::warning('Gagal mendapatkan pairing code', [
                'phone' => $cleanPhone,
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Error mendapatkan pairing code', [
                'phone' => $phone,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Cek status authentication Baileys
     */
    public function getAuthStatus(): array
    {
        try {
            $response = $this->makeRequest('GET', '/auth/status');

            if ($response->successful()) {
                $data = $response->json();

                // Cache status untuk performa
                Cache::put(
                    'baileys.auth_status',
                    $data,
                    now()->addSeconds(10)
                );

                Log::info('Status authentication berhasil diambil', $data);

                return $data;
            }

            Log::warning('Gagal mendapatkan auth status', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            return [
                'authenticated' => false,
                'connection' => 'disconnected',
                'error' => 'Failed to get status',
            ];
        } catch (\Exception $e) {
            Log::error('Error mendapatkan auth status', [
                'error' => $e->getMessage(),
            ]);

            return [
                'authenticated' => false,
                'connection' => 'error',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Kirim pesan WhatsApp
     */
    public function sendMessage(string $to, string $type = 'text', array $content = []): ?string
    {
        try {
            // Validate message type
            if (! in_array($type, ['text', 'image', 'document', 'audio', 'video', 'template'])) {
                throw new BaileysServiceException("Tipe pesan tidak didukung: {$type}");
            }

            // Clean phone number
            $cleanTo = $this->cleanPhoneNumber($to);

            $payload = [
                'to' => $cleanTo,
                'type' => $type,
                'content' => $content,
            ];

            $response = $this->makeRequest('POST', '/messages/send', $payload);

            if ($response->successful()) {
                $messageId = $response->json('message_id');

                Log::info('Pesan berhasil dikirim', [
                    'to' => $cleanTo,
                    'type' => $type,
                    'message_id' => $messageId,
                ]);

                return $messageId;
            }

            Log::warning('Gagal mengirim pesan', [
                'to' => $cleanTo,
                'type' => $type,
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Error mengirim pesan', [
                'to' => $to,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Cek koneksi ke Baileys service (health check)
     */
    public function isConnected(): bool
    {
        try {
            // Cek cached status dulu
            $cachedStatus = Cache::get('baileys.health_check');
            if ($cachedStatus !== null) {
                return $cachedStatus;
            }

            $response = $this->makeRequest('GET', '/health', [], 5); // timeout singkat untuk health check

            $isConnected = $response->successful();

            // Cache hasil health check
            Cache::put(
                'baileys.health_check',
                $isConnected,
                now()->addSeconds(30)
            );

            Log::info('Health check Baileys service', [
                'connected' => $isConnected,
                'status_code' => $response->status(),
            ]);

            return $isConnected;
        } catch (\Exception $e) {
            Log::error('Error health check Baileys service', [
                'error' => $e->getMessage(),
            ]);

            // Cache negative result untuk menghindari spam request
            Cache::put('baileys.health_check', false, now()->addSeconds(10));

            return false;
        }
    }

    /**
     * Private method untuk membuat HTTP request dengan retry logic
     */
    private function makeRequest(string $method, string $endpoint, array $data = [], ?int $timeout = null): Response
    {
        $timeout = $timeout ?? $this->timeout;
        $url = $this->baseUrl.$endpoint;

        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'User-Agent' => 'Laravel-BaileysService/1.0',
        ];

        // Tambahkan API key jika ada
        if ($this->apiKey) {
            $headers['Authorization'] = "Bearer {$this->apiKey}";
        }

        $attempt = 0;

        while ($attempt < $this->retryAttempts) {
            try {
                $httpClient = Http::timeout($timeout)->withHeaders($headers);

                $response = match (strtoupper($method)) {
                    'GET' => $httpClient->get($url, $data),
                    'POST' => $httpClient->post($url, $data),
                    'PUT' => $httpClient->put($url, $data),
                    'PATCH' => $httpClient->patch($url, $data),
                    'DELETE' => $httpClient->delete($url, $data),
                    default => throw new BaileysServiceException("HTTP method tidak didukung: {$method}")
                };

                // Jika berhasil atau error non-retriable, return response
                if ($response->successful() || ! $this->isRetriableError($response)) {
                    return $response;
                }

            } catch (ConnectionException $e) {
                Log::warning("Connection error to Baileys service (attempt {$attempt})", [
                    'url' => $url,
                    'error' => $e->getMessage(),
                ]);
            } catch (RequestException $e) {
                Log::warning("Request error to Baileys service (attempt {$attempt})", [
                    'url' => $url,
                    'error' => $e->getMessage(),
                ]);
            }

            $attempt++;

            // Delay sebelum retry (exponential backoff)
            if ($attempt < $this->retryAttempts) {
                $delay = $this->retryDelay * pow(2, $attempt - 1);
                usleep($delay * 1000); // convert to microseconds
            }
        }

        throw new BaileysServiceException("Gagal menghubungi Baileys service setelah {$this->retryAttempts} attempts");
    }

    /**
     * Tentukan apakah error bisa di-retry
     */
    private function isRetriableError(Response $response): bool
    {
        $status = $response->status();

        // Status code yang bisa di-retry (temporary errors)
        return in_array($status, [
            408, // Request Timeout
            429, // Too Many Requests
            500, // Internal Server Error
            502, // Bad Gateway
            503, // Service Unavailable
            504, // Gateway Timeout
        ]);
    }

    /**
     * Bersihkan nomor telepon dan format untuk WhatsApp
     */
    private function cleanPhoneNumber(string $phone): string
    {
        // Hapus semua karakter non-digit
        $clean = preg_replace('/[^\d]/', '', $phone);

        // Pastikan format dengan country code (Indonesian +62)
        if (strlen($clean) > 10 && substr($clean, 0, 2) === '62') {
            return $clean.'@s.whatsapp.net';
        }

        if (strlen($clean) > 9 && substr($clean, 0, 1) === '0') {
            return '62'.substr($clean, 1).'@s.whatsapp.net';
        }

        return $clean.'@s.whatsapp.net';
    }
}
