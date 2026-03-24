<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'wa_message_id',
        'from_number',
        'contact_name',
        'type',
        'content',
        'raw_payload',
        'timestamp',
        'status',
        'replied_at',
    ];

    protected $casts = [
        'content' => 'array',
        'timestamp' => 'datetime',
        'replied_at' => 'datetime',
    ];

    /**
     * Scope for unread messages
     */
    public function scopeUnread($query)
    {
        return $query->where('status', 'unread');
    }

    /**
     * Scope for messages by type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope for messages from specific number
     */
    public function scopeFromNumber($query, string $number)
    {
        return $query->where('from_number', $number);
    }

    /**
     * Mark message as read
     */
    public function markAsRead(): bool
    {
        return $this->update(['status' => 'read']);
    }

    /**
     * Mark message as replied
     */
    public function markAsReplied(): bool
    {
        return $this->update([
            'status' => 'replied',
            'replied_at' => now(),
        ]);
    }

    /**
     * Get text content for text messages
     */
    public function getTextAttribute(): ?string
    {
        if ($this->type === 'text') {
            return $this->content['body'] ?? null;
        }
        return null;
    }
}
