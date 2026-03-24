<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->string('whatsapp_chat_id')->unique();
            $table->string('customer_phone', 20);
            $table->string('customer_name')->nullable();
            $table->enum('status', ['active', 'bot', 'admin', 'resolved'])->default('active');
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->index('whatsapp_chat_id');
            $table->index('customer_phone');
            $table->index('status');
            $table->index('handled_by');
            $table->index('last_message_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chats');
    }
};
