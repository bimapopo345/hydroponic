# ESP32 Harvest Control - Panduan

Sistem kontrol hidroponik dengan mode khusus untuk masa panen (PPM 800).

## Cara Kerja Mode Panen

1. Aktivasi Mode Panen:

   - Terpicu saat API mengirim threshold 800 PPM
   - Timer 1 jam dimulai otomatis
   - HarvestMode flag diaktifkan

2. Selama Timer Berjalan (1 Jam):

   - Pompa ON jika PPM < 800
   - Pompa OFF jika PPM ≥ 800
   - Display menunjukkan sisa waktu

3. Setelah Timer Habis:
   - Pompa OFF permanen
   - Tidak ada lagi kontrol PPM
   - Status "PANEN SELESAI" di LCD
   - Perlu reset ESP32 untuk siklus baru

## Indikator Status

1. LCD Display:

   ```
   PPM Normal:
   ppm=350 pH=7.00
   tmp=25.5 cap=75%

   Mode Panen (aktif):
   ppm=750 pH=7.00
   Panen: 45:30

   Panen Selesai:
   ppm=800 pH=7.00
   PANEN SELESAI!
   ```

2. Serial Monitor:
   ```
   > Mode panen dimulai! Timer 1 jam aktif.
   > PPM threshold diupdate: 800
   > Sisa waktu mode panen: 00:45:30
   > Timer 1 jam habis - Mode panen selesai!
   ```

## Flag Status

```cpp
bool harvestMode = false;  // Mode panen aktif/tidak
bool timerExpired = false; // Timer sudah habis/belum
bool timerStarted = false; // Timer sedang berjalan/tidak
```

## Flow Kontrol

1. Deteksi PPM 800:

   ```mermaid
   graph TD
   A[Terima threshold 800] --> B{harvestMode aktif?}
   B -- Tidak --> C[Mulai timer 1 jam]
   B -- Ya --> D[Lanjut normal]
   C --> E[Aktifkan harvestMode]
   ```

2. Kontrol Pompa:
   ```mermaid
   graph TD
   A[Cek harvestMode] --> B{Timer masih aktif?}
   B -- Ya --> C{PPM < 800?}
   B -- Tidak --> D[Pompa OFF permanen]
   C -- Ya --> E[Pompa ON]
   C -- Tidak --> F[Pompa OFF]
   ```

## Penggunaan

1. Fase Vegetatif (Normal):

   - Threshold < 800
   - Pompa kontrol normal
   - Display info lengkap

2. Fase Panen:
   - Set threshold 800 di web
   - Tunggu timer 1 jam
   - Pompa akan OFF permanen
   - Reset ESP32 untuk siklus baru

## Troubleshooting

1. Timer Tidak Mulai:

   - Cek koneksi API
   - Verifikasi threshold = 800
   - Reset ESP32 jika perlu

2. Pompa Tetap ON:

   - Cek status timer di Serial
   - Verifikasi harvestMode flag
   - Monitor nilai PPM aktual

3. Display Error:
   - Cek koneksi LCD
   - Monitor Serial log
   - Reset jika tampilan kacau

## Notes Penting

- Timer 1 jam adalah batas akhir kontrol PPM
- Setelah timer habis, sistem tidak akan mengontrol PPM lagi
- Kondisi ini menandakan tanaman siap panen
- Reset ESP32 diperlukan untuk memulai siklus baru
- Simpan log panen di Serial Monitor
