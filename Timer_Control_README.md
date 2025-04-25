# ESP32 Timer Control untuk Hidroponik

Versi khusus ESP32 dengan fitur timer 1 jam untuk threshold PPM 800.

## Cara Kerja Timer

1. Kondisi Normal (Threshold < 800):

   - Relay ON jika PPM < threshold
   - Relay OFF jika PPM >= threshold
   - Normal cycle control

2. Kondisi Threshold 800:
   - Timer 1 jam dimulai otomatis
   - Relay ON selama timer berjalan
   - Relay OFF setelah 1 jam
   - Timer reset jika threshold 800 terdeteksi lagi

## Status Display

1. LCD Display:

   - Mode Normal:
     ```
     ppm=350 pH=7.00
     tmp=25.5 cap=75%
     ```
   - Mode Timer:
     ```
     ppm=350 pH=7.00
     Timer: MM:SS
     ```

2. Serial Monitor:
   - Status timer dengan format HH:MM:SS
   - PPM threshold updates
   - Relay status
   - Network status

## Variabel Timer

```cpp
bool timerStarted = false;           // Status timer
unsigned long timerStartTime = 0;     // Waktu mulai
const unsigned long ONE_HOUR = 3600000; // 1 jam (ms)
bool highThresholdDetected = false;   // Flag 800 PPM
```

## Flow Control

1. Deteksi Threshold 800:

   ```cpp
   if (ppmThreshold == 800 && !highThresholdDetected) {
     // Mulai timer baru
     highThresholdDetected = true;
     timerStarted = true;
     timerStartTime = millis();
   }
   ```

2. Timer Operation:
   ```cpp
   if (millis() - timerStartTime >= ONE_HOUR) {
     // Timer selesai
     digitalWrite(relayPin1, LOW);
     digitalWrite(relayPin2, LOW);
     timerStarted = false;
   } else {
     // Timer masih berjalan
     digitalWrite(relayPin1, HIGH);
     digitalWrite(relayPin2, HIGH);
   }
   ```

## Penggunaan

1. Hardware:

   - ESP32
   - 2 Relay Module
   - Sensor set (TDS, pH, suhu, ultrasonik)
   - LCD I2C

2. Konfigurasi:

   - Update WiFi credentials
   - Update ngrok URL
   - Upload kode ke ESP32

3. Operasi:
   - Power ON device
   - Tunggu koneksi WiFi
   - System akan mengambil threshold dari API
   - Monitor LCD & Serial untuk status

## Troubleshooting

1. Timer Tidak Berjalan:

   - Cek threshold dari API (harus 800)
   - Monitor Serial untuk status timer
   - Reset ESP32 jika perlu

2. Timer Reset Terlalu Cepat:

   - Cek stabilitas koneksi WiFi
   - Verifikasi threshold tetap 800
   - Monitor log perubahan threshold

3. Display Error:
   - Cek format waktu di LCD
   - Verifikasi Serial output
   - Reset LCD jika tampilan kacau

## Notes

- Timer hanya aktif untuk threshold 800
- Timer akan reset jika:
  - ESP32 reboot
  - Threshold berubah kemudian kembali ke 800
- LCD menampilkan MM:SS (menit:detik)
- Serial monitor menampilkan HH:MM:SS (jam:menit:detik)
