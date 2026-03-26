<?php

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Carbon;

// Clear Chat table before each test in scopes describe block
beforeEach(function () {
    Chat::query()->delete();
});

describe('Chat Model', function () {

    describe('constants', function () {
        it('has STATUS_BOT constant', function () {
            expect(Chat::STATUS_BOT)->toBe('bot');
        });

        it('has STATUS_ADMIN constant', function () {
            expect(Chat::STATUS_ADMIN)->toBe('admin');
        });

        it('has STATUS_RESOLVED constant', function () {
            expect(Chat::STATUS_RESOLVED)->toBe('resolved');
        });
    });

    describe('fillable attributes', function () {
        it('has correct fillable fields', function () {
            $chat = new Chat;
            $fillable = $chat->getFillable();

            expect($fillable)->toContain('customer_phone')
                ->toContain('customer_name')
                ->toContain('status')
                ->toContain('handled_by')
                ->toContain('last_message_at');
        });
    });

    describe('casts', function () {
        it('casts last_message_at to datetime', function () {
            $chat = Chat::factory()->make(['last_message_at' => now()]);
            expect($chat->last_message_at)->toBeInstanceOf(Carbon::class);
        });
    });

    describe('relationships', function () {
        it('has many messages', function () {
            $chat = Chat::factory()->create();
            Message::factory()->count(3)->create(['chat_id' => $chat->id]);

            expect($chat->messages)->toHaveCount(3);
            expect($chat->messages->first())->toBeInstanceOf(Message::class);
        });

        it('belongs to handler (user)', function () {
            $user = User::factory()->admin()->create();
            $chat = Chat::factory()->create(['handled_by' => $user->id, 'status' => Chat::STATUS_ADMIN]);

            expect($chat->handler)->toBeInstanceOf(User::class);
            expect($chat->handler->id)->toBe($user->id);
        });

        it('can have null handler when bot status', function () {
            $chat = Chat::factory()->bot()->create();

            expect($chat->handler)->toBeNull();
            expect($chat->handled_by)->toBeNull();
        });
    });

    describe('scopes', function () {
        it('scopeActive filters non-resolved chats', function () {
            Chat::factory()->bot()->create();
            Chat::factory()->admin()->create();
            Chat::factory()->resolved()->create();

            $activeChats = Chat::active()->get();
            expect($activeChats)->toHaveCount(2);
            expect($activeChats->pluck('status'))->not->toContain(Chat::STATUS_RESOLVED);
        });

        it('scopeNeedsAttention filters bot chats with recent activity', function () {
            Chat::factory()->bot()->create(['last_message_at' => now()]);
            Chat::factory()->bot()->create(['last_message_at' => now()->subHours(2)]);
            Chat::factory()->admin()->create(['last_message_at' => now()]);

            $needsAttention = Chat::needsAttention()->get();
            expect($needsAttention)->toHaveCount(1);
            expect($needsAttention->first()->status)->toBe(Chat::STATUS_BOT);
        });

        it('scopeHandledBy filters chats by user', function () {
            $user1 = User::factory()->create();
            $user2 = User::factory()->create();
            Chat::factory()->create(['handled_by' => $user1->id]);
            Chat::factory()->create(['handled_by' => $user2->id]);

            $chats = Chat::handledBy($user1->id)->get();
            expect($chats)->toHaveCount(1);
            expect($chats->first()->handled_by)->toBe($user1->id);
        });

        it('scopeByStatus filters by status', function () {
            Chat::factory()->bot()->create();
            Chat::factory()->admin()->create();
            Chat::factory()->resolved()->create();

            $botChats = Chat::byStatus(Chat::STATUS_BOT)->get();
            expect($botChats)->toHaveCount(1);
            expect($botChats->first()->status)->toBe(Chat::STATUS_BOT);
        });
    });

    describe('status methods', function () {
        it('isBot returns true for bot status', function () {
            $chat = Chat::factory()->bot()->make();
            expect($chat->isBot())->toBeTrue();
            expect($chat->isAdmin())->toBeFalse();
            expect($chat->isResolved())->toBeFalse();
        });

        it('isAdmin returns true for admin status', function () {
            $chat = Chat::factory()->admin()->make();
            expect($chat->isAdmin())->toBeTrue();
            expect($chat->isBot())->toBeFalse();
        });

        it('isResolved returns true for resolved status', function () {
            $chat = Chat::factory()->resolved()->make();
            expect($chat->isResolved())->toBeTrue();
            expect($chat->isBot())->toBeFalse();
        });
    });

    describe('action methods', function () {
        it('assignToAdmin assigns chat to user', function () {
            $chat = Chat::factory()->bot()->create();
            $user = User::factory()->admin()->create();

            $result = $chat->assignToAdmin($user->id);

            expect($result)->toBeTrue();
            $chat->refresh();
            expect($chat->status)->toBe(Chat::STATUS_ADMIN);
            expect($chat->handled_by)->toBe($user->id);
        });

        it('resolve marks chat as resolved', function () {
            $chat = Chat::factory()->admin()->create();

            $result = $chat->resolve();

            expect($result)->toBeTrue();
            $chat->refresh();
            expect($chat->status)->toBe(Chat::STATUS_RESOLVED);
        });
    });

    describe('latestMessage relation', function () {
        it('returns the most recent message', function () {
            $chat = Chat::factory()->create();
            Message::factory()->create(['chat_id' => $chat->id, 'created_at' => now()->subHour()]);
            $latestMsg = Message::factory()->create(['chat_id' => $chat->id, 'content' => 'Latest', 'created_at' => now()]);

            expect($chat->latestMessage->id)->toBe($latestMsg->id);
            expect($chat->latestMessage->content)->toBe('Latest');
        });
    });

    describe('factory', function () {
        it('creates a valid chat', function () {
            $chat = Chat::factory()->create();

            expect($chat->id)->not->toBeNull();
            expect($chat->customer_phone)->not->toBeEmpty();
            expect($chat->customer_name)->not->toBeEmpty();
        });

        it('creates bot chat with bot state', function () {
            $chat = Chat::factory()->bot()->create();
            expect($chat->status)->toBe(Chat::STATUS_BOT);
            expect($chat->handled_by)->toBeNull();
        });

        it('creates admin chat with admin state', function () {
            $chat = Chat::factory()->admin()->create();
            expect($chat->status)->toBe(Chat::STATUS_ADMIN);
            expect($chat->handled_by)->not->toBeNull();
        });

        it('creates resolved chat with resolved state', function () {
            $chat = Chat::factory()->resolved()->create();
            expect($chat->status)->toBe(Chat::STATUS_RESOLVED);
        });
    });
});
