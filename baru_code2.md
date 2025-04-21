# ESP32 Code untuk Kontrol Relay dengan PPM Threshold dari MongoDB

```cpp
#include <EEPROM.h>
#include "GravityTDS.h"
#include <OneWire.h>
#include <DallasTemperature.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define TdsSensorPin 4
#define ONE_WIRE_BUS 6
#define SensorPin 7
#define trigPin 5
#define echoPin 18
#define relayPin1 13
#define relayPin2 12
#define EEPROM_PPM_ADDR 0 // Alamat EEPROM untuk menyimpan PPM threshold

// WiFi credentials
const char* ssid = "Punyauqi";
const char* password = "klimat2025";

// API endpoint yang sudah di-ngrok
const char* SENSOR_API = "https://your-ngrok-url.app/api/sensor-data";
const char* RELAY_CONTROL_API = "https://your-ngrok-url.app/api/relay-control/ESP32_01";

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
GravityTDS gravityTds;
LiquidCrystal_I2C lcd(0x27, 16, 2);

float temperature = 25, tdsValue = 0;
float Celsius = 0;
float iteration = 0;
float voltage, pHValue;
float slope = -5.02;
float offset = 19.86;
long duration;
float distanceCm;
float distanceInch;
float temperatureCorrection = 0.39;

// Variabel untuk kontrol relay
int ppmThreshold = 300; // Default value
unsigned long lastThresholdCheck = 0;
const unsigned long THRESHOLD_CHECK_INTERVAL = 30000; // Check setiap 30 detik

void setup() {
  EEPROM.begin(512);
  Serial.begin(115200);

  // Load PPM threshold dari EEPROM
  EEPROM.get(EEPROM_PPM_ADDR, ppmThreshold);
  if (ppmThreshold < 0 || ppmThreshold > 2000) {
    ppmThreshold = 300; // Reset ke default jika nilai tidak valid
    EEPROM.put(EEPROM_PPM_ADDR, ppmThreshold);
    EEPROM.commit();
  }

  // Koneksi WiFi
  WiFi.disconnect(true);
  delay(1000);
  WiFi.begin(ssid, password);
  Serial.println("Mencoba menghubungkan ke WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\nTerhubung ke WiFi!");
  Serial.print("Alamat IP: ");
  Serial.println(WiFi.localIP());

  // Setup sensor dan LCD
  gravityTds.setPin(TdsSensorPin);
  gravityTds.setAref(3.3);
  gravityTds.setAdcRange(4096);
  gravityTds.begin();
  sensors.begin();
  pinMode(SensorPin, INPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(relayPin1, OUTPUT);
  pinMode(relayPin2, OUTPUT);
  digitalWrite(relayPin1, LOW);
  digitalWrite(relayPin2, LOW);

  Wire.begin(8, 9);
  lcd.begin(16, 2);
  lcd.backlight();
  lcd.clear();

  // Get initial threshold from MongoDB
  updatePPMThreshold();
}

void loop() {
  // Update PPM threshold setiap interval
  if (millis() - lastThresholdCheck >= THRESHOLD_CHECK_INTERVAL) {
    updatePPMThreshold();
    lastThresholdCheck = millis();
  }

  // Baca sensor suhu
  sensors.requestTemperatures();
  Celsius = sensors.getTempCByIndex(0);
  float correctedTemperature = Celsius + temperatureCorrection;
  temperature = correctedTemperature;

  // Baca sensor TDS
  gravityTds.setTemperature(temperature);
  gravityTds.update();
  tdsValue = gravityTds.getTdsValue();

  // Kontrol relay berdasarkan threshold dari MongoDB
  if (tdsValue < ppmThreshold) {
    digitalWrite(relayPin1, HIGH);
    digitalWrite(relayPin2, HIGH);
    Serial.printf("Relay ON - PPM (%0.1f) dibawah threshold (%d)\n", tdsValue, ppmThreshold);
  } else {
    digitalWrite(relayPin1, LOW);
    digitalWrite(relayPin2, LOW);
    Serial.printf("Relay OFF - PPM (%0.1f) mencukupi threshold (%d)\n", tdsValue, ppmThreshold);
  }

  // Baca sensor pH
  float totalVoltage = 0;
  for (int i = 0; i < 7; i++) {
    int sensorValue = analogRead(SensorPin);
    voltage = sensorValue * (3.3 / 4095.0);
    totalVoltage += voltage;
    delay(100);
  }
  voltage = totalVoltage / 7;
  pHValue = slope * voltage + offset;

  // Baca sensor jarak
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  duration = pulseIn(echoPin, HIGH);
  distanceCm = duration * 0.034 / 2;
  distanceInch = distanceCm * 0.393701;

  // Update LCD
  updateLCD(tdsValue, pHValue, correctedTemperature, distanceCm);

  // Kirim data ke API
  sendDataToAPI();

  iteration++;
  delay(3000);
}

void updateLCD(float tds, float ph, float temp, float distance) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("ppm=");
  lcd.print(tds, 0);
  lcd.setCursor(9, 0);
  lcd.print("pH=");
  lcd.print(ph, 2);
  lcd.setCursor(0, 1);
  lcd.print("°C=");
  lcd.print(temp, 1);
  lcd.setCursor(9, 1);
  lcd.print("cap=");
  lcd.print(distance, 1);
}

void updatePPMThreshold() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(RELAY_CONTROL_API);
  int httpCode = http.GET();

  if (httpCode > 0) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc.containsKey("data") && doc["data"].containsKey("ppmThreshold")) {
      int newThreshold = doc["data"]["ppmThreshold"];

      // Update threshold jika berbeda dan valid
      if (newThreshold != ppmThreshold && newThreshold > 0 && newThreshold <= 2000) {
        ppmThreshold = newThreshold;
        EEPROM.put(EEPROM_PPM_ADDR, ppmThreshold);
        EEPROM.commit();
        Serial.printf("PPM threshold diupdate: %d\n", ppmThreshold);
      }
    }
  }
  http.end();
}

void sendDataToAPI() {
  if (WiFi.status() != WL_CONNECTED) return;

  String jsonData = "{\"userId\": \"67906a8703f043e82dc7e9a1\",";
  jsonData += "\"deviceId\": \"ESP32_01\",";
  jsonData += "\"temperature\": " + String(temperature) + ",";
  jsonData += "\"ph\": " + String(pHValue, 2) + ",";
  jsonData += "\"distance\": " + String(distanceCm) + ",";
  jsonData += "\"ppm\": " + String(tdsValue, 0) + "}";

  HTTPClient http;
  http.begin(SENSOR_API);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(jsonData);
  if (httpResponseCode > 0) {
    Serial.println("Data berhasil dikirim");
  } else {
    Serial.printf("Gagal mengirim data: %d\n", httpResponseCode);
  }
  http.end();
}
```

## Perubahan dari Versi Sebelumnya

1. Endpoint API:

- API endpoint diubah untuk menggunakan URL ngrok
- Format response disesuaikan dengan schema MongoDB

2. Kontrol Relay:

- Threshold diambil dari collection MongoDB
- Logging lebih detail tentang status relay dan PPM

3. Update Threshold:

- Parsing JSON response dari MongoDB
- Validasi nilai threshold sebelum diupdate

4. Error Handling:

- Cek koneksi WiFi sebelum request
- Validasi response data
- Backup nilai di EEPROM

## Cara Penggunaan

1. Update `SENSOR_API` dan `RELAY_CONTROL_API` dengan URL ngrok Anda
2. Upload kode ke ESP32
3. Monitor Serial untuk melihat:
   - Status koneksi
   - Update threshold
   - Status relay
   - Hasil pengiriman data

## Troubleshooting

1. Jika threshold tidak terupdate:

   - Cek koneksi WiFi
   - Verifikasi URL ngrok
   - Cek format response dari API

2. Jika relay tidak berfungsi:

   - Cek nilai PPM saat ini vs threshold
   - Verifikasi pin relay
   - Cek log Serial

3. Jika data tidak terkirim:
   - Cek koneksi internet
   - Verifikasi URL endpoint
   - Cek format JSON request
