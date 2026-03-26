# Feature: Customer Cek Status Order via WhatsApp Bot

## Deskripsi

Fitur yang memungkinkan customer untuk mengecek status pesanan mereka melalui WhatsApp bot tanpa perlu menghubungi admin.

## Commands yang Ditambahkan

### 1. Cek Pesanan (List Orders)
**Trigger:**
- `cek pesanan`
- `cek order`
- `pesanan saya`
- `order saya`
- `riwayat pesanan`
- `history order`

**Response Format:**
```
📦 *PESANAN ANDA*

#1234 - 26 Mar 2026
├ Telur Ayam 5 peti
├ Total: Rp 225.000
└ Status: ✅ Selesai

#1235 - 27 Mar 2026
├ Ayam Broiler 2 kg
├ Total: Rp 70.000
└ Status: ⏳ Menunggu

_Ketik "status [nomor]" untuk detail_
```

### 2. Status Detail Pesanan
**Trigger:** `status [order_id]`
**Contoh:** `status 1235` atau `status #1235`

**Response Format:**
```
📦 *DETAIL PESANAN #1235*

📅 Tanggal: 27 Mar 2026, 10:30
👤 Nama: Tamas
📱 Phone: 6281xxx

📝 Items:
• Ayam Broiler x 2 kg = Rp 70.000

💵 Total: Rp 70.000
📊 Status: ⏳ Menunggu

_Admin akan menghubungi Anda_
```

## Status Mapping

| Status DB   | Emoji + Label        |
|-------------|----------------------|
| pending     | ⏳ Menunggu          |
| confirmed   | ✔️ Dikonfirmasi      |
| processing  | 🔄 Diproses          |
| completed   | ✅ Selesai           |
| cancelled   | ❌ Dibatalkan        |

## File yang Diubah

### 1. `baileys-service/src/bot.ts`
- Line 71-91: Update interface `Order` dengan field tambahan (items, customer, pricing)
- Line 92-106: Tambah interface `OrderItem`
- Line 218-233: Tambah fungsi `getCustomerOrders()` dan `getOrderDetail()`
- Line 266-306: Tambah fungsi `getStatusDisplay()`, `formatDate()`, `formatDateTime()`
- Line 308-380: Tambah fungsi `formatOrderList()` dan `formatOrderDetail()`
- Line 591-638: Tambah command handler untuk "cek pesanan" dan "status [id]"
- Line 720-721: Update help text dengan perintah baru

### 2. `routes/api.php`
- Line 104-106: Tambah route `/api/bot/orders/customer/{phone}` dan `/api/bot/orders/{id}`

### 3. `app/Http/Controllers/Api/OrderController.php`
- Line 156-178: Tambah method `byCustomerPhone($phone)` untuk query orders berdasarkan phone

## Laravel API Endpoints

### GET `/api/bot/orders/customer/{phone}`
**Header:** `X-Bot-Secret: [secret]`
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1235,
      "customer": {
        "phone": "6281xxx",
        "name": "Tamas"
      },
      "items": [
        {
          "product_name": "Ayam Broiler",
          "quantity": 2,
          "price": 35000,
          "subtotal": 70000
        }
      ],
      "pricing": {
        "total": 70000,
        "formatted_total": "Rp 70.000"
      },
      "status": "pending",
      "created_at": "2026-03-27T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "phone": "6281xxx"
  }
}
```

### GET `/api/bot/orders/{id}`
**Header:** `X-Bot-Secret: [secret]`
**Response:** Single order object dengan format yang sama

## Security

- Customer hanya bisa melihat pesanan milik mereka sendiri (validasi phone number)
- Admin dapat melihat semua pesanan
- Semua request dilindungi oleh `X-Bot-Secret` header

## Testing

1. Kirim pesan `cek pesanan` ke bot
2. Kirim pesan `status 1` ke bot (ganti 1 dengan order ID yang valid)
3. Verifikasi response sesuai format yang diharapkan

## Tanggal Implementasi

27 Maret 2026
