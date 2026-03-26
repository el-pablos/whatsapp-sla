# Broadcast Katalog Harian

Fitur broadcast otomatis untuk mengirim katalog produk ke semua customer aktif via WhatsApp setiap hari.

## Overview

Sistem broadcast katalog berjalan secara terjadwal setiap hari jam 07:00 WIB. Katalog yang dikirim berisi daftar produk aktif beserta harga dan stok terkini.

## Komponen

### 1. Laravel Artisan Command

**File:** `app/Console/Commands/BroadcastDailyCatalog.php`

Command untuk mengirim broadcast katalog ke customer.

```bash
# Jalankan manual dengan mode test (tidak kirim pesan)
php artisan broadcast:catalog --test

# Kirim ke semua customer
php artisan broadcast:catalog

# Kirim ke nomor spesifik (untuk testing)
php artisan broadcast:catalog --phone=6281234567890

# Batasi jumlah customer
php artisan broadcast:catalog --limit=10
```

### 2. Schedule Configuration

**File:** `routes/console.php`

Schedule dijalankan setiap hari jam 07:00 WIB:

```php
Schedule::command('broadcast:catalog')
    ->dailyAt('07:00')
    ->timezone('Asia/Jakarta')
    ->name('broadcast-daily-catalog')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/broadcast-catalog.log'));
```

### 3. Baileys Broadcast API

**File:** `baileys-service/src/api/broadcast.ts`

Endpoint untuk mengirim pesan ke multiple nomor WhatsApp.

#### Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/broadcast` | Kirim ke multiple nomor |
| POST | `/broadcast/single` | Kirim ke satu nomor |
| GET | `/broadcast/status` | Cek status koneksi |

#### POST /broadcast

Request body:
```json
{
  "phones": ["6281234567890", "6289876543210"],
  "message": "Pesan broadcast",
  "delay_ms": 2000
}
```

Response:
```json
{
  "success": true,
  "total": 2,
  "sent": 2,
  "failed": 0,
  "results": [
    { "phone": "6281234567890", "success": true, "message_id": "xxx" },
    { "phone": "6289876543210", "success": true, "message_id": "yyy" }
  ],
  "duration_ms": 5432
}
```

## Format Katalog

Katalog yang dikirim memiliki format sebagai berikut:

```
==============================
*KATALOG HARIAN - 27 Mar 2026*
==============================

*TELUR*
------------------------------
1. *Telur Ayam Negeri*
   Rp 45.000/peti
   ~ Stok: 150 peti

2. *Telur Ayam Kampung*
   Rp 3.000/pcs
   ~ Stok: 200 pcs

*AYAM*
------------------------------
3. *Ayam Broiler Potong*
   Rp 35.000/kg
   ~ Stok: 100 kg

==============================
_Ketik "menu" untuk info lengkap_
_Ketik "pesan [produk] [jumlah]" untuk order_
==============================
```

## Customer Target

Customer yang menerima broadcast adalah:
- Memiliki nomor telepon (`customer_phone` tidak null/kosong)
- Status chat: `active`, `bot`, atau `admin`
- Data diambil dari tabel `chats`

## Logging

Log broadcast disimpan di:
- Console output: `storage/logs/broadcast-catalog.log`
- Laravel log: `storage/logs/laravel.log` (channel: daily)

Format log:
```
[2026-03-27 07:00:15] INFO: Broadcast katalog selesai {
    "total": 50,
    "success": 48,
    "failed": 2,
    "duration_seconds": 125.3,
    "failed_phones": ["628xxx", "628yyy"],
    "timestamp": "2026-03-27T07:00:15+07:00"
}
```

## Troubleshooting

### WhatsApp tidak terkoneksi

Jika broadcast gagal karena WhatsApp tidak terkoneksi:
1. Cek status WhatsApp: `php artisan baileys:status`
2. Reconnect jika perlu: `php artisan baileys:connect`

### Rate Limiting

Untuk menghindari rate limiting dari WhatsApp:
- Delay default antar pesan: 2-5 detik (random)
- Jangan broadcast ke lebih dari 50 nomor sekaligus di jam sibuk

### Menjalankan Manual

Jika schedule tidak berjalan, jalankan manual:
```bash
php artisan broadcast:catalog
```

Atau via cron:
```bash
0 7 * * * cd /path/to/project && php artisan broadcast:catalog >> /dev/null 2>&1
```

## Configuration

Environment variables terkait:

```env
# Baileys Service
BAILEYS_API_URL=http://127.0.0.1:3002
BAILEYS_TIMEOUT=30
BAILEYS_RETRY_ATTEMPTS=3
```

## Best Practices

1. **Testing**: Selalu test dengan `--test` flag sebelum broadcast production
2. **Timing**: Kirim di jam yang wajar (pagi atau siang)
3. **Content**: Pastikan katalog ter-update sebelum broadcast
4. **Monitoring**: Pantau log untuk mendeteksi masalah

## Related Files

- `app/Console/Commands/BroadcastDailyCatalog.php` - Artisan command
- `routes/console.php` - Schedule registration
- `baileys-service/src/api/broadcast.ts` - Broadcast API endpoint
- `app/Services/BaileysService.php` - Laravel service untuk baileys
- `app/Models/Chat.php` - Model customer chat
- `app/Models/Product.php` - Model produk
- `app/Models/Catalog.php` - Model katalog
