<?php

use App\Models\Chat;
use App\Models\Message;

beforeEach(function () {
    Message::query()->delete();
});

describe('Message Model', function () {

    describe('constants', function () {
        it('has TYPE constants', function () {
            expect(Message::TYPE_TEXT)->toBe('text');
            expect(Message::TYPE_IMAGE)->toBe('image');
            expect(Message::TYPE_BUTTON)->toBe('button');
            expect(Message::TYPE_LIST)->toBe('list');
        });

        it('has DIRECTION constants', function () {
            expect(Message::DIRECTION_IN)->toBe('in');
            expect(Message::DIRECTION_OUT)->toBe('out');
        });
    });

    describe('fillable attributes', function () {
        it('has correct fillable fields', function () {
            $message = new Message;
            $fillable = $message->getFillable();

            expect($fillable)->toContain('chat_id')
                ->toContain('content')
                ->toContain('type')
                ->toContain('direction')
                ->toContain('wa_message_id');
        });
    });

    describe('relationships', function () {
        it('belongs to chat', function () {
            $chat = Chat::factory()->create();
            $message = Message::factory()->create(['chat_id' => $chat->id]);

            expect($message->chat)->toBeInstanceOf(Chat::class);
            expect($message->chat->id)->toBe($chat->id);
        });
    });

    describe('scopes', function () {
        it('scopeIncoming filters incoming messages', function () {
            $chat = Chat::factory()->create();
            Message::factory()->incoming()->create(['chat_id' => $chat->id]);
            Message::factory()->outgoing()->create(['chat_id' => $chat->id]);

            $incoming = Message::incoming()->get();
            expect($incoming)->toHaveCount(1);
            expect($incoming->first()->direction)->toBe(Message::DIRECTION_IN);
        });

        it('scopeOutgoing filters outgoing messages', function () {
            $chat = Chat::factory()->create();
            Message::factory()->incoming()->create(['chat_id' => $chat->id]);
            Message::factory()->outgoing()->create(['chat_id' => $chat->id]);

            $outgoing = Message::outgoing()->get();
            expect($outgoing)->toHaveCount(1);
            expect($outgoing->first()->direction)->toBe(Message::DIRECTION_OUT);
        });

        it('scopeOfType filters by type', function () {
            $chat = Chat::factory()->create();
            Message::factory()->create(['chat_id' => $chat->id, 'type' => Message::TYPE_TEXT]);
            Message::factory()->create(['chat_id' => $chat->id, 'type' => Message::TYPE_IMAGE]);

            $textMessages = Message::ofType(Message::TYPE_TEXT)->get();
            expect($textMessages)->toHaveCount(1);
            expect($textMessages->first()->type)->toBe(Message::TYPE_TEXT);
        });

        it('scopeTextOnly filters text messages', function () {
            $chat = Chat::factory()->create();
            Message::factory()->create(['chat_id' => $chat->id, 'type' => Message::TYPE_TEXT]);
            Message::factory()->create(['chat_id' => $chat->id, 'type' => Message::TYPE_IMAGE]);

            $textMessages = Message::textOnly()->get();
            expect($textMessages)->toHaveCount(1);
        });
    });

    describe('direction methods', function () {
        it('isIncoming returns true for incoming messages', function () {
            $message = Message::factory()->incoming()->make();
            expect($message->isIncoming())->toBeTrue();
            expect($message->isOutgoing())->toBeFalse();
        });

        it('isOutgoing returns true for outgoing messages', function () {
            $message = Message::factory()->outgoing()->make();
            expect($message->isOutgoing())->toBeTrue();
            expect($message->isIncoming())->toBeFalse();
        });
    });

    describe('type methods', function () {
        it('isText returns true for text messages', function () {
            $message = Message::factory()->make(['type' => Message::TYPE_TEXT]);
            expect($message->isText())->toBeTrue();
            expect($message->isImage())->toBeFalse();
        });

        it('isImage returns true for image messages', function () {
            $message = Message::factory()->make(['type' => Message::TYPE_IMAGE]);
            expect($message->isImage())->toBeTrue();
            expect($message->isText())->toBeFalse();
        });
    });

    describe('factory', function () {
        it('creates a valid message', function () {
            $chat = Chat::factory()->create();
            $message = Message::factory()->create(['chat_id' => $chat->id]);

            expect($message->id)->not->toBeNull();
            expect($message->content)->not->toBeEmpty();
            expect($message->chat_id)->toBe($chat->id);
        });

        it('creates incoming message with incoming state', function () {
            $chat = Chat::factory()->create();
            $message = Message::factory()->incoming()->create(['chat_id' => $chat->id]);
            expect($message->direction)->toBe(Message::DIRECTION_IN);
        });

        it('creates outgoing message with outgoing state', function () {
            $chat = Chat::factory()->create();
            $message = Message::factory()->outgoing()->create(['chat_id' => $chat->id]);
            expect($message->direction)->toBe(Message::DIRECTION_OUT);
        });
    });
});
