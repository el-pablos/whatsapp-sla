<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WhatsAppStatusService;
use Illuminate\Http\JsonResponse;

class WhatsAppStatusController extends Controller
{
    public function __construct(
        private readonly WhatsAppStatusService $statusService
    ) {}

    /**
     * Get WhatsApp connection status
     */
    public function status(): JsonResponse
    {
        $status = $this->statusService->getConnectionStatus();

        return response()->json([
            'status' => 'success',
            'data' => $status,
            'message' => 'WhatsApp status retrieved successfully',
        ]);
    }

    /**
     * Check if WhatsApp is ready to send messages
     */
    public function ready(): JsonResponse
    {
        $isReady = $this->statusService->isReady();

        return response()->json([
            'status' => $isReady ? 'ready' : 'not_ready',
            'ready' => $isReady,
            'message' => $isReady ? 'WhatsApp is ready' : 'WhatsApp is not ready',
        ]);
    }

    /**
     * Get QR code for authentication
     */
    public function qr(): JsonResponse
    {
        $qrCode = $this->statusService->getQRCode();

        if (! $qrCode) {
            return response()->json([
                'status' => 'error',
                'message' => 'QR code not available',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'qr_code' => $qrCode,
            ],
            'message' => 'QR code retrieved successfully',
        ]);
    }

    /**
     * Clear WhatsApp cache (admin only)
     */
    public function clearCache(): JsonResponse
    {
        $this->statusService->clearCache();

        return response()->json([
            'status' => 'success',
            'message' => 'WhatsApp cache cleared successfully',
        ]);
    }

    /**
     * Send test event (development only)
     */
    public function testEvent(): JsonResponse
    {
        if (! app()->environment(['local', 'development'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Test events only available in development environment',
            ], 403);
        }

        $success = $this->statusService->sendTestEvent('message:received', [
            'messageId' => 'api_test_'.uniqid(),
            'from' => '628123456789@s.whatsapp.net',
            'pushName' => 'API Test',
            'message' => [
                'conversation' => 'Test message from API endpoint',
            ],
            'timestamp' => time(),
        ]);

        return response()->json([
            'status' => $success ? 'success' : 'error',
            'message' => $success ? 'Test event sent' : 'Failed to send test event',
        ]);
    }
}
