# Panduan Sistem Storage ESP32-S3

## Spesifikasi Storage

1. Total Flash Memory: 16MB

   - Program: ~3MB
   - SPIFFS: ~9.9MB
   - Reserved: ~3.1MB

2. Kapasitas Penyimpanan Data:
   - 1 data point = 20 bytes
   - Data per detik = 86400 data points/hari
   - Total per hari = ~1.7MB
   - Kapasitas maksimal = ~5-6 hari data

## Struktur File System

1. Format Nama File:

```
/data_YYYYMMDD_HH.bin
Contoh: /data_20250222_08.bin (data tanggal 22 Feb 2025 jam 8)
```

2. Organisasi Data:

- File dibuat per jam
- Setiap file berisi 3600 data points (1 jam)
- Ukuran file ~72KB (3600 \* 20 bytes)

## Manajemen Storage

1. Penyimpanan Data:

```cpp
// Simpan data setiap detik
storage.saveData(sensorData);
```

2. Auto Cleanup:

- Trigger pada 90% storage terpakai
- Menghapus file terlama otomatis
- Mencegah storage overflow

3. Recovery Data:

```cpp
// Load data yang belum terkirim
std::vector<SensorData> pendingData = storage.loadPendingData(lastSentTime);
```

4. Format Storage:

```cpp
// Format SPIFFS jika diperlukan
storage.format();
```

## Monitoring Storage

1. Print Info:

```cpp
storage.printStorageInfo();
```

Output:

```
Total space: 16777216 bytes
Used space: 1728000 bytes
Free space: 15049216 bytes
File: /data_20250222_08.bin, Size: 72000 bytes
...
```

2. Cek Data Pending:

```cpp
if (storage.hasPendingData()) {
    // Handle pending data
}
```

## Keamanan Data

1. Power Loss Protection:

- Data disimpan per data point
- File system journaling
- Quick recovery saat reboot

2. Data Integrity:

- Mutex protection untuk concurrent access
- Verifikasi write completion
- Backup system otomatis

## Tips Penggunaan

1. Monitoring:

- Pantau storage usage secara berkala
- Set alert pada 80% usage
- Backup data penting secara manual

2. Maintenance:

- Format SPIFFS setiap deployment baru
- Verifikasi file system setelah power loss
- Monitor error rate pada storage operations

3. Optimasi:

- Hapus file yang sudah terkirim
- Batasi jumlah retry pada network error
- Implementasi data compression jika diperlukan

## Error Handling

1. Storage Errors:

```cpp
if (!storage.saveData(data)) {
    // Handle storage error
    // Misalnya: retry, log error, atau notify
}
```

2. Recovery:

```cpp
// Saat startup
if (storage.hasPendingData()) {
    // Attempt data recovery and transmission
}
```

## Contoh Implementasi

1. Inisialisasi:

```cpp
StorageManager storage;
if (!SPIFFS.begin(true)) {
    Serial.println("Storage gagal diinisialisasi!");
    // Handle error
}
```

2. Monitoring Regular:

```cpp
void checkStorage() {
    storage.printStorageInfo();
    if (SPIFFS.usedBytes() > (SPIFFS.totalBytes() * 0.8)) {
        Serial.println("Warning: Storage hampir penuh!");
    }
}
```

3. Data Recovery:

```cpp
void recoverData() {
    auto pendingData = storage.loadPendingData(lastSentTime);
    if (!pendingData.empty()) {
        Serial.printf("Menemukan %d data belum terkirim\n", pendingData.size());
        // Process pending data
    }
}
```

## Catatan Penting

1. Battery Backup:

- Sediakan UPS atau battery backup
- Implementasi safe shutdown procedure
- Monitor voltage untuk early warning

2. Network Issues:

- Implement exponential backoff
- Cache data locally saat offline
- Prioritize newer data saat transmit

3. Maintenance Schedule:

- Regular SPIFFS check setiap minggu
- Clean up unused files
- Verify data integrity
