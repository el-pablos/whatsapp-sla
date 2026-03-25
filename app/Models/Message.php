<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_id',
        'content',
        'type',
        'direction',
        'wa_message_id',
    ];

    /**
     * Type constants
     */
    const TYPE_TEXT = 'text';
    const TYPE_IMAGE = 'image';
    const TYPE_BUTTON = 'button';
    const TYPE_LIST = 'list';

    /**
     * Direction constants
     */
    const DIRECTION_IN = 'in';
    const DIRECTION_OUT = 'out';

    /**
     * Get the chat that owns this message
     */
    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }

    /**
     * Scope for incoming messages (from customer)
     */
    public function scopeIncoming($query)
    {
        return $query->where('direction', self::DIRECTION_IN);
    }

    /**
     * Scope for outgoing messages (from system/admin)
     */
    public function scopeOutgoing($query)
    {
        return $query->where('direction', self::DIRECTION_OUT);
    }

    /**
     * Scope for messages by type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope for text messages
     */
    public function scopeTextOnly($query)
    {
        return $query->where('type', self::TYPE_TEXT);
    }

    /**
     * Check if message is incoming
     */
    public function isIncoming(): bool
    {
        return $this->direction === self::DIRECTION_IN;
    }

    /**
     * Check if message is outgoing
     */
    public function isOutgoing(): bool
    {
        return $this->direction === self::DIRECTION_OUT;
    }

    /**
     * Check if message is text type
     */
    public function isText(): bool
    {
        return $this->type === self::TYPE_TEXT;
    }

    /**
     * Check if message is image type
     */
    public function isImage(): bool
    {
        return $this->type === self::TYPE_IMAGE;
    }
}
