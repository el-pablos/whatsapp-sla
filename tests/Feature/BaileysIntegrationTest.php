<?php

namespace Tests\Feature;

use App\Services\BaileysService;
use App\Services\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BaileysIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected BaileysService $baileysService;

    protected WhatsAppService $whatsAppService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->baileysService = app(BaileysService::class);
        $this->whatsAppService = app(WhatsAppService::class);
    }

    /** @test */
    public function can_get_qr_code_from_baileys_service()
    {
        Http::fake([
            '*/auth/qr' => Http::response([
                'success' => true,
                'qr' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                'timestamp' => time(),
            ], 200),
        ]);

        $qr = $this->baileysService->getQRCode();

        $this->assertNotNull($qr);
        $this->assertStringContainsString('data:image/png;base64', $qr);
    }

    /** @test */
    public function can_request_pairing_code()
    {
        Http::fake([
            '*/auth/pairing' => Http::response([
                'success' => true,
                'code' => '1234-5678',
                'phone' => '628123456789',
                'expiresAt' => time() + 120,
            ], 200),
        ]);

        $code = $this->baileysService->requestPairingCode('08123456789');

        $this->assertNotNull($code);
        $this->assertMatchesRegularExpression('/\d{4}-\d{4}/', $code);
    }

    /** @test */
    public function can_check_auth_status()
    {
        Http::fake([
            '*/auth/status' => Http::response([
                'success' => true,
                'authenticated' => true,
                'jid' => '628123456789@s.whatsapp.net',
                'connected' => true,
            ], 200),
        ]);

        $status = $this->baileysService->getAuthStatus();

        $this->assertIsArray($status);
        $this->assertTrue($status['authenticated']);
        $this->assertTrue($status['connected']);
    }

    /** @test */
    public function can_send_text_message_via_whatsapp_service()
    {
        Http::fake([
            '*/auth/status' => Http::response([
                'success' => true,
                'authenticated' => true,
                'connected' => true,
            ], 200),
            '*/message/send' => Http::response([
                'success' => true,
                'messageId' => 'msg_123456',
                'timestamp' => time(),
            ], 200),
        ]);

        $messageId = $this->whatsAppService->sendText('08123456789', 'Test message');

        $this->assertNotNull($messageId);
        $this->assertEquals('msg_123456', $messageId);
    }

    /** @test */
    public function handles_connection_failure_gracefully()
    {
        Http::fake([
            '*' => Http::response([], 500),
        ]);

        $result = $this->baileysService->getQRCode();

        $this->assertNull($result);
    }

    /** @test */
    public function retries_failed_requests()
    {
        Http::fake([
            '*/auth/qr' => Http::sequence()
                ->push([], 500)
                ->push([], 500)
                ->push([
                    'success' => true,
                    'qr' => 'data:image/png;base64,success',
                    'timestamp' => time(),
                ], 200),
        ]);

        $qr = $this->baileysService->getQRCode();

        $this->assertNotNull($qr);
        $this->assertStringContainsString('success', $qr);
    }

    /** @test */
    public function caches_qr_code_for_performance()
    {
        Http::fake([
            '*/auth/qr' => Http::response([
                'success' => true,
                'qr' => 'cached_qr_data',
                'timestamp' => time(),
            ], 200),
        ]);

        // First call
        $qr1 = $this->baileysService->getQRCode();

        // Second call should use cache
        $qr2 = $this->baileysService->getQRCode();

        $this->assertEquals($qr1, $qr2);
        $this->assertTrue(Cache::has('baileys.qr_code'));

        Http::assertSentCount(1); // Only one HTTP request
    }

    /** @test */
    public function validates_phone_number_format()
    {
        Http::fake([
            '*/auth/pairing' => Http::response([
                'success' => true,
                'code' => '9999-8888',
                'phone' => '628123456789',
            ], 200),
        ]);

        // Test various phone formats
        $inputs = [
            '08123456789',
            '+62 812 3456 789',
            '62-812-3456-789',
            '812.3456.789',
        ];

        foreach ($inputs as $input) {
            $code = $this->baileysService->requestPairingCode($input);
            $this->assertNotNull($code, "Failed for input: {$input}");
        }
    }
}
