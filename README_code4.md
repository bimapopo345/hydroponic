# Panduan Penggunaan ESP32 dengan Dynamic PPM Threshold

## Persiapan

1. Hardware yang dibutuhkan:

- ESP32
- Sensor TDS
- Sensor pH
- Sensor Suhu
- LCD I2C
- Sensor Ultrasonik
- 2 Relay Module

2. Software yang dibutuhkan:

- Arduino IDE
- Library:
  - GravityTDS
  - OneWire
  - DallasTemperature
  - LiquidCrystal_I2C
  - ArduinoJson

3. Backend:

- Running di localhost:5000
- Sudah di-expose dengan ngrok

## Setup

1. Backend:

```bash
# Di directory backend
npm install
npm start

# Di terminal lain
ngrok http http://localhost:5000
```

2. ESP32:

- Copy kode dari baru_code4.md
- Update WiFi credentials
- Update URL ngrok yang baru
- Upload ke ESP32

## Cara Kerja

1. Threshold Update:

- Setiap 30 detik ESP32 mengambil threshold dari API
- Default threshold 100 PPM jika belum diset
- Threshold baru langsung diterapkan

2. Kontrol Relay:

```
if (PPM < threshold) => Relay ON
if (PPM >= threshold) => Relay OFF
```

3. Monitoring:

- Serial monitor: log detail status
- LCD: tampilan realtime sensor
- Backend: data tersimpan di MongoDB

## Troubleshooting

1. Serial Monitor menampilkan:

- Status koneksi WiFi
- Update threshold
- Status relay
- Error jika ada

2. Tips:

- Restart ESP32 jika threshold tidak update
- Cek URL ngrok masih aktif
- Monitor koneksi WiFi

## Notes

- Interval 30 detik dipilih untuk mengurangi beban server
- Tidak menggunakan EEPROM untuk simplifikasi
- Fokus pada komunikasi dengan API
