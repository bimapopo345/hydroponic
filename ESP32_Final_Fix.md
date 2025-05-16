# ESP32 Hidroponik Control - Final Fix

Kode ESP32 lengkap dengan fitur mode panen, EEPROM, dan kalibrasi.

```cpp
#include <EEPROM.h>
#include "GravityTDS.h"
#include <OneWire.h>
#include <DallasTemperature.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Pin definitions
#define TdsSensorPin 4
#define ONE_WIRE_BUS 6
#define SensorPin 7
#define trigPin 5
#define echoPin 18
#define relayPin1 13
#define relayPin2 12

// EEPROM addresses
#define ADDR_K_VALUE 0      // float, 4 bytes
#define ADDR_TDS_REF 10     // float, 4 bytes

// WiFi credentials
const char* ssid = "Onlydems";
const char* password = "12345678";

// API endpoint
const char* apiEndpoint = "https://bcbf-103-224-73-240.ngrok-free.app";

// Inisialisasi sensor dan LCD
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
GravityTDS gravityTds;
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Sensor variables
float temperature = 25, tdsValue = 0;
float Celsius = 0;
float iteration = 0;
float voltage, pHValue;
float slope = -5.02;
float offset = 19.86;
long duration;
float distanceCm;
float distanceInch;
float capacityPercent;
float temperatureCorrection = 0.39;

// Control variables
int ppmThreshold = 100;  // Default value
unsigned long lastThresholdCheck = 0;
const unsigned long CHECK_INTERVAL = 5000;

// Harvest mode variables
bool harvestMode = false;
bool timerStarted = false;
unsigned long timerStartTime;
const unsigned long ONE_HOUR = 3600000; // 1 jam (60000 = 1 menit untuk testing)

// TDS calibration
float kValue = 1.0;    // Default K-value

void loadCalibrationData() {
  EEPROM.get(ADDR_K_VALUE, kValue);
  float tdsRef;
  EEPROM.get(ADDR_TDS_REF, tdsRef);

  Serial.println("Loading calibration data:");
  Serial.printf("K-Value: %.2f\n", kValue);
  Serial.printf("TDS Ref: %.2f\n", tdsRef);

  gravityTds.setKvalue(kValue);
}

void saveCalibrationData() {
  EEPROM.put(ADDR_K_VALUE, kValue);
  EEPROM.put(ADDR_TDS_REF, tdsValue);
  EEPROM.commit();
  Serial.println("Calibration data saved!");
}

void setup() {
  EEPROM.begin(512);
  Serial.begin(115200);

  // Inisialisasi LCD
  Wire.begin(8, 9);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Inisialisasi...");

  // Setup TDS sensor with calibration
  gravityTds.setPin(TdsSensorPin);
  gravityTds.setAref(3.3);
  gravityTds.setAdcRange(4096);
  loadCalibrationData();
  gravityTds.begin();

  // Other sensor setup
  sensors.begin();
  pinMode(SensorPin, INPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(relayPin1, OUTPUT);
  pinMode(relayPin2, OUTPUT);
  digitalWrite(relayPin1, LOW);
  digitalWrite(relayPin2, LOW);

  connectToWiFi();
  getThresholdFromAPI();
}

void connectToWiFi() {
  WiFi.disconnect(true);
  delay(1000);
  WiFi.begin(ssid, password);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  lcd.setCursor(0, 1);
  lcd.print(ssid);

  Serial.println("Mencoba menghubungkan ke WiFi...");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    lcd.print(".");
    delay(500);

    static uint8_t dotCount = 0;
    dotCount++;
    if (dotCount > 16) {
      lcd.setCursor(0, 1);
      lcd.print("                ");
      lcd.setCursor(0, 1);
      lcd.print(ssid);
      dotCount = 0;
    }
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected!");
  lcd.setCursor(0, 1);
  lcd.print("IP:");
  lcd.print(WiFi.localIP().toString());

  Serial.println("\nTerhubung ke WiFi!");
  Serial.print("Alamat IP: ");
  Serial.println(WiFi.localIP());
}

void getThresholdFromAPI() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(apiEndpoint) + "/api/relay-control/ESP32_01";
  http.begin(url);
  int httpCode = http.GET();

  if (httpCode > 0) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc["success"] && doc["data"]["ppmThreshold"]) {
      int newThreshold = doc["data"]["ppmThreshold"];

      if (newThreshold != ppmThreshold) {
        Serial.printf("PPM threshold diupdate: %d -> %d\n", ppmThreshold, newThreshold);
        ppmThreshold = newThreshold;

        // Deteksi mode panen (threshold = 800)
        if (ppmThreshold == 800 && !harvestMode) {
          harvestMode = true;
          timerStarted = true;
          timerStartTime = millis();
          Serial.println("Mode panen dimulai!");
          Serial.println("- Timer 1 jam aktif");
          Serial.println("- Pompa ON jika PPM < 800");
          Serial.println("- Setelah 1 jam, pompa OFF permanen");
        }
        // Keluar mode panen jika threshold bukan 800
        else if (ppmThreshold != 800 && harvestMode) {
          harvestMode = false;
          timerStarted = false;
          Serial.println("Kembali ke mode normal!");
          Serial.printf("Kontrol PPM dengan threshold: %d\n", ppmThreshold);
        }
      }
    }
  }
  http.end();
}

void readSensors() {
  // Read temperature
  sensors.requestTemperatures();
  Celsius = sensors.getTempCByIndex(0);
  temperature = Celsius + temperatureCorrection;

  // Read TDS
  gravityTds.setTemperature(temperature);
  gravityTds.update();
  tdsValue = gravityTds.getTdsValue();

  // Read pH (average of 7 readings)
  float totalVoltage = 0;
  for (int i = 0; i < 7; i++) {
    int sensorValue = analogRead(SensorPin);
    voltage = sensorValue * (3.3 / 4095.0);
    totalVoltage += voltage;
    delay(10);
  }
  voltage = totalVoltage / 7;
  pHValue = slope * voltage + offset;

  // Read water level with ultrasonic
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH);
  distanceCm = duration * 0.034 / 2;
  capacityPercent = constrain(100 - (distanceCm / 32.1) * 100, 0, 100);

  // Debug sensor values
  Serial.printf("Temperature: %.1f°C, TDS: %.1f PPM, pH: %.2f, Level: %.1f%%\n",
    temperature, tdsValue, pHValue, capacityPercent);
}

void controlRelay() {
  if (harvestMode) {
    // Mode panen (threshold 800)
    if (timerStarted) {
      if (millis() - timerStartTime >= ONE_HOUR) {
        // Timer 1 jam habis, relay permanen OFF
        timerStarted = false;
        digitalWrite(relayPin1, LOW);
        digitalWrite(relayPin2, LOW);
        Serial.println("Timer 1 jam habis! Pompa OFF permanen.");
      } else {
        // Masih dalam 1 jam pertama
        if (tdsValue < 800) {
          digitalWrite(relayPin1, HIGH);
          digitalWrite(relayPin2, HIGH);
          Serial.printf("Mode Panen - Pompa ON (PPM: %0.1f dibawah 800)\n", tdsValue);
        } else {
          digitalWrite(relayPin1, LOW);
          digitalWrite(relayPin2, LOW);
          Serial.printf("Mode Panen - Pompa OFF (PPM: %0.1f mencukupi)\n", tdsValue);
        }

        // Log sisa waktu
        unsigned long timeLeft = (ONE_HOUR - (millis() - timerStartTime)) / 1000;
        Serial.printf("Sisa waktu: %02d:%02d:%02d\n",
          timeLeft / 3600,
          (timeLeft % 3600) / 60,
          timeLeft % 60
        );
      }
    } else {
      // Timer habis, relay tetap OFF
      digitalWrite(relayPin1, LOW);
      digitalWrite(relayPin2, LOW);
    }
  } else {
    // Mode normal (threshold bukan 800)
    if (tdsValue < ppmThreshold) {
      digitalWrite(relayPin1, HIGH);
      digitalWrite(relayPin2, HIGH);
      Serial.printf("Mode Normal - Pompa ON (PPM: %0.1f dibawah %d)\n", tdsValue, ppmThreshold);
    } else {
      digitalWrite(relayPin1, LOW);
      digitalWrite(relayPin2, LOW);
      Serial.printf("Mode Normal - Pompa OFF (PPM: %0.1f mencukupi %d)\n", tdsValue, ppmThreshold);
    }
  }
}

void updateDisplay() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("ppm=");
  lcd.print(tdsValue, 0);
  lcd.setCursor(9, 0);
  lcd.print("pH=");
  lcd.print(pHValue, 2);
  lcd.setCursor(0, 1);
  lcd.print("tmp=");
  lcd.print(temperature, 1);
  lcd.setCursor(9, 1);
  lcd.print("cap=");
  lcd.print(capacityPercent, 1);
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
  String url = String(apiEndpoint) + "/api/sensor-data";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    Serial.println("Data terkirim!");
  } else {
    Serial.printf("Error: %d\n", httpResponseCode);
  }

  http.end();
}

void loop() {
  // Check calibration command
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.startsWith("calibrate")) {
      float newKValue = cmd.substring(9).toFloat();
      if (newKValue > 0) {
        kValue = newKValue;
        gravityTds.setKvalue(kValue);
        saveCalibrationData();
        Serial.printf("K-Value updated to: %.2f\n", kValue);
      }
    }
  }

  // Check threshold setiap interval
  if (millis() - lastThresholdCheck >= CHECK_INTERVAL) {
    getThresholdFromAPI();
    lastThresholdCheck = millis();
  }

  // Reconnect WiFi jika terputus
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    return;
  }

  // Baca semua sensor
  readSensors();

  // Kontrol relay dengan timer untuk mode panen
  controlRelay();

  // Update LCD
  updateDisplay();

  // Kirim data ke API
  sendDataToAPI();

  delay(3000);
}
```

## Cara Kerja Utama

1. Inisialisasi:

- Load kalibrasi dari EEPROM
- Setup semua sensor
- Koneksi WiFi
- Get threshold awal

2. Mode Normal:

- Kontrol relay berdasarkan threshold
- Update LCD normal
- Kirim data ke API

3. Mode Panen (Threshold = 800):

- Timer 1 jam aktif
- Kontrol relay dengan PPM 800 selama timer
- Setelah timer habis, relay OFF
- Auto recovery ke mode normal

4. Logging:

- Nilai sensor ke Serial
- Status timer dan relay
- Hasil kalibrasi
- Response API
