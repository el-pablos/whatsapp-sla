<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

/*
|--------------------------------------------------------------------------
| Broadcast Katalog Harian
|--------------------------------------------------------------------------
|
| Mengirim katalog produk ke semua customer aktif setiap hari jam 07:00 WIB.
| Command akan mengecek koneksi WhatsApp terlebih dahulu dan skip jika
| tidak terkoneksi.
|
*/
Schedule::command('broadcast:catalog')
    ->dailyAt('07:00')
    ->timezone('Asia/Jakarta')
    ->name('broadcast-daily-catalog')
    ->withoutOverlapping()
    ->runInBackground()
    ->onSuccess(function () {
        Log::info('Broadcast katalog harian selesai dengan sukses');
    })
    ->onFailure(function () {
        Log::error('Broadcast katalog harian gagal');
    })
    ->appendOutputTo(storage_path('logs/broadcast-catalog.log'));
