#ifndef DATA_BUFFER_H
#define DATA_BUFFER_H

#include <Arduino.h>
#include <SPIFFS.h>
#include "config.h"

// Struktur data untuk menyimpan pembacaan sensor
struct SensorData {
    float temperature;
    float ph;
    float distance;
    float ppm;
    unsigned long timestamp;
};

class DataBuffer {
private:
    SensorData* buffer;
    int writeIndex = 0;
    int readIndex = 0;
    int count = 0;
    bool isBufferFull = false;

    // Fungsi untuk menulis ke SPIFFS
    bool writeToSPIFFS(const SensorData* data) {
        File file = SPIFFS.open(BACKUP_FILE, FILE_APPEND);
        if (!file) {
            Serial.println("Gagal membuka file untuk menulis");
            return false;
        }

        size_t bytesWritten = file.write((uint8_t*)data, sizeof(SensorData));
        file.close();

        return bytesWritten == sizeof(SensorData);
    }

public:
    DataBuffer() {
        buffer = new SensorData[BUFFER_SIZE];
        
        // Inisialisasi SPIFFS
        if (!SPIFFS.begin(true)) {
            Serial.println("Gagal mount SPIFFS");
            return;
        }
    }

    ~DataBuffer() {
        delete[] buffer;
    }

    // Tambah data ke buffer
    bool push(const SensorData& data) {
        buffer[writeIndex] = data;
        writeIndex = (writeIndex + 1) % BUFFER_SIZE;
        
        if (count < BUFFER_SIZE) {
            count++;
        } else {
            isBufferFull = true;
            readIndex = (readIndex + 1) % BUFFER_SIZE;
        }

        // Jika buffer hampir penuh (90%), backup ke SPIFFS
        if (count >= BUFFER_SIZE * 0.9) {
            Serial.println("Buffer hampir penuh, melakukan backup...");
            return writeToSPIFFS(&data);
        }

        return true;
    }

    // Ambil batch data untuk dikirim
    int getBatch(SensorData* outBatch, int batchSize) {
        if (count == 0) return 0;

        int itemsToGet = min(batchSize, count);
        for (int i = 0; i < itemsToGet; i++) {
            outBatch[i] = buffer[(readIndex + i) % BUFFER_SIZE];
        }

        return itemsToGet;
    }

    // Konfirmasi data berhasil dikirim
    void confirmBatch(int numItems) {
        readIndex = (readIndex + numItems) % BUFFER_SIZE;
        count -= numItems;
        isBufferFull = false;
    }

    // Baca data dari SPIFFS saat recovery
    int loadFromSPIFFS() {
        File file = SPIFFS.open(BACKUP_FILE, FILE_READ);
        if (!file) {
            Serial.println("Tidak ada file backup");
            return 0;
        }

        int itemsLoaded = 0;
        while (file.available() >= sizeof(SensorData)) {
            SensorData data;
            if (file.read((uint8_t*)&data, sizeof(SensorData))) {
                if (push(data)) {
                    itemsLoaded++;
                }
            }
        }

        file.close();
        
        // Hapus file backup setelah berhasil dimuat
        SPIFFS.remove(BACKUP_FILE);
        
        return itemsLoaded;
    }

    // Hapus semua data dari SPIFFS
    void clearBackup() {
        SPIFFS.remove(BACKUP_FILE);
    }

    // Cek apakah buffer kosong
    bool isEmpty() const {
        return count == 0;
    }

    // Cek apakah buffer penuh
    bool isFull() const {
        return isBufferFull;
    }

    // Dapatkan jumlah data dalam buffer
    int getCount() const {
        return count;
    }

    // Reset buffer
    void reset() {
        writeIndex = 0;
        readIndex = 0;
        count = 0;
        isBufferFull = false;
    }
};

#endif // DATA_BUFFER_H
