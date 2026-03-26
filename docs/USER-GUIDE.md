# 📱 Panduan Penggunaan WhatsApp SLA System

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp SLA System                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Laravel    │◄──►│   Baileys    │◄──►│   WhatsApp   │  │
│  │   Backend    │    │   Service    │    │   Server     │  │
│  │  (Port 8000) │    │  (Port 3001) │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                   │                               │
│         ▼                   ▼                               │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │   Database   │    │   Session    │                      │
│  │   (MySQL)    │    │   Storage    │                      │
│  └──────────────┘    └──────────────┘                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

# 🔐 POV ADMIN - Mengelola Sistem

## 1. Autentikasi WhatsApp

### A. Via QR Code (Recommended untuk First Setup)

```bash
cd /root/work/apps/whatsapp-sla/baileys-service

# Clear session lama (optional)
rm -rf sessions/main

# Jalankan auth QR
npx ts-node src/quick-qr.ts
```

Lalu scan QR yang muncul dengan WhatsApp HP.

### B. Via Pairing Code

```bash
# Ganti nomor sesuai kebutuhan
npx ts-node src/quick-pair.ts 6281385427537
```

Masukkan code 8 digit di WhatsApp HP:
1. Settings → Linked Devices
2. Link a Device
3. Link with phone number instead
4. Input code yang muncul

---

## 2. Menjalankan Service (Production)

### A. Start Baileys Service

```bash
cd /root/work/apps/whatsapp-sla/baileys-service

# Development
npm run start:dev

# Production (dengan PM2)
npm run build
pm2 start dist/startup.js --name baileys-service
pm2 save
```

### B. Start Laravel Backend

```bash
cd /root/work/apps/whatsapp-sla

# Development
php artisan serve --host=0.0.0.0

# Production (dengan PM2/Supervisor)
pm2 start "php artisan octane:start" --name laravel-sla
```

---

## 3. Monitoring & Health Check

### Baileys Service Status

```bash
# Via CLI
curl http://localhost:3001/health

# Response jika OK:
{
  "status": "healthy",
  "connection": "open",
  "authenticated": true,
  "jid": "6281385427537@s.whatsapp.net"
}
```

### Laravel API Status

```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/health/baileys
```

---

## 4. Mengelola Products

### List Products
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/products
```

### Tambah Product
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Telur Ayam","price":25000,"stock":100}' \
  http://localhost:8000/api/products
```

### Update Stock
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stock":150}' \
  http://localhost:8000/api/products/1/stock
```

---

## 5. Mengelola Orders

### List Orders
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/orders
```

### Update Order Status
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"processing"}' \
  http://localhost:8000/api/orders/1/status
```

Status values: `pending`, `processing`, `shipped`, `completed`, `cancelled`

---

## 6. Mengelola Chats

### List Active Chats
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/chats
```

### Assign Handler ke Chat
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"handler_id":1}' \
  http://localhost:8000/api/chats/1
```

---

## 7. Kirim Pesan Manual

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "6281234567890",
    "message": "Halo, pesanan Anda sedang diproses!"
  }' \
  http://localhost:8000/api/messages
```

---

## 8. Troubleshooting

### Error 515 (Restart Required)
```bash
# Clear session dan tunggu 2-5 menit
rm -rf sessions/main
# Tunggu...
npx ts-node src/quick-qr.ts
```

### WhatsApp Logged Out
```bash
# Session perlu di-clear dan re-auth
rm -rf sessions/main
npx ts-node src/quick-qr.ts
```

### Connection Lost Terus
1. Cek internet server
2. Restart Baileys service
3. Jika masih gagal, clear session dan auth ulang

---

# 👤 POV USER/CUSTOMER - Berinteraksi dengan Bot

## Cara Menggunakan

### 1. Simpan Nomor Bot
Simpan nomor `+62 813-8542-7537` ke kontak HP kamu.

### 2. Mulai Chat
Kirim pesan pertama ke nomor bot untuk memulai.

---

## Perintah yang Tersedia

### 📋 Melihat Menu/Katalog
```
menu
katalog
daftar produk
```

Bot akan mengirim daftar produk yang tersedia.

### 🛒 Membuat Pesanan
```
pesan [nama produk] [jumlah]
order [nama produk] [jumlah]
beli [nama produk] [jumlah]
```

Contoh:
```
pesan telur 2 kg
order ayam potong 1
beli pakan 5 karung
```

### 📦 Cek Status Pesanan
```
status pesanan
cek pesanan
pesanan saya
```

### ❓ Bantuan
```
help
bantuan
cara pesan
```

### 🔄 Batalkan Pesanan
```
batal pesanan [nomor]
cancel [nomor pesanan]
```

---

## Contoh Flow Percakapan

```
Customer: Halo
Bot:     Selamat datang di Toko Ayam! 🐔
         Ketik "menu" untuk melihat produk kami.

Customer: menu
Bot:     📋 DAFTAR PRODUK
         1. Telur Ayam - Rp 25.000/kg
         2. Ayam Potong - Rp 35.000/ekor
         3. Pakan Ayam - Rp 150.000/karung

         Ketik "pesan [produk] [jumlah]" untuk order

Customer: pesan telur 5 kg
Bot:     ✅ Pesanan diterima!

         📝 Detail Pesanan:
         - Produk: Telur Ayam
         - Jumlah: 5 kg
         - Harga: Rp 125.000

         No. Pesanan: #ORD-2024-001

         Kami akan menghubungi untuk konfirmasi.

Customer: status pesanan
Bot:     📦 Status Pesanan #ORD-2024-001

         Status: Diproses ⏳
         Estimasi: 1-2 jam
```

---

## Tips untuk Customer

1. **Respon Cepat**: Bot merespon dalam hitungan detik
2. **Format Jelas**: Tulis pesan dengan jelas, contoh: "pesan telur 2 kg"
3. **Simpan No. Pesanan**: Catat nomor pesanan untuk tracking
4. **Jam Operasional**: Bot aktif 24/7, tapi pengiriman sesuai jam kerja
5. **Hubungi Admin**: Jika ada masalah, ketik "hubungi admin"

---

## FAQ Customer

**Q: Bagaimana cara bayar?**
A: Setelah pesanan dikonfirmasi, bot akan mengirim detail pembayaran (Transfer/COD).

**Q: Berapa lama pengiriman?**
A: Tergantung lokasi, biasanya 1-3 jam untuk area sekitar.

**Q: Bisa cancel pesanan?**
A: Ya, ketik "batal pesanan [nomor]" sebelum status "dikirim".

**Q: Minimum order?**
A: Tidak ada minimum order.

---

# 📊 Endpoint API Lengkap

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | `/api/health` | Health check |
| GET | `/api/health/baileys` | Baileys status |
| POST | `/api/auth/login` | Login admin |
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Create order |
| PATCH | `/api/orders/{id}/status` | Update status |
| GET | `/api/chats` | List chats |
| POST | `/api/messages` | Send message |

---

*Dokumentasi ini untuk WhatsApp SLA System v1.0.0*
