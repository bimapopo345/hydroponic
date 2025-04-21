# ERD Sistem Hidroponik - Diagram Lengkap

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'secondaryColor': '#f5f5f5', 'tertiaryColor': '#ffffff'}}}%%

erDiagram
    User ||--o{ SensorData : "memiliki data"
    User ||--o{ Device : "memiliki"
    User ||--o{ UserDashboard : "memiliki"
    User ||--o{ UserConfig : "mengatur"
    Device ||--o{ SensorData : "menghasilkan"
    Device ||--o{ DeviceLog : "mencatat"
    Device ||--o{ Notification : "memicu"

    User {
        ObjectId _id PK "Primary Key"
        string username UK "Unique"
        string email UK "Unique"
        string password "Encrypted"
        string fullName "Nama Lengkap"
        string avatar "URL Avatar"
        string bio "Biografi"
        string phone "No Telepon"
        string address "Alamat"
        string company "Perusahaan"
        string position "Jabatan"
        object socialLinks "Media Sosial"
        string resetPasswordToken "Token Reset"
        date resetPasswordExpires "Expired Token"
    }

    Device {
        string deviceId PK "Primary Key"
        ObjectId userId FK "Foreign Key"
        string name "Nama Perangkat"
        boolean isActive "Status Aktif"
        date lastConnection "Koneksi Terakhir"
        object configuration "Konfigurasi"
        string firmwareVersion "Versi Firmware"
    }

    SensorData {
        ObjectId _id PK "Primary Key"
        ObjectId userId FK "Foreign Key"
        string deviceId FK "Foreign Key"
        number temperature "Suhu (0-100°C)"
        number ph "pH Level (0-14)"
        number distance "Jarak (0-500cm)"
        number ppm "PPM (0-3000)"
        date timestamp "Waktu Pengambilan"
    }

    UserDashboard {
        ObjectId _id PK "Primary Key"
        ObjectId userId FK "Foreign Key"
        date lastLogin "Login Terakhir"
        object currentStats "Statistik Terkini"
        array history "Riwayat Data"
    }

    UserConfig {
        ObjectId _id PK "Primary Key"
        ObjectId userId FK "Foreign Key"
        number tempThreshold "Batas Suhu"
        number phThreshold "Batas pH"
        number distThreshold "Batas Jarak"
        number ppmThreshold "Batas PPM"
        boolean notifications "Status Notifikasi"
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

## Penjelasan ERD Lengkap

### 1. Entitas Utama:

- User: Pengguna sistem
- Device: Perangkat hidroponik
- SensorData: Data pengukuran sensor
- UserDashboard: Data monitoring realtime
- UserConfig: Konfigurasi pengguna
- DeviceLog: Log aktivitas perangkat
- Notification: Notifikasi sistem

### 2. Relasi Utama:

- User - SensorData: One-to-Many
- User - Device: One-to-Many
- Device - SensorData: One-to-Many
- Device - DeviceLog: One-to-Many
- Device - Notification: One-to-Many

### 3. Validasi & Batasan:

- Data Sensor:
  - Suhu: 0-100°C
  - pH: 0-14
  - Jarak: 0-500cm
  - PPM: 0-3000

### 4. Index Optimasi:

1. SensorData:
   - (userId, timestamp)
   - (deviceId, timestamp)
2. DeviceLog:
   - (deviceId, timestamp)
3. Notification:
   - (userId, isRead)
   - (deviceId, createdAt)

### 5. Fitur Keamanan:

- Password encryption
- Token reset password
- Sistem login tracking
- Device authentication
