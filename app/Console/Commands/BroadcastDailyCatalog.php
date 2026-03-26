<?php

namespace App\Console\Commands;

use App\Models\Catalog;
use App\Models\Chat;
use App\Models\Product;
use App\Services\BaileysService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class BroadcastDailyCatalog extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'broadcast:catalog
                            {--test : Jalankan dalam mode test (tidak kirim pesan)}
                            {--limit=0 : Batasi jumlah customer untuk broadcast}
                            {--phone= : Kirim ke nomor spesifik saja (untuk testing)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Broadcast katalog harian ke semua customer aktif via WhatsApp';

    private BaileysService $baileys;

    private int $successCount = 0;

    private int $failedCount = 0;

    private array $failedPhones = [];

    public function __construct(BaileysService $baileys)
    {
        parent::__construct();
        $this->baileys = $baileys;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $startTime = microtime(true);
        $isTest = $this->option('test');
        $limit = (int) $this->option('limit');
        $specificPhone = $this->option('phone');

        $this->info('========================================');
        $this->info('  BROADCAST KATALOG HARIAN');
        $this->info('  '.Carbon::now('Asia/Jakarta')->format('d M Y H:i:s').' WIB');
        $this->info('========================================');

        if ($isTest) {
            $this->warn('  MODE: TEST (tidak mengirim pesan)');
        }

        // Cek koneksi WhatsApp terlebih dahulu
        if (! $isTest && ! $this->checkWhatsAppConnection()) {
            return Command::FAILURE;
        }

        // Ambil daftar customer
        $customers = $this->getTargetCustomers($specificPhone, $limit);

        if ($customers->isEmpty()) {
            $this->warn('Tidak ada customer yang bisa dibroadcast.');
            Log::info('Broadcast katalog: tidak ada customer target');

            return Command::SUCCESS;
        }

        $this->info("Target broadcast: {$customers->count()} customer");
        $this->newLine();

        // Generate katalog message
        $catalogMessage = $this->generateCatalogMessage();

        if (empty($catalogMessage)) {
            $this->error('Gagal generate katalog. Tidak ada produk aktif.');
            Log::error('Broadcast katalog: gagal generate katalog');

            return Command::FAILURE;
        }

        // Preview katalog
        $this->line('--- Preview Katalog ---');
        $this->line($catalogMessage);
        $this->line('-----------------------');
        $this->newLine();

        if ($isTest) {
            $this->info('Mode test selesai. Tidak ada pesan yang dikirim.');
            $this->logSummary($customers->count(), 0, 0, $startTime);

            return Command::SUCCESS;
        }

        // Konfirmasi jika banyak customer (> 10)
        if ($customers->count() > 10 && ! $specificPhone) {
            if (! $this->confirm("Akan mengirim ke {$customers->count()} customer. Lanjutkan?")) {
                $this->info('Broadcast dibatalkan.');

                return Command::SUCCESS;
            }
        }

        // Kirim broadcast
        $this->sendBroadcast($customers, $catalogMessage);

        // Log summary
        $this->logSummary($customers->count(), $this->successCount, $this->failedCount, $startTime);

        return $this->failedCount > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    /**
     * Cek apakah WhatsApp terkoneksi
     */
    private function checkWhatsAppConnection(): bool
    {
        $this->info('Memeriksa koneksi WhatsApp...');

        if (! $this->baileys->isConnected()) {
            $this->error('WhatsApp tidak terkoneksi! Broadcast dibatalkan.');
            Log::error('Broadcast katalog: WhatsApp tidak terkoneksi');

            return false;
        }

        $this->info('WhatsApp terkoneksi.');

        return true;
    }

    /**
     * Ambil daftar customer target
     */
    private function getTargetCustomers(?string $specificPhone, int $limit): Collection
    {
        // Jika nomor spesifik diberikan
        if ($specificPhone) {
            $this->info("Mode: nomor spesifik ({$specificPhone})");

            return collect([['customer_phone' => $specificPhone]]);
        }

        // Query customer dari tabel chats
        $query = Chat::query()
            ->select('customer_phone')
            ->whereNotNull('customer_phone')
            ->where('customer_phone', '!=', '')
            ->whereIn('status', [Chat::STATUS_ACTIVE, Chat::STATUS_BOT, Chat::STATUS_ADMIN])
            ->distinct();

        if ($limit > 0) {
            $query->limit($limit);
        }

        return $query->get();
    }

    /**
     * Generate pesan katalog
     */
    private function generateCatalogMessage(): string
    {
        $today = Carbon::now('Asia/Jakarta')->format('d M Y');

        // Coba ambil dari katalog aktif terlebih dahulu
        $catalog = Catalog::active()
            ->with(['products' => function ($query) {
                $query->where('status', Product::STATUS_ACTIVE)
                    ->orderBy('type')
                    ->orderBy('name');
            }])
            ->first();

        // Jika ada katalog aktif, gunakan produk dari katalog
        if ($catalog && $catalog->products->isNotEmpty()) {
            return $this->formatCatalogProducts($today, $catalog->products, $catalog->name);
        }

        // Fallback: ambil semua produk aktif langsung
        $products = Product::active()
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        if ($products->isEmpty()) {
            return '';
        }

        return $this->formatCatalogProducts($today, $products);
    }

    /**
     * Format produk menjadi pesan katalog WhatsApp
     */
    private function formatCatalogProducts(string $date, Collection $products, ?string $catalogName = null): string
    {
        $title = $catalogName ?? 'KATALOG HARIAN';

        $message = "==============================\n";
        $message .= "*{$title} - {$date}*\n";
        $message .= "==============================\n\n";

        $counter = 1;
        $currentType = '';

        foreach ($products as $product) {
            // Tambahkan header tipe produk jika berubah
            if ($product->type !== $currentType) {
                $currentType = $product->type;
                $typeLabel = $this->getTypeLabel($currentType);
                $message .= "*{$typeLabel}*\n";
                $message .= "------------------------------\n";
            }

            $price = number_format($product->price, 0, ',', '.');
            $stockStatus = $product->stock > 0
                ? "Stok: {$product->stock} {$product->unit}"
                : 'Stok Habis';

            $stockEmoji = $product->stock > 0 ? '~' : '!';

            $message .= "{$counter}. *{$product->name}*\n";
            $message .= "   Rp {$price}/{$product->unit}\n";
            $message .= "   {$stockEmoji} {$stockStatus}\n\n";

            $counter++;
        }

        $message .= "==============================\n";
        $message .= "_Ketik \"menu\" untuk info lengkap_\n";
        $message .= "_Ketik \"pesan [produk] [jumlah]\" untuk order_\n";
        $message .= '==============================';

        return $message;
    }

    /**
     * Get label untuk tipe produk
     */
    private function getTypeLabel(string $type): string
    {
        return match ($type) {
            Product::TYPE_TELUR => 'TELUR',
            Product::TYPE_AYAM => 'AYAM',
            default => strtoupper($type),
        };
    }

    /**
     * Kirim broadcast ke semua customer
     */
    private function sendBroadcast(Collection $customers, string $message): void
    {
        $total = $customers->count();
        $bar = $this->output->createProgressBar($total);
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% -- %message%');
        $bar->start();

        foreach ($customers as $index => $customer) {
            $phone = $customer['customer_phone'] ?? $customer->customer_phone;
            $bar->setMessage("Mengirim ke {$phone}");

            try {
                $result = $this->baileys->sendMessage($phone, 'text', ['text' => $message]);

                if ($result) {
                    $this->successCount++;
                    Log::debug("Broadcast sukses ke {$phone}", ['message_id' => $result]);
                } else {
                    $this->failedCount++;
                    $this->failedPhones[] = $phone;
                    Log::warning("Broadcast gagal ke {$phone}");
                }
            } catch (\Exception $e) {
                $this->failedCount++;
                $this->failedPhones[] = $phone;
                Log::error("Broadcast error ke {$phone}", [
                    'error' => $e->getMessage(),
                ]);
            }

            $bar->advance();

            // Delay antar pesan untuk menghindari rate limit
            if ($index < $total - 1) {
                $delay = $this->getDelayBetweenMessages();
                usleep($delay * 1000); // Convert to microseconds
            }
        }

        $bar->finish();
        $this->newLine(2);
    }

    /**
     * Get delay antar pesan (dalam milliseconds)
     */
    private function getDelayBetweenMessages(): int
    {
        // Random delay antara 2-5 detik untuk menghindari ban
        return random_int(2000, 5000);
    }

    /**
     * Log dan tampilkan summary
     */
    private function logSummary(int $total, int $success, int $failed, float $startTime): void
    {
        $duration = round(microtime(true) - $startTime, 2);

        $this->info('========================================');
        $this->info('  SUMMARY BROADCAST');
        $this->info('========================================');
        $this->info("Total target    : {$total}");
        $this->info("Berhasil        : {$success}");
        $this->info("Gagal           : {$failed}");
        $this->info("Durasi          : {$duration} detik");
        $this->info('========================================');

        if (! empty($this->failedPhones)) {
            $this->warn('Nomor yang gagal:');
            foreach ($this->failedPhones as $phone) {
                $this->warn("  - {$phone}");
            }
        }

        // Log ke file
        Log::channel('daily')->info('Broadcast katalog selesai', [
            'total' => $total,
            'success' => $success,
            'failed' => $failed,
            'duration_seconds' => $duration,
            'failed_phones' => $this->failedPhones,
            'timestamp' => Carbon::now('Asia/Jakarta')->toIso8601String(),
        ]);
    }
}
