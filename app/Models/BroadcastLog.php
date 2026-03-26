<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BroadcastLog extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'message',
        'recipients',
        'total_recipients',
        'sent_count',
        'failed_count',
        'status',
        'scheduled_at',
        'started_at',
        'completed_at',
        'failed_numbers',
        'error_message',
    ];

    protected $casts = [
        'recipients' => 'array',
        'failed_numbers' => 'array',
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markAsProcessing(): void
    {
        $this->update([
            'status' => 'processing',
            'started_at' => now(),
        ]);
    }

    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }

    public function markAsFailed(string $error): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $error,
            'completed_at' => now(),
        ]);
    }

    public function incrementSent(): void
    {
        $this->increment('sent_count');
    }

    public function incrementFailed(string $phone): void
    {
        $this->increment('failed_count');
        $failed = $this->failed_numbers ?? [];
        $failed[] = $phone;
        $this->update(['failed_numbers' => $failed]);
    }
}
