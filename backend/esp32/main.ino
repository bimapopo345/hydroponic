#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "time.h"
#include "config.h"
#include "sensor_manager.h"
#include "data_buffer.h"

// Inisialisasi objek
SensorManager sensors;
DataBuffer dataBuffer;
TaskHandle_t sensorTaskHandle;
TaskHandle_t senderTaskHandle;

// Mutex untuk sinkronisasi
portMUX_TYPE mutex = portMUX_INITIALIZER_UNLOCKED;

// Status koneksi dan pengiriman
bool isWiFiConnected = false;
unsigned long lastRetryTime = 0;
int retryCount = 0;

// Forward declarations
void sensorTask(void* parameter);
void senderTask(void* parameter);
void connectToWiFi();
bool sendDataBatch(SensorData* batch, int count);

void setup() {
    Serial.begin(115200);
    
    // Tunggu Serial tersedia
    while (!Serial) delay(100);
    
    Serial.println("\nMemulai sistem monitoring hidroponik...");
    
    // Hubungkan ke WiFi
    connectToWiFi();
    
    // Sinkronisasi waktu
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    
    // Buat task untuk core 0 (sensor) dan core 1 (sender)
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
        8192,
        NULL,
        SENDER_TASK_PRIORITY,
        &senderTaskHandle,
        SENDER_TASK_CORE
    );
}

void loop() {
    // Loop utama kosong karena menggunakan FreeRTOS tasks
    delay(1000);
}

// Task untuk membaca sensor (running di Core 0)
void sensorTask(void* parameter) {
    Serial.print("Sensor task running on core ");
    Serial.println(xPortGetCoreID());
    
    TickType_t xLastWakeTime = xTaskGetTickCount();
    
    while (true) {
        struct SensorData data = {
            .temperature = sensors.readTemperature(),
            .ph = sensors.readPH(),
            .distance = sensors.readDistance(),
            .ppm = sensors.readPPM(),
            .timestamp = time(nullptr)
        };
        
        // Masukkan data ke buffer dengan mutex
        portENTER_CRITICAL(&mutex);
        dataBuffer.push(data);
        portEXIT_CRITICAL(&mutex);
        
        // Log data ke Serial
        Serial.printf("Data: Temp=%.1f°C, pH=%.1f, Dist=%.1fcm, PPM=%.0f\n",
            data.temperature, data.ph, data.distance, data.ppm);
        
        // Delay tepat 1 detik
        vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(1000));
    }
}

// Task untuk mengirim data (running di Core 1)
void senderTask(void* parameter) {
    Serial.print("Sender task running on core ");
    Serial.println(xPortGetCoreID());
    
    // Load data backup jika ada
    int recoveredItems = dataBuffer.loadFromSPIFFS();
    if (recoveredItems > 0) {
        Serial.printf("Berhasil me-recover %d data dari backup\n", recoveredItems);
    }
    
    while (true) {
        // Cek koneksi WiFi
        if (!isWiFiConnected) {
            if (millis() - lastRetryTime > RETRY_INTERVAL) {
                connectToWiFi();
                lastRetryTime = millis();
            }
            vTaskDelay(pdMS_TO_TICKS(1000));
            continue;
        }
        
        // Ambil batch data dengan mutex
        SensorData batch[BATCH_SIZE];
        portENTER_CRITICAL(&mutex);
        int count = dataBuffer.getBatch(batch, BATCH_SIZE);
        portEXIT_CRITICAL(&mutex);
        
        if (count > 0) {
            if (sendDataBatch(batch, count)) {
                // Konfirmasi data terkirim dengan mutex
                portENTER_CRITICAL(&mutex);
                dataBuffer.confirmBatch(count);
                portEXIT_CRITICAL(&mutex);
                retryCount = 0;
            } else {
                retryCount++;
                if (retryCount >= MAX_RETRY) {
                    Serial.println("Mencapai batas maksimal retry, menyimpan ke backup...");
                    // Data akan ter-backup otomatis saat buffer penuh
                    retryCount = 0;
                }
            }
        }
        
        // Delay sesuai interval pengiriman
        vTaskDelay(pdMS_TO_TICKS(SEND_INTERVAL));
    }
}

// Fungsi untuk menghubungkan ke WiFi
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
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
        isWiFiConnected = true;
    } else {
        Serial.println("\nGagal terhubung ke WiFi!");
        isWiFiConnected = false;
    }
}

// Fungsi untuk mengirim batch data ke server
bool sendDataBatch(SensorData* batch, int count) {
    if (!isWiFiConnected) return false;
    
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Buat JSON array
    DynamicJsonDocument doc(2048);
    JsonArray dataArray = doc.createNestedArray("data");
    
    for (int i = 0; i < count; i++) {
        JsonObject dataObj = dataArray.createNestedObject();
        dataObj["userId"] = userId;
        dataObj["deviceId"] = deviceId;
        dataObj["temperature"] = batch[i].temperature;
        dataObj["ph"] = batch[i].ph;
        dataObj["distance"] = batch[i].distance;
        dataObj["ppm"] = batch[i].ppm;
        dataObj["timestamp"] = batch[i].timestamp;
    }
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpCode = http.POST(jsonString);
    bool success = (httpCode == HTTP_CODE_OK);
    
    if (success) {
        Serial.printf("Berhasil mengirim %d data\n", count);
    } else {
        Serial.printf("Gagal mengirim data, code: %d\n", httpCode);
    }
    
    http.end();
    return success;
}
