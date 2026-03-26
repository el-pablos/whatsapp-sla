<?php

namespace App\Http\Controllers;

use App\Services\BaileysService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class BaileysAuthController extends Controller
{
    public function __construct(
        private readonly BaileysService $baileys
    ) {}

    /**
     * Show QR code page untuk pairing WhatsApp
     */
    public function showQR()
    {
        $status = $this->baileys->getConnectionStatus();
        $metrics = $this->baileys->getHealthMetrics();

        // Jika sudah authenticated, redirect ke dashboard
        if ($status['authenticated'] && $status['status'] === 'open') {
            return redirect()->route('dashboard')->with('success', 'WhatsApp sudah terhubung');
        }

        return view('auth.qr', [
            'status' => $status,
            'metrics' => $metrics,
            'qr_timeout' => config('whatsapp.baileys.qr_timeout', 60),
        ]);
    }

    /**
     * Get current auth status untuk AJAX polling
     */
    public function status(): JsonResponse
    {
        $status = $this->baileys->getConnectionStatus();
        $metrics = $this->baileys->getHealthMetrics();

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $status['status'],
                'authenticated' => $status['authenticated'],
                'last_seen' => $status['last_seen'],
                'session_exists' => $status['session_exists'],
                'health_score' => $metrics['health_score'],
                'uptime_minutes' => $metrics['uptime_minutes'] ?? 0,
            ],
        ]);
    }

    /**
     * Request QR code untuk pairing
     */
    public function requestQR(): JsonResponse
    {
        try {
            Log::info('QR code requested via web interface');

            $result = $this->baileys->requestQRCode();

            if ($result['success']) {
                // QR akan di-generate via Redis, client harus poll untuk mendapatkan QR
                return response()->json([
                    'success' => true,
                    'message' => 'QR code sedang di-generate. Silakan tunggu beberapa detik.',
                    'data' => [
                        'polling_required' => true,
                        'poll_interval_seconds' => 2,
                        'timeout_seconds' => config('whatsapp.baileys.qr_timeout', 60),
                    ],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal request QR code: '.($result['error'] ?? 'Unknown error'),
            ], 500);

        } catch (\Exception $e) {
            Log::error('QR request failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem',
            ], 500);
        }
    }

    /**
     * Get QR code dari cache (untuk polling)
     */
    public function getQR(): JsonResponse
    {
        try {
            // Cek QR dari cache yang di-set oleh Node.js service
            $qrCode = Cache::get('baileys:qr_code');
            $qrTimestamp = Cache::get('baileys:qr_timestamp');

            if ($qrCode && $qrTimestamp) {
                $age = now()->diffInSeconds($qrTimestamp);
                $timeout = config('whatsapp.baileys.qr_timeout', 60);

                // QR masih valid
                if ($age < $timeout) {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'qr_code' => $qrCode,
                            'expires_in_seconds' => $timeout - $age,
                            'timestamp' => $qrTimestamp,
                        ],
                    ]);
                }

                // QR expired, hapus dari cache
                Cache::forget('baileys:qr_code');
                Cache::forget('baileys:qr_timestamp');
            }

            return response()->json([
                'success' => false,
                'message' => 'QR code tidak tersedia atau expired',
            ]);

        } catch (\Exception $e) {
            Log::error('Get QR failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem',
            ], 500);
        }
    }

    /**
     * Request pairing code untuk nomor tertentu
     */
    public function requestPairing(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'phone' => 'required|string|min:10|max:15',
            ]);

            $phone = $request->phone;

            // Sanitize phone number
            $phone = preg_replace('/[^0-9+]/', '', $phone);

            // Add country code if not present
            if (! str_starts_with($phone, '+') && ! str_starts_with($phone, '62')) {
                $phone = '+62'.ltrim($phone, '0');
            } elseif (str_starts_with($phone, '0')) {
                $phone = '+62'.substr($phone, 1);
            }

            Log::info('Pairing code requested', ['phone' => $phone]);

            // TODO: Implementasi pairing code via Redis command
            // Sementara return success
            return response()->json([
                'success' => true,
                'message' => 'Pairing code akan dikirim ke nomor WhatsApp Anda',
                'data' => [
                    'phone' => $phone,
                    'code' => 'XXXXXX', // Placeholder - akan di-implement later
                    'expires_in_minutes' => 10,
                ],
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor telepon tidak valid',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Pairing request failed', [
                'phone' => $request->phone ?? '',
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem',
            ], 500);
        }
    }

    /**
     * Logout dan clear session WhatsApp
     */
    public function logout(): JsonResponse
    {
        try {
            Log::info('WhatsApp logout requested via web interface');

            $this->baileys->clearSession();

            return response()->json([
                'success' => true,
                'message' => 'Session WhatsApp telah dihapus. Silakan scan QR code untuk login kembali.',
            ]);

        } catch (\Exception $e) {
            Log::error('Logout failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan logout',
            ], 500);
        }
    }

    /**
     * Restart WhatsApp connection
     */
    public function restart(): JsonResponse
    {
        try {
            Log::info('WhatsApp restart requested via web interface');

            $result = $this->baileys->restart();

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'WhatsApp service sedang di-restart. Mohon tunggu beberapa saat.',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal restart service: '.($result['error'] ?? 'Unknown error'),
            ], 500);

        } catch (\Exception $e) {
            Log::error('Restart failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem',
            ], 500);
        }
    }

    /**
     * Get detailed metrics untuk monitoring dashboard
     */
    public function metrics(): JsonResponse
    {
        try {
            $metrics = $this->baileys->getHealthMetrics();
            $status = $this->baileys->getConnectionStatus();

            return response()->json([
                'success' => true,
                'data' => [
                    'connection' => $status,
                    'metrics' => $metrics,
                    'cache_info' => [
                        'qr_available' => Cache::has('baileys:qr_code'),
                        'last_error' => Cache::get('baileys:last_error'),
                        'last_error_time' => Cache::get('baileys:last_error_time'),
                    ],
                    'config' => [
                        'qr_timeout' => config('whatsapp.baileys.qr_timeout'),
                        'retry_attempts' => config('whatsapp.baileys.retry_attempts'),
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Get metrics failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mendapatkan metrics',
            ], 500);
        }
    }
}
