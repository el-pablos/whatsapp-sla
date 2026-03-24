<?php

use App\Models\Chat;
use App\Models\User;

describe('Chat API', function () {

    describe('POST /api/chats', function () {
        it('creates new chat', function () {
            $response = $this->postJson('/api/chats', [
                'whatsapp_chat_id' => 'wa_123456',
                'customer_phone' => '081234567890',
                'customer_name' => 'John Doe',
            ]);

            $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'message' => 'Chat berhasil dibuat',
                ]);

            $this->assertDatabaseHas('chats', [
                'whatsapp_chat_id' => 'wa_123456',
                'customer_phone' => '081234567890',
                'customer_name' => 'John Doe',
                'status' => 'active',
            ]);
        });

        it('updates existing chat', function () {
            Chat::factory()->create([
                'whatsapp_chat_id' => 'wa_123456',
                'customer_phone' => '081234567890',
                'customer_name' => 'Old Name',
            ]);

            $response = $this->postJson('/api/chats', [
                'whatsapp_chat_id' => 'wa_123456',
                'customer_phone' => '081234567890',
                'customer_name' => 'New Name',
            ]);

            $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Chat berhasil diupdate',
                ]);

            $this->assertDatabaseHas('chats', [
                'whatsapp_chat_id' => 'wa_123456',
                'customer_name' => 'New Name',
            ]);

            $this->assertDatabaseCount('chats', 1);
        });

        it('sets default status to active', function () {
            $response = $this->postJson('/api/chats', [
                'whatsapp_chat_id' => 'wa_123456',
                'customer_phone' => '081234567890',
            ]);

            $response->assertStatus(201);

            $this->assertDatabaseHas('chats', [
                'whatsapp_chat_id' => 'wa_123456',
                'status' => 'active',
            ]);
        });

        it('allows custom status', function () {
            $response = $this->postJson('/api/chats', [
                'whatsapp_chat_id' => 'wa_123456',
                'customer_phone' => '081234567890',
                'status' => 'resolved',
            ]);

            $response->assertStatus(201);

            $this->assertDatabaseHas('chats', [
                'whatsapp_chat_id' => 'wa_123456',
                'status' => 'resolved',
            ]);
        });

        it('validates required fields', function () {
            $response = $this->postJson('/api/chats', []);

            $response->assertStatus(422)
                ->assertJson([
                    'success' => false,
                    'code' => 'VALIDATION_ERROR',
                ])
                ->assertJsonStructure(['errors' => ['whatsapp_chat_id', 'customer_phone']]);
        });

        it('validates status enum', function () {
            $response = $this->postJson('/api/chats', [
                'whatsapp_chat_id' => 'wa_123456',
                'customer_phone' => '081234567890',
                'status' => 'invalid_status',
            ]);

            $response->assertStatus(422)
                ->assertJsonStructure(['errors' => ['status']]);
        });

        it('updates last_message_at timestamp', function () {
            $response = $this->postJson('/api/chats', [
                'whatsapp_chat_id' => 'wa_123456',
                'customer_phone' => '081234567890',
            ]);

            $response->assertStatus(201);

            $chat = Chat::where('whatsapp_chat_id', 'wa_123456')->first();
            expect($chat->last_message_at)->not->toBeNull();
        });

        it('allows null customer_name', function () {
            $response = $this->postJson('/api/chats', [
                'whatsapp_chat_id' => 'wa_123456',
                'customer_phone' => '081234567890',
                'customer_name' => null,
            ]);

            $response->assertStatus(201);

            $this->assertDatabaseHas('chats', [
                'whatsapp_chat_id' => 'wa_123456',
                'customer_name' => null,
            ]);
        });
    });
});
