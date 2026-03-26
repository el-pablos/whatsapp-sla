# Bug Fix: Baileys Session Path Double Wrapping

## Deskripsi Bug

**Error Message:**
```
RuntimeException: Baileys session directory not writable: /root/work/apps/whatsapp-sla/storage/root/work/apps/whatsapp-sla/storage/app/baileys-sessions
```

**Environment:** Production
**Severity:** High - Mencegah aplikasi berjalan normal
**Tanggal Fix:** 2026-03-26

## Root Cause Analysis

### Alur Masalah

1. Di `.env`, `BAILEYS_SESSION_PATH` di-set ke absolute path:
   ```
   BAILEYS_SESSION_PATH=/root/work/apps/whatsapp-sla/storage/app/baileys-sessions
   ```

2. Di `config/baileys.php`, default value menggunakan `storage_path()`:
   ```php
   'session_path' => env('BAILEYS_SESSION_PATH', storage_path('app/baileys-sessions')),
   ```

3. Di `BaileysServiceProvider::ensureBaileysDirectories()`, tidak ada pengecekan apakah path sudah absolute atau masih relative sebelum digunakan

4. Ketika config di-cache atau dalam kondisi tertentu, terjadi double wrapping dimana `storage_path()` dipanggil pada path yang sudah absolute, menghasilkan path yang rusak

### Teknik Diagnosa: 5 Whys

- **Why 1:** Kenapa path jadi double? Karena `storage_path()` dipanggil pada absolute path
- **Why 2:** Kenapa `storage_path()` dipanggil pada absolute path? Karena config value dari env sudah absolute
- **Why 3:** Kenapa code tidak mendeteksi itu sudah absolute? Karena tidak ada conditional check
- **Why 4:** Kenapa tidak ada conditional check? Karena asumsi awal config selalu return relative path
- **Why 5:** Kenapa asumsi itu salah? Karena env variable bisa berisi absolute atau relative path

**Root Cause:** Missing conditional check untuk handle absolute vs relative path di `ensureBaileysDirectories()`

## Files Affected

| File | Baris | Perubahan |
|------|-------|-----------|
| `app/Providers/BaileysServiceProvider.php` | 199-237 | Tambah `resolvePath()` method dan update `ensureBaileysDirectories()` |
| `config/baileys.php` | 18, 26, 34, 42 | Ubah default value ke relative path (tanpa `storage_path()`) |

## Fix yang Diterapkan

### 1. Config `config/baileys.php`

**Sebelum:**
```php
'session_path' => env('BAILEYS_SESSION_PATH', storage_path('app/baileys-sessions')),
```

**Sesudah:**
```php
'session_path' => env('BAILEYS_SESSION_PATH', 'app/baileys-sessions'),
```

Default value diubah ke relative path. `storage_path()` wrapping dilakukan di provider.

### 2. Provider `app/Providers/BaileysServiceProvider.php`

Ditambahkan helper method `resolvePath()`:
```php
private function resolvePath(string $path): string
{
    if (str_starts_with($path, '/')) {
        return $path;
    }

    return storage_path($path);
}
```

Method `ensureBaileysDirectories()` diupdate untuk menggunakan `resolvePath()`:
```php
$directories = [
    $this->resolvePath(config('baileys.session_path', 'app/baileys-sessions')),
    $this->resolvePath(config('baileys.auth_state_path', 'app/baileys-auth')),
    $this->resolvePath(config('baileys.media_path', 'app/baileys-media')),
    $this->resolvePath(config('baileys.logs_path', 'logs/baileys')),
];
```

## Unit Test Results

### TC-001: Absolute Path Resolution
- **Pre-condition:** Path dimulai dengan `/`
- **Input:** `/root/work/apps/whatsapp-sla/storage/app/baileys-sessions`
- **Expected:** Return path tanpa modifikasi
- **Actual:** `/root/work/apps/whatsapp-sla/storage/app/baileys-sessions`
- **Status:** PASSED

### TC-002: Relative Path Resolution
- **Pre-condition:** Path tidak dimulai dengan `/`
- **Input:** `app/baileys-sessions`
- **Expected:** Return `storage_path('app/baileys-sessions')`
- **Actual:** `/root/work/apps/whatsapp-sla/storage/app/baileys-sessions`
- **Status:** PASSED

### TC-003: No Double Path Wrapping
- **Pre-condition:** Absolute path dari env
- **Input:** Config value dari `BAILEYS_SESSION_PATH`
- **Expected:** Hanya satu `/storage` dalam path
- **Actual:** Path hanya mengandung satu `/storage`
- **Status:** PASSED

### TC-004: Application Boot
- **Pre-condition:** Fix sudah diterapkan
- **Input:** `php artisan about`
- **Expected:** Tidak ada RuntimeException
- **Actual:** Aplikasi boot dengan sukses
- **Status:** PASSED

### Summary
```
Total test cases: 4
Passed: 4
Failed: 0
Hasil: 100% PASSED
```

## Backup Location

```
backup-files/01-baileys-double-path-fix/
├── app/
│   └── Providers/
│       └── BaileysServiceProvider.php
├── config/
│   └── baileys.php
└── BACKUP_INFO.txt
```

## Verification Steps

1. Clear config cache: `php artisan config:clear`
2. Clear application cache: `php artisan cache:clear`
3. Test aplikasi boot: `php artisan about`
4. Verifikasi path resolution di tinker

## Catatan Tambahan

- Fix ini backward-compatible: jika env tidak di-set, akan menggunakan default relative path yang kemudian di-wrap dengan `storage_path()`
- Jika ingin menggunakan relative path di env, cukup set tanpa leading slash: `BAILEYS_SESSION_PATH=app/custom-sessions`
- Jika ingin menggunakan absolute path di env, set dengan leading slash: `BAILEYS_SESSION_PATH=/custom/path/sessions`
