# ERD Sistem Hidroponik - Bagian 3: Perangkat & Notifikasi

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#4CAF50', 'primaryTextColor': '#fff', 'primaryBorderColor': '#388E3C', 'lineColor': '#4CAF50', 'secondaryColor': '#81C784', 'tertiaryColor': '#C8E6C9'}}}%%

erDiagram
    User ||--o{ Device : "memiliki"
    Device ||--o{ DeviceLog : "menghasilkan"
    Device ||--o{ Notification : "memicu"

    Device {
        string deviceId PK "Primary Key"
        ObjectId userId FK "Foreign Key"
        string name "Nama Perangkat"
        boolean isActive "Status Aktif"
        date lastConnection "Koneksi Terakhir"
        object configuration "Konfigurasi"
        string firmwareVersion "Versi Firmware"
    }

    DeviceLog {
        ObjectId _id PK "Primary Key"
        string deviceId FK "Foreign Key"
        string type "Tipe Log"
        string message "Pesan"
        string level "Level (info/warning/error)"
        date timestamp "Waktu Log"
    }

    Notification {
        ObjectId _id PK "Primary Key"
        string deviceId FK "Foreign Key"
        ObjectId userId FK "Foreign Key"
        string title "Judul Notifikasi"
        string message "Isi Pesan"
        string type "Tipe Notifikasi"
        boolean isRead "Status Dibaca"
        date createdAt "Waktu Dibuat"
    }
```

## Petunjuk Diagram

### Relasi Antar Tabel:
1. User → SensorData (1:N)
   - Satu user dapat memiliki banyak data sensor
2. User → Device (1:N)
   - Satu user dapat memiliki beberapa perangkat
3. Device → DeviceLog (1:N)
   - Satu perangkat dapat menghasilkan banyak log
4. Device → Notification (1:N)
   - Satu perangkat dapat memicu banyak notifikasi

### Validasi Data:
1. Sensor:
   - Temperature: 0-100°C
   - pH: 0-14
   - Distance: 0-500cm
   - PPM: 0-3000

### Index untuk Optimasi:
1. SensorData:
   - (userId, timestamp)
   - (deviceId, timestamp)
2. DeviceLog:
   - (deviceId, timestamp)
3. Notification:
   - (userId, isRead)
   - (deviceId, createdAt)
