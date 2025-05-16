# ESP32 Hidroponik Control - Final Fix

Sistem kontrol hidroponik dengan fitur kalibrasi TDS dan mode panen otomatis.

## Fitur Kunci

1. Kalibrasi TDS:

- Simpan K-Value di EEPROM (tidak hilang saat restart)
- Kalibrasi via Serial Monitor
- Referensi TDS tersimpan untuk verifikasi

2. Mode Panen (PPM = 800):

- Timer 1 jam aktif otomatis
- Kontrol pompa berdasarkan PPM selama timer aktif
- Pompa OFF permanen setelah timer habis
- Auto recovery ke mode normal

3. Recovery Mode:

- Set threshold < 800
- System kembali ke mode normal
- Tidak perlu reset ESP32

## Cara Kalibrasi TDS

1. Via Serial Monitor:

```
calibrate 1.02   // Set K-Value baru
```

2. Response:

```
K-Value updated to: 1.02
Calibration data saved!
```

3. Startup info:

```
Loading calibration data:
K-Value: 1.02
TDS Ref: 450.0
```

## Mode Panen

1. Aktivasi:

- Set threshold 800 dari web
- Timer 1 jam mulai otomatis
- Pompa bisa ON/OFF selama timer berjalan
- Setelah timer habis, pompa OFF permanen

2. Kontrol Pompa:

```
Selama timer aktif:
IF PPM < 800 THEN Pompa ON
IF PPM ≥ 800 THEN Pompa OFF

Setelah timer habis:
Pompa tetap OFF
```

3. Recovery:

- Set threshold < 800 dari web
- System kembali ke mode normal
- Pompa kembali kontrol normal

## Testing

1. Mode Debug (1 menit):

```cpp
const unsigned long ONE_HOUR = 60000;  // 1 menit
```

2. Mode Production (1 jam):

```cpp
const unsigned long ONE_HOUR = 3600000;  // 1 jam
```

3. Status Log:

```
# Mode Normal -> Panen
PPM threshold diupdate: 400 -> 800
Mode panen dimulai!
- Timer 1 jam aktif
- Pompa ON jika PPM < 800
- Setelah 1 jam, pompa OFF permanen

# Kontrol dalam Mode Panen
Mode Panen - Pompa ON (PPM: 750.0)
Sisa waktu: 00:58:30

Mode Panen - Pompa OFF (PPM: 805.0)
Sisa waktu: 00:45:20

# Timer Habis
Timer 1 jam habis! Pompa OFF permanen.

# Recovery ke Normal
PPM threshold diupdate: 800 -> 400
Kembali ke mode normal!
```

## Troubleshooting

1. Nilai PPM Tidak Akurat:

- Cek K-Value kalibrasi
- Monitor suhu air
- Verifikasi noise analog

2. Timer Tidak Akurat:

- Cek millis() overflow
- Monitor log Serial
- Verifikasi koneksi WiFi

3. Pompa Tidak Respon:

- Cek status mode panen
- Verifikasi nilai PPM
- Monitor flag timer

## Quick Start

1. Setup Hardware:

- Pastikan sensor TDS terkalibrasi
- Cek koneksi relay
- Verifikasi koneksi sensor

2. Kalibrasi:

- Ukur larutan standar
- Set K-Value sesuai
- Verifikasi pembacaan

3. Testing Mode Panen:

- Set timer 1 menit
- Test threshold 800
- Verifikasi kontrol pompa
- Test recovery mode
