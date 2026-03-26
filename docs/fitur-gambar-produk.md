# Fitur Kirim Gambar Produk via WhatsApp Bot

**Tanggal Implementasi:** 2026-03-27
**File yang Diubah:** `baileys-service/src/bot.ts`

## Deskripsi

Implementasi fitur untuk mengirim gambar produk via WhatsApp bot menggunakan Baileys. Fitur ini memungkinkan customer untuk melihat foto produk sebelum melakukan pemesanan.

## Perubahan yang Dilakukan

### 1. Update Interface Product (Line 55-64)
Menambahkan field `image` pada interface Product untuk mendukung URL atau path gambar.

```typescript
interface Product {
  id: number;
  name: string;
  type: string;
  price: number;
  stock: number;
  unit: string;
  status: string;
  image: string | null;  // <- field baru
}
```

### 2. Fungsi sendImageMessage (Line 405-437)
Fungsi generic untuk mengirim gambar dengan caption ke WhatsApp.
- Support URL gambar (http/https)
- Support local file path
- Return undefined jika gagal kirim

```typescript
async function sendImageMessage(
  socket: WASocket,
  jid: string,
  imageUrl: string,
  caption?: string,
): Promise<proto.WebMessageInfo | undefined>
```

### 3. Fungsi sendProductImage (Line 442-480)
Fungsi untuk mengirim gambar produk dengan caption detail.
- Format caption mencakup nama, harga, stok, dan tipe produk
- Fallback ke text jika produk tidak punya gambar
- Fallback ke text jika gagal mengirim gambar

```typescript
async function sendProductImage(
  socket: WASocket,
  jid: string,
  product: Product,
): Promise<proto.WebMessageInfo | undefined>
```

### 4. Fungsi sendCatalogWithImages (Line 485-528)
Fungsi untuk mengirim katalog produk dengan gambar (multiple produk).
- Kirim header, gambar-gambar produk, dan footer
- Delay 500ms antar gambar untuk menghindari rate limit
- Produk tanpa gambar ditampilkan sebagai text list
- Default maksimal 5 gambar

```typescript
async function sendCatalogWithImages(
  socket: WASocket,
  jid: string,
  products: Product[],
  maxImages: number = 5,
): Promise<void>
```

### 5. Command Handler Baru (Line 690-717)

#### Command `foto [produk]` / `gambar [produk]`
Mengirim foto produk spesifik dengan caption detail.

```
foto telur     -> Kirim gambar telur dengan harga/stok
gambar ayam    -> Kirim gambar ayam dengan harga/stok
```

#### Command `katalog gambar` / `katalog foto` / `menu gambar` / `menu foto`
Mengirim katalog lengkap dengan gambar untuk setiap produk.

```
katalog gambar -> Kirim semua gambar produk
menu foto      -> Kirim semua gambar produk
```

### 6. Update Help Command (Line 892-904)
Menambahkan petunjuk fitur baru di menu bantuan:
- `foto [produk]` - Lihat foto produk
- `katalog gambar` - Lihat katalog dengan gambar

## Cara Penggunaan

### Untuk Customer:
1. Ketik `foto telur` untuk melihat foto telur
2. Ketik `gambar ayam` untuk melihat foto ayam
3. Ketik `katalog gambar` untuk melihat semua produk dengan gambar
4. Ketik `menu foto` untuk melihat katalog dengan gambar

### Response Format:
```
[GAMBAR]
📦 *TELUR*

💰 Harga: Rp28.000/kg
📊 ✅ Stok: 100 kg
📝 Tipe: telur

_Ketik "pesan Telur [jumlah]" untuk order_
```

## Cara Verifikasi

1. Pastikan produk memiliki field `image` yang terisi URL atau path gambar
2. Kirim command `foto [nama_produk]` via WhatsApp
3. Bot akan merespon dengan gambar dan caption detail produk
4. Jika gambar tidak tersedia, bot akan mengirim text saja (fallback)

## Catatan Teknis

### Format Gambar yang Didukung:
- URL gambar (http:// atau https://)
- Local file path (harus absolute path)

### Fallback Mechanism:
1. Jika produk tidak punya gambar (`image: null`), kirim text saja
2. Jika gagal fetch gambar dari URL, kirim text saja
3. Jika file lokal tidak ditemukan, return undefined

### Rate Limiting:
- Delay 500ms antar gambar untuk menghindari rate limit WhatsApp
- Maksimal 5 gambar per katalog (dapat dikonfigurasi)

## Model Laravel

Field `image` sudah tersedia di:
- Migration: `database/migrations/2024_01_01_000002_create_products_table.php` (line 22)
- Model: `app/Models/Product.php` (di `$fillable` array, line 38)
- API Controller: `app/Http/Controllers/Api/ProductController.php` (validation di store/update)

## File Backup

Original file tersedia di:
```
backup-files/fitur-gambar-produk/bot.ts
```

## File Fixed

File yang sudah diupdate tersedia di:
```
fixed-files/fitur-gambar-produk/bot.ts
```
