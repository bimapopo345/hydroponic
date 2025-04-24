# ESP32 Hidroponik Control Fix_1

Kode ESP32 untuk sistem kontrol hidroponik dengan fitur:

- Dynamic PPM threshold dari API
- Monitoring sensor (TDS, pH, suhu, jarak)
- Kontrol relay otomatis
- Display LCD
- Logging detail ke Serial Monitor

## Hardware Requirements

- ESP32
- Sensor:
  - TDS (Pin 4)
  - pH (Pin 7)
  - DS18B20 Temperature (Pin 6)
  - Ultrasonik HC-SR04 (Trig: 5, Echo: 18)
- LCD I2C (0x27)
- 2 Relay Module (Pin 13, 12)

## Fitur Utama

1. PPM Control:

   - Ambil threshold dari API setiap 5 detik
   - Kontrol relay berdasarkan threshold
   - Default threshold 100 PPM

2. Monitoring:

   - TDS/PPM
   - pH
   - Suhu (dengan koreksi +0.39)
   - Kapasitas air (%)

3. Komunikasi:
   - POST data sensor ke API
   - GET threshold dari API
   - Auto-reconnect WiFi

## Pin Configuration

```
TDS Sensor      : GPIO 4
Temperature     : GPIO 6
pH Sensor       : GPIO 7
Ultrasonic Trig: GPIO 5
Ultrasonic Echo: GPIO 18
Relay 1        : GPIO 13
Relay 2        : GPIO 12
LCD I2C (SDA)  : GPIO 8
LCD I2C (SCL)  : GPIO 9
```

## API Endpoints

1. GET Threshold:

```
GET https://[ngrok-url]/api/relay-control/ESP32_01
Response: {
  "success": true,
  "data": {
    "ppmThreshold": 100
  }
}
```

2. POST Sensor Data:

```
POST https://[ngrok-url]/api/sensor-data
Body: {
  "userId": "67906a8703f043e82dc7e9a1",
  "deviceId": "ESP32_01",
  "temperature": 25.5,
  "ph": 7.0,
  "distance": 10.5,
  "ppm": 350
}
```

## LCD Display

```
+----------------+
|ppm=350 pH=7.00 |
|tmp=25.5 cap=75%|
+----------------+
```

## Perubahan dari Versi Sebelumnya

1. Interval:

- Check threshold setiap 5 detik (sebelumnya 30 detik)
- Send data setiap 3 detik

2. Logging:

- Status relay dengan nilai PPM dan threshold
- Status koneksi WiFi
- Response API

3. Error Handling:

- WiFi reconnect otomatis
- Validasi response API
- Return early jika tidak ada koneksi

## Cara Penggunaan

1. Setup Hardware:

- Pasang semua sensor sesuai pin configuration
- Pastikan LCD terhubung ke I2C dengan benar
- Cek pin relay dan polaritas

2. Konfigurasi Software:

- Update WiFi credentials
- Update ngrok URL untuk API endpoints
- Upload kode ke ESP32

3. Monitoring:

- Cek Serial Monitor untuk log detail
- Pantau LCD untuk data realtime
- Verifikasi data masuk ke backend

## Troubleshooting

1. Relay tidak berfungsi:

- Cek threshold dari API
- Monitor nilai PPM aktual
- Verifikasi koneksi relay

2. Data tidak terkirim:

- Cek status WiFi
- Verifikasi URL ngrok masih aktif
- Monitor response code API

3. Threshold tidak update:

- Cek koneksi ke API
- Verifikasi format response
- Monitor log Serial

4. LCD tidak tampil:

- Cek alamat I2C (default 0x27)
- Verifikasi koneksi SDA/SCL
- Cek tegangan LCD

## Notes

- Kalibrasi pH: slope = -5.02, offset = 19.86
- Koreksi suhu: +0.39°C
- Kapasitas air dihitung dari jarak (max 32.1cm)
- Default threshold 100 PPM jika API tidak tersedia
