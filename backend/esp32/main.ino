#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "time.h"
#include "config.h"
#include "sensor_manager.h"
#include "storage_manager.h"

// Inisialisasi objek
SensorManager sensors;
StorageManager storage;
TaskHandle_t sensorTaskHandle;
TaskHandle_t senderTaskHandle;

// Mutex untuk sinkronisasi
portMUX_TYPE mutex = portMUX_INITIALIZER_UNLOCKED;

// Status koneksi dan pengiriman
bool isWiFiConnected = false;
unsigned long lastRetryTime = 0;
int retryCount = 0;
time_t lastSentTime = 0;

// Forward declarations
void sensorTask(void* parameter);
void senderTask(void* parameter);
void connectToWiFi();
bool sendDataBatch(const std::vector<SensorData>& batch);

void setup() {
    Serial.begin(115200);
    while (!Serial) delay(100);
    
    Serial.println("\nMemulai sistem monitoring hidroponik...");
    
    // Hubungkan ke WiFi
    connectToWiFi();
    
    // Sinkronisasi waktu
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    while (time(nullptr) < 1000000000) {
        Serial.print(".");
        delay(100);
    }
    Serial.println("\nWaktu telah disinkronkan");
    
    // Info storage
    storage.printStorageInfo();
    
    // Buat task untuk kedua core
    xTaskCreatePinnedToCore(
        sensorTask,
        "SensorTask",
        8192,
        NULL,
        SENSOR_TASK_PRIORITY,
        &sensorTaskHandle,
        SENSOR_TASK_CORE
    );
    
    xTaskCreatePinnedToCore(
        senderTask,
        "SenderTask",
        16384, // Stack lebih besar untuk JSON processing
        NULL,
        SENDER_TASK_PRIORITY,
        &senderTaskHandle,
        SENDER_TASK_CORE
    );
}

void loop() {
    delay(1000);
}

void sensorTask(void* parameter) {
    Serial.printf("Sensor task running on core %d\n", xPortGetCoreID());
    
    TickType_t xLastWakeTime = xTaskGetTickCount();
    
    while (true) {
        // Baca sensor
        SensorData data = {
            .temperature = sensors.readTemperature(),
            .ph = sensors.readPH(),
            .distance = sensors.readDistance(),
            .ppm = sensors.readPPM(),
            .timestamp = time(nullptr)
        };
        
        // Simpan ke storage dengan mutex
        portENTER_CRITICAL(&mutex);
        storage.saveData(data);
        portEXIT_CRITICAL(&mutex);
        
        // Log data
        Serial.printf("Data: Temp=%.1f°C, pH=%.1f, Dist=%.1fcm, PPM=%.0f\n",
            data.temperature, data.ph, data.distance, data.ppm);
        
        // Delay tepat 1 detik
        vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(1000));
    }
}

void senderTask(void* parameter) {
    Serial.printf("Sender task running on core %d\n", xPortGetCoreID());
    
    while (true) {
        if (!isWiFiConnected) {
            if (millis() - lastRetryTime > RETRY_INTERVAL) {
                connectToWiFi();
                lastRetryTime = millis();
            }
            vTaskDelay(pdMS_TO_TICKS(1000));
            continue;
        }
        
        // Cek data yang belum terkirim
        portENTER_CRITICAL(&mutex);
        std::vector<SensorData> pendingData = storage.loadPendingData(lastSentTime);
        portEXIT_CRITICAL(&mutex);
        
        if (!pendingData.empty()) {
            // Kirim dalam batch
            for (size_t i = 0; i < pendingData.size(); i += BATCH_SIZE) {
                size_t batchEnd = min(i + BATCH_SIZE, pendingData.size());
                std::vector<SensorData> batch(
                    pendingData.begin() + i,
                    pendingData.begin() + batchEnd
                );
                
                if (sendDataBatch(batch)) {
                    lastSentTime = batch.back().timestamp;
                    retryCount = 0;
                    
                    // Hapus file yang sudah terkirim
                    portENTER_CRITICAL(&mutex);
                    storage.deleteFile(lastSentTime);
                    portEXIT_CRITICAL(&mutex);
                } else {
                    retryCount++;
                    if (retryCount >= MAX_RETRY) {
                        Serial.println("Mencapai batas maksimal retry");
                        retryCount = 0;
                        break;
                    }
                }
            }
        }
        
        vTaskDelay(pdMS_TO_TICKS(SEND_INTERVAL));
    }
}

void connectToWiFi() {
    if (WiFi.status() == WL_CONNECTED) {
        isWiFiConnected = true;
        return;
    }
    
    Serial.println("Menghubungkan ke WiFi...");
    WiFi.begin(ssid, password);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nTerhubung ke WiFi!");
        Serial.printf("IP Address: %s\n", WiFi.localIP().toString().c_str());
        isWiFiConnected = true;
    } else {
        Serial.println("\nGagal terhubung ke WiFi!");
        isWiFiConnected = false;
    }
}

bool sendDataBatch(const std::vector<SensorData>& batch) {
    if (!isWiFiConnected || batch.empty()) return false;
    
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    DynamicJsonDocument doc(16384); // Increased size for larger batches
    JsonArray dataArray = doc.createNestedArray("data");
    
    for (const auto& data : batch) {
        JsonObject dataObj = dataArray.createNestedObject();
        dataObj["userId"] = userId;
        dataObj["deviceId"] = deviceId;
        dataObj["temperature"] = data.temperature;
        dataObj["ph"] = data.ph;
        dataObj["distance"] = data.distance;
        dataObj["ppm"] = data.ppm;
        dataObj["timestamp"] = data.timestamp;
    }
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpCode = http.POST(jsonString);
    bool success = (httpCode == HTTP_CODE_OK);
    
    if (success) {
        Serial.printf("Berhasil mengirim %d data\n", batch.size());
    } else {
        Serial.printf("Gagal mengirim data, code: %d\n", httpCode);
    }
    
    http.end();
    return success;
}
