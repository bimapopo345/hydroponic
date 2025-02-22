# API Documentation - HidroNutrient Sensor Endpoints

## Base URL

```
http://localhost:5000/api
```

## Endpoints

### 1. Add Sensor Data

Menambahkan data sensor baru.

```http
POST /sensor-data

Request Body:
{
    "userId": "65c8e1234567890123456789",
    "deviceId": "ESP32_01",
    "temperature": 25.5,
    "ph": 6.5,
    "distance": 15.2,
    "ppm": 750
}

Response 201:
{
    "success": true,
    "data": {
        "_id": "65d1e1234567890123456789",
        "userId": "65c8e1234567890123456789",
        "deviceId": "ESP32_01",
        "temperature": 25.5,
        "ph": 6.5,
        "distance": 15.2,
        "ppm": 750,
        "timestamp": "2025-02-22T00:52:45.000Z"
    }
}
```

### 2. Get Latest Sensor Data

Mengambil data sensor terbaru untuk user tertentu.

```http
GET /sensor-data/:userId/latest

Response 200:
{
    "success": true,
    "data": {
        "_id": "65d1e1234567890123456789",
        "temperature": 25.5,
        "ph": 6.5,
        "distance": 15.2,
        "ppm": 750,
        "timestamp": "2025-02-22T00:52:45.000Z"
    }
}
```

### 3. Get Sensor History

Mengambil riwayat data sensor dengan filter waktu.

```http
GET /sensor-data/:userId/history?from=2025-02-21&to=2025-02-22&limit=100

Parameters:
- from: tanggal awal (opsional)
- to: tanggal akhir (opsional)
- limit: batas jumlah data (default: 100)

Response 200:
{
    "success": true,
    "data": [
        {
            "_id": "65d1e1234567890123456789",
            "temperature": 25.5,
            "ph": 6.5,
            "distance": 15.2,
            "ppm": 750,
            "timestamp": "2025-02-22T00:52:45.000Z"
        },
        // ...data lainnya
    ]
}
```

### 4. Get Sensor Statistics

Mengambil statistik data sensor.

```http
GET /sensor-data/:userId/stats?period=24h

Parameters:
- period: 24h | 7d | 30d (default: 24h)

Response 200:
{
    "success": true,
    "data": {
        "avgTemperature": 25.5,
        "avgPh": 6.5,
        "avgDistance": 15.2,
        "avgPpm": 750,
        "maxTemperature": 28.3,
        "maxPh": 7.0,
        "maxDistance": 20.0,
        "maxPpm": 850,
        "minTemperature": 23.1,
        "minPh": 6.0,
        "minDistance": 10.5,
        "minPpm": 650
    }
}
```

### 5. Simulate Sensor Data (Testing)

Generate data sensor simulasi untuk testing.

```http
POST /sensor-data/simulate

Request Body:
{
    "userId": "65c8e1234567890123456789",
    "deviceId": "ESP32_01",
    "count": 10  // jumlah data yang ingin digenerate
}

Response 201:
{
    "success": true,
    "count": 10,
    "data": [
        {
            "_id": "65d1e1234567890123456789",
            "temperature": 25.5,
            "ph": 6.5,
            "distance": 15.2,
            "ppm": 750,
            "timestamp": "2025-02-22T00:52:45.000Z"
        },
        // ...data lainnya
    ]
}
```

## Error Responses

```http
Response 404:
{
    "success": false,
    "error": "Data sensor tidak ditemukan"
}

Response 500:
{
    "success": false,
    "error": "Pesan error spesifik"
}
```

## Parameter Ranges

```
Temperature: 20-30°C
pH: 5.5-7.0
Distance: 5-100 cm
PPM: 200-900 ppm
```

## Testing di Postman

1. Import collection menggunakan link atau file yang disediakan
2. Set environment variable:
   - `baseUrl`: http://localhost:5000/api
   - `userId`: (ID user setelah login)
   - `deviceId`: ESP32_01 (atau sesuai kebutuhan)
3. Generate data testing menggunakan endpoint simulate
4. Gunakan endpoint lain untuk mengakses dan mengelola data

## Catatan

- Semua timestamp menggunakan format ISO 8601
- Data historis diurutkan dari yang terbaru
- Batasi request ke endpoint simulate untuk menghindari overload database
