# Panduan Setup Ngrok untuk HidroNutrient

## Instalasi Ngrok

1. Download Ngrok:

   - Kunjungi https://ngrok.com/download
   - Download sesuai sistem operasi
   - Extract file ke folder yang diinginkan

2. Buat Akun & Auth Token:
   - Daftar di https://ngrok.com
   - Copy auth token dari dashboard
   - Jalankan di terminal:
     ```bash
     ngrok config add-authtoken YOUR_AUTH_TOKEN
     ```

## Setup Backend dengan Ngrok

1. Jalankan Backend:

   ```bash
   cd backend
   npm install
   npm run dev
   # Backend akan jalan di localhost:5000
   ```

2. Jalankan Ngrok:

   ```bash
   ngrok http 5000
   ```

3. Copy URL Ngrok:
   - Lihat bagian "Forwarding"
   - Contoh: https://abc123.ngrok.io
   - Simpan URL ini untuk konfigurasi

## Update Konfigurasi

1. Update ESP32 (backend/esp32/config.h):

   ```cpp
   #define USE_NGROK true
   const char* serverUrl = "https://abc123.ngrok.io/api/sensor-data";
   ```

2. Update Frontend (.env):
   ```
   VITE_API_URL=https://abc123.ngrok.io
   ```

## Testing Koneksi

1. Test ESP32:

   ```cpp
   // Monitor Serial output
   if (httpCode == 200) {
     Serial.println("Berhasil kirim data ke server ngrok");
   }
   ```

2. Test Frontend:
   - Buka browser
   - Akses localhost:5173
   - Monitor network tab di DevTools

## Troubleshooting

1. Jika ESP32 Tidak Bisa Konek:

   - Pastikan URL ngrok benar
   - Cek SSL certificate (ngrok HTTPS)
   - Verifikasi WiFi connection

2. Jika Data Tidak Masuk:

   - Cek ngrok status dashboard
   - Monitor traffic di ngrok console
   - Verifikasi format data yang dikirim

3. Common Issues:
   - Ngrok session expired (restart ngrok)
   - CORS issues (sudah ditangani di backend)
   - Network timeout (cek retry mechanism)

## Monitoring & Maintenance

1. Ngrok Dashboard:

   - Monitor traffic di http://localhost:4040
   - Cek error rates dan latency
   - Review request/response logs

2. Terminal Commands:

   ```bash
   # Cek status ngrok
   ngrok status

   # Restart ngrok dengan custom domain (jika punya)
   ngrok http --domain=your-domain.ngrok-free.app 5000
   ```

3. Best Practices:
   - Simpan URL ngrok di environment variable
   - Gunakan script untuk auto-update config
   - Monitor bandwidth usage

## Catatan Penting

1. URL Ngrok:

   - Berubah setiap restart (free plan)
   - Update config.h setiap perubahan
   - Pertimbangkan upgrade ke paid plan untuk fixed domain

2. Security:

   - Ngrok menyediakan HTTPS
   - Monitor suspicious traffic
   - Batasi akses jika perlu

3. Latency:
   - Monitor response time
   - Adjust batch size jika perlu
   - Implementasi error handling

## Script Helper (ngrok-update.sh)

```bash
#!/bin/bash

# Ambil URL ngrok
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

# Update config.h
sed -i "s|const char\* serverUrl = \".*\";|const char* serverUrl = \"$NGROK_URL/api/sensor-data\";|" backend/esp32/config.h

echo "Updated ESP32 config with new ngrok URL: $NGROK_URL"
```

## Development vs Production

1. Development:

   ```cpp
   #define USE_NGROK true
   // Test dengan ngrok
   ```

2. Production:

   ```cpp
   #define USE_NGROK false
   // Gunakan URL server production
   ```

3. Switching Environment:
   - Edit USE_NGROK di config.h
   - Recompile dan upload ke ESP32
   - Update frontend environment
