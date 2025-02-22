#ifndef STORAGE_MANAGER_H
#define STORAGE_MANAGER_H

#include <Arduino.h>
#include <SPIFFS.h>
#include "config.h"

class StorageManager {
private:
    // Format nama file: /data_YYYYMMDD_HH.bin
    String getFilename(time_t timestamp) {
        struct tm timeinfo;
        localtime_r(&timestamp, &timeinfo);
        char filename[32];
        sprintf(filename, "/data_%04d%02d%02d_%02d.bin",
            timeinfo.tm_year + 1900,
            timeinfo.tm_mon + 1,
            timeinfo.tm_mday,
            timeinfo.tm_hour);
        return String(filename);
    }

    // Hapus file terlama jika storage hampir penuh
    void cleanupOldFiles() {
        if (SPIFFS.usedBytes() > (SPIFFS.totalBytes() * 0.9)) {
            File root = SPIFFS.open("/");
            File oldestFile;
            time_t oldestTime = time(nullptr);

            while (File file = root.openNextFile()) {
                if (String(file.name()).startsWith("/data_")) {
                    time_t fileTime = parseTimestamp(file.name());
                    if (fileTime < oldestTime) {
                        oldestTime = fileTime;
                        oldestFile = file;
                    }
                }
            }

            if (oldestFile) {
                String filename = oldestFile.name();
                oldestFile.close();
                SPIFFS.remove(filename);
                Serial.printf("Menghapus file lama: %s\n", filename.c_str());
            }
        }
    }

    // Parse timestamp dari nama file
    time_t parseTimestamp(const char* filename) {
        int year, month, day, hour;
        sscanf(filename, "/data_%4d%2d%2d_%2d.bin", &year, &month, &day, &hour);
        
        struct tm timeinfo = {0};
        timeinfo.tm_year = year - 1900;
        timeinfo.tm_mon = month - 1;
        timeinfo.tm_mday = day;
        timeinfo.tm_hour = hour;
        
        return mktime(&timeinfo);
    }

public:
    StorageManager() {
        if (!SPIFFS.begin(true)) {
            Serial.println("Gagal mount SPIFFS!");
            return;
        }
    }

    // Simpan data ke file berdasarkan timestamp
    bool saveData(const SensorData& data) {
        String filename = getFilename(data.timestamp);
        File file = SPIFFS.open(filename, FILE_APPEND);
        
        if (!file) {
            Serial.printf("Gagal membuka file: %s\n", filename.c_str());
            return false;
        }

        size_t written = file.write((uint8_t*)&data, sizeof(SensorData));
        file.close();

        if (written != sizeof(SensorData)) {
            Serial.println("Gagal menulis data!");
            return false;
        }

        cleanupOldFiles();
        return true;
    }

    // Baca semua data yang belum terkirim
    std::vector<SensorData> loadPendingData(time_t lastSentTime) {
        std::vector<SensorData> pendingData;
        File root = SPIFFS.open("/");
        
        while (File file = root.openNextFile()) {
            if (!String(file.name()).startsWith("/data_")) continue;

            time_t fileTime = parseTimestamp(file.name());
            if (fileTime > lastSentTime) {
                while (file.available() >= sizeof(SensorData)) {
                    SensorData data;
                    if (file.read((uint8_t*)&data, sizeof(SensorData)) == sizeof(SensorData)) {
                        pendingData.push_back(data);
                    }
                }
            }
        }

        // Sort berdasarkan timestamp
        std::sort(pendingData.begin(), pendingData.end(), 
            [](const SensorData& a, const SensorData& b) {
                return a.timestamp < b.timestamp;
            });

        return pendingData;
    }

    // Hapus file setelah data terkirim
    void deleteFile(time_t timestamp) {
        String filename = getFilename(timestamp);
        if (SPIFFS.exists(filename)) {
            SPIFFS.remove(filename);
            Serial.printf("File dihapus: %s\n", filename.c_str());
        }
    }

    // Dapatkan info storage
    void printStorageInfo() {
        Serial.printf("Total space: %d bytes\n", SPIFFS.totalBytes());
        Serial.printf("Used space: %d bytes\n", SPIFFS.usedBytes());
        Serial.printf("Free space: %d bytes\n", SPIFFS.totalBytes() - SPIFFS.usedBytes());

        File root = SPIFFS.open("/");
        while (File file = root.openNextFile()) {
            Serial.printf("File: %s, Size: %d bytes\n", 
                file.name(), file.size());
        }
    }

    // Cek apakah ada data yang perlu dikirim
    bool hasPendingData() {
        File root = SPIFFS.open("/");
        while (File file = root.openNextFile()) {
            if (String(file.name()).startsWith("/data_")) {
                return true;
            }
        }
        return false;
    }

    // Format storage
    bool format() {
        return SPIFFS.format();
    }
};

#endif // STORAGE_MANAGER_H
