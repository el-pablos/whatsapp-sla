<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chat extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_phone',
        'customer_name',
        'status',
        'handled_by',
        'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    /**
     * Status constants
     */
    const STATUS_BOT = 'bot';
    const STATUS_ADMIN = 'admin';
    const STATUS_RESOLVED = 'resolved';

    /**
     * Get all messages for this chat
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the admin handling this chat
     */
    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    /**
     * Scope for active chats (not resolved)
     */
    public function scopeActive($query)
    {
        return $query->where('status', '!=', self::STATUS_RESOLVED);
    }

    /**
     * Scope for chats that need attention (handled by bot with recent activity)
     */
    public function scopeNeedsAttention($query)
    {
        return $query->where('status', self::STATUS_BOT)
            ->where('last_message_at', '>=', now()->subMinutes(30));
    }

    /**
     * Scope for chats handled by specific user
     */
    public function scopeHandledBy($query, int $userId)
    {
        return $query->where('handled_by', $userId);
    }

    /**
     * Scope for chats by status
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Get the latest message
     */
    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * Assign chat to admin
     */
    public function assignToAdmin(int $userId): bool
    {
        return $this->update([
            'status' => self::STATUS_ADMIN,
            'handled_by' => $userId,
        ]);
    }

    /**
     * Resolve the chat
     */
    public function resolve(): bool
    {
        return $this->update([
            'status' => self::STATUS_RESOLVED,
        ]);
    }

    /**
     * Check if chat is handled by bot
     */
    public function isBot(): bool
    {
        return $this->status === self::STATUS_BOT;
    }

    /**
     * Check if chat is handled by admin
     */
    public function isAdmin(): bool
    {
        return $this->status === self::STATUS_ADMIN;
    }

    /**
     * Check if chat is resolved
     */
    public function isResolved(): bool
    {
        return $this->status === self::STATUS_RESOLVED;
    }
}
