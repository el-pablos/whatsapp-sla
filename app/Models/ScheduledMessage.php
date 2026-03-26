<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model untuk pesan WhatsApp terjadwal
 */
class ScheduledMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'phone_number',
        'message',
        'scheduled_at',
        'status',
        'retry_count',
        'error_message',
        'sent_at',
        'response_data',
        'user_id',
        'campaign_id',
        'type',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'response_data' => 'array',
        'retry_count' => 'integer',
        'user_id' => 'integer',
    ];

    const STATUS_PENDING = 'pending';

    const STATUS_PROCESSING = 'processing';

    const STATUS_SENT = 'sent';

    const STATUS_FAILED = 'failed';

    /**
     * Scope untuk pesan siap dikirim
     */
    public function scopeReadyToSend($query)
    {
        return $query->where('status', self::STATUS_PENDING)
            ->where('scheduled_at', '<=', now());
    }

    /**
     * Scope untuk pesan failed yang eligible untuk retry
     */
    public function scopeEligibleForRetry($query)
    {
        return $query->where('status', self::STATUS_FAILED)
            ->where('retry_count', '<', 3)
            ->where('updated_at', '<', now()->subMinutes(30));
    }

    /**
     * Relasi ke user yang membuat scheduled message
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check apakah pesan masih bisa di-retry
     */
    public function canRetry(): bool
    {
        return $this->status === self::STATUS_FAILED &&
               $this->retry_count < 3;
    }

    /**
     * Mark pesan untuk retry
     */
    public function scheduleRetry(int $delaySeconds = 300): void
    {
        if (! $this->canRetry()) {
            return;
        }

        $this->update([
            'status' => self::STATUS_PENDING,
            'scheduled_at' => now()->addSeconds($delaySeconds),
            'error_message' => null,
        ]);
    }

    /**
     * Mark pesan sebagai sent
     */
    public function markAsSent(?array $responseData = null): void
    {
        $this->update([
            'status' => self::STATUS_SENT,
            'sent_at' => now(),
            'response_data' => $responseData,
        ]);
    }

    /**
     * Mark pesan sebagai failed
     */
    public function markAsFailed(string $errorMessage): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'error_message' => $errorMessage,
            'retry_count' => $this->retry_count + 1,
        ]);
    }
}
