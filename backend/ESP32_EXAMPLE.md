# ESP32 Integration Guide - HidroNutrient

## Contoh Kode Arduino (ESP32)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Konfigurasi WiFi
const char* ssid = "YourWiFiSSID";
const char* password = "YourWiFiPassword";

// Konfigurasi API
const char* serverUrl = "http://localhost:5000/api/sensor-data";
const char* userId = "your-user-id";
const char* deviceId = "ESP32_01";

// Pin Sensor
const int TDS_PIN = 34;    // Pin ADC untuk sensor TDS/PPM
const int PH_PIN = 35;     // Pin ADC untuk sensor pH
const int TRIG_PIN = 5;    // Pin trigger sensor ultrasonik
const int ECHO_PIN = 18;   // Pin echo sensor ultrasonik
const int TEMP_PIN = 19;   // Pin data sensor suhu DS18B20

void setup() {
  Serial.begin(115200);

  // Koneksi WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");

  // Setup pin sensor
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Baca data sensor
    float temperature = readTemperature();
    float ph = readPH();
    float distance = readDistance();
    float ppm = readPPM();

    // Buat JSON object
    StaticJsonDocument<200> doc;
    doc["userId"] = userId;
    doc["deviceId"] = deviceId;
    doc["temperature"] = temperature;
    doc["ph"] = ph;
    doc["distance"] = distance;
    doc["ppm"] = ppm;

    // Serialize JSON ke string
    String jsonString;
    serializeJson(doc, jsonString);

    // Kirim data ke server
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.POST(jsonString);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error on sending POST: " + String(httpResponseCode));
    }

    http.end();
  }

  delay(5000); // Tunggu 5 detik sebelum pengiriman berikutnya
}

// Fungsi baca sensor
float readTemperature() {
  // Implementasi pembacaan sensor suhu DS18B20
  return 25.5; // Contoh nilai
}

float readPH() {
  // Implementasi pembacaan sensor pH
  int rawValue = analogRead(PH_PIN);
  float voltage = rawValue * (3.3 / 4095.0);
  return 7.0 - ((2.5 - voltage) / 0.18); // Contoh konversi
}

float readDistance() {
  // Implementasi pembacaan sensor ultrasonik
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  return duration * 0.034 / 2; // Konversi ke cm
}

float readPPM() {
  // Implementasi pembacaan sensor TDS/PPM
  int rawValue = analogRead(TDS_PIN);
  float voltage = rawValue * (3.3 / 4095.0);
  return voltage * 500; // Contoh konversi sederhana
}
```

## Catatan Implementasi

1. Library yang Dibutuhkan:

   - WiFi.h
   - HTTPClient.h
   - ArduinoJson.h (versi 6)

2. Kalibrasi Sensor:

   - pH: Gunakan larutan buffer pH 4.0 dan 7.0
   - TDS: Gunakan larutan standar 500ppm
   - Suhu: Tidak perlu kalibrasi untuk DS18B20
   - Jarak: Sesuaikan dengan posisi pemasangan

3. Power Supply:

   - Gunakan power supply 5V yang stabil
   - Rekomendasi menggunakan regulator tegangan

4. Tips:
   - Tambahkan error handling untuk koneksi WiFi
   - Simpan data di EEPROM saat offline
   - Implementasikan deep sleep untuk hemat daya
   - Gunakan rata-rata beberapa pembacaan

## Format Data JSON

```json
{
  "userId": "your-user-id",
  "deviceId": "ESP32_01",
  "temperature": 25.5,
  "ph": 6.5,
  "distance": 15.2,
  "ppm": 750
}
```

## Error Handling

```cpp
// Contoh penanganan error
if (WiFi.status() != WL_CONNECTED) {
    // Simpan ke EEPROM atau SD Card
    saveToStorage(sensorData);
    // Coba reconnect WiFi
    WiFi.reconnect();
}

if (httpResponseCode != 200) {
    // Log error dan simpan data
    logError("HTTP Error: " + String(httpResponseCode));
    saveToStorage(sensorData);
}
```

## Range Nilai yang Valid

```
Temperature: 20-30°C
pH: 5.5-7.0
Distance: 5-100 cm
PPM: 200-900 ppm
```
