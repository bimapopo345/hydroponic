# ESP32 Auto-Recovery Harvest Mode

Sistem kontrol hidroponik dengan fitur otomatis kembali ke mode normal setelah masa panen.

## Cara Kerja

1. Mode Normal:

   - Threshold bisa diatur (100-799 PPM)
   - Relay ON jika PPM < threshold
   - Monitoring semua sensor
   - Display info lengkap

2. Mode Panen (Threshold 800):

   - Timer 1 jam dimulai otomatis
   - Kontrol PPM normal selama timer berjalan
   - Setelah 1 jam, relay OFF
   - Display status panen

3. Auto-Recovery:
   - Kembali ke mode normal saat threshold diubah < 800
   - Tidak perlu reset ESP32
   - Kontrol langsung aktif dengan threshold baru
   - Flag mode panen direset

## Status & Indikator

1. LCD Display:

   ```
   Mode Normal:
   ppm=350 pH=7.00    // Baris 1: PPM dan pH
   tmp=25.5 cap=75%   // Baris 2: Suhu dan kapasitas

   Mode Panen (aktif):
   ppm=750 pH=7.00    // Baris 1: PPM dan pH
   Panen: 45:30       // Baris 2: Timer countdown

   Mode Panen (selesai):
   ppm=800 pH=7.00    // Baris 1: PPM dan pH
   Mode Panen OFF     // Baris 2: Status panen
   ```

2. Serial Monitor:
   ```
   > PPM threshold diupdate: 800
   > Mode panen dimulai! Timer 1 jam aktif.
   > Mode Panen - Relay ON (PPM: 750.0)
   > Sisa waktu: 00:45:30
   > Timer 1 jam habis!
   > PPM threshold diupdate: 100
   > Kembali ke mode normal!
   > Mode Normal - Relay ON (PPM: 90.0, Target: 100)
   ```

## Variabel Status

```cpp
bool harvestMode = false;   // Mode panen aktif/tidak
bool timerStarted = false;  // Timer sedang berjalan
unsigned long timerStartTime = 0;  // Waktu mulai timer
const unsigned long ONE_HOUR = 3600000;  // 1 jam dalam ms
```

## Flow Kontrol

1. Deteksi Mode:

   ```mermaid
   graph TD
   A[Get threshold] --> B{threshold = 800?}
   B -- Ya --> C{harvestMode aktif?}
   B -- Tidak --> D[Mode normal]
   C -- Tidak --> E[Start timer]
   C -- Ya --> F[Lanjut timer]
   D --> G[Reset harvest flags]
   ```

2. Kontrol Relay:
   ```mermaid
   graph TD
   A[Cek mode] --> B{Mode panen?}
   B -- Ya --> C{Timer aktif?}
   B -- Tidak --> D[Kontrol normal]
   C -- Ya --> E{PPM < 800?}
   C -- Tidak --> F[Relay OFF]
   E -- Ya --> G[Relay ON]
   E -- Tidak --> H[Relay OFF]
   ```

## Penggunaan

1. Setup:

   - Pastikan backend running
   - Update ngrok URL
   - Upload kode ke ESP32

2. Operasi Normal:

   - Set threshold sesuai kebutuhan (100-799)
   - Monitor PPM via LCD/Serial
   - Sistem kontrol relay otomatis

3. Mode Panen:

   - Set threshold 800 di web
   - Timer 1 jam mulai otomatis
   - Monitor countdown di LCD
   - Setelah 1 jam pompa OFF

4. Kembali ke Normal:
   - Set threshold < 800 di web
   - Sistem otomatis switch ke mode normal
   - Kontrol normal langsung aktif

## Troubleshooting

1. Mode Panen Tidak Aktif:

   - Verifikasi threshold = 800
   - Cek koneksi API
   - Monitor flag harvestMode

2. Timer Tidak Jalan:

   - Cek timerStarted flag
   - Monitor Serial log
   - Verifikasi waktu sistem

3. Tidak Kembali ke Normal:

   - Cek threshold baru < 800
   - Monitor flag reset
   - Verifikasi koneksi API

4. Relay Tidak Respon:
   - Monitor status mode
   - Cek nilai PPM aktual
   - Verifikasi pin relay

## Notes

1. Sistem ini menggunakan threshold 800 sebagai trigger mode panen
2. Auto-recovery memungkinkan sistem kembali normal tanpa reset
3. Timer 1 jam cukup untuk mencapai PPM target
4. Mode panen dapat diulang dengan set 800 lagi
5. Semua perubahan dan status ter-log di Serial
