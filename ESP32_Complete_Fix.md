# ESP32 Complete Fix

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
float correctedTemperature = 0;
float pHValue = 0;
long duration;
float distanceCm;
float distanceInch;
float capacityPercent;

// Control variables
int ppmThreshold = 100;  // Default value
unsigned long lastThresholdCheck = 0;
const unsigned long CHECK_INTERVAL = 5000;  // Check setiap 5 detik

// Timer variables
unsigned long timerStartTime = 0;
bool timerStarted = false;      // Timer sedang berjalan
bool timerExpired = false;      // Timer sudah habis
const unsigned long ONE_HOUR = 3600000; // 1 jam (60000 = 1 menit untuk testing)

void setup() {
  Serial.begin(115200);
  Wire.begin(8, 9);

  // Inisialisasi LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Inisialisasi...");

  // Setup sensor
  gravityTds.setPin(TdsSensorPin);
  gravityTds.setAref(3.3);
  gravityTds.setAdcRange(4096);
  gravityTds.begin();

  sensors.begin();
  pinMode(SensorPin, INPUT);    // pH
  pinMode(trigPin, OUTPUT);     // ultrasonic
  pinMode(echoPin, INPUT);      // ultrasonic
  pinMode(relayPin1, OUTPUT);   // relay 1
  pinMode(relayPin2, OUTPUT);   // relay 2

  // Initial relay state
  digitalWrite(relayPin1, LOW);
  digitalWrite(relayPin2, LOW);

  // Koneksi WiFi
  connectToWiFi();

  // Get initial threshold
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

        // Mulai timer jika threshold 800
        if (ppmThreshold == 800 && !timerStarted && !timerExpired) {
          timerStarted = true;
          timerStartTime = millis();
          Serial.println("Mode panen dimulai!");
          Serial.println("- Timer 1 jam aktif");
          Serial.println("- Pompa aktif jika PPM < 800");
          Serial.println("- Setelah 1 jam, pompa OFF permanen");
        }
        // Reset timer jika threshold bukan 800
        else if (ppmThreshold != 800) {
          timerStarted = false;
          timerExpired = false;
          Serial.println("Kembali ke mode normal!");
        }
      }
    }
  }
  http.end();
}

void readSensors() {
  // Baca suhu & PPM
  sensors.requestTemperatures();
  Celsius = sensors.getTempCByIndex(0);
  correctedTemperature = Celsius + 0.39;
  temperature = correctedTemperature;

  gravityTds.setTemperature(temperature);
  gravityTds.update();
  tdsValue = gravityTds.getTdsValue();

  // Baca pH
  float totalVoltage = 0;
  for (int i = 0; i < 7; i++) {
    int sensorValue = analogRead(SensorPin);
    float voltage = sensorValue * (3.3 / 4095.0);
    totalVoltage += voltage;
    delay(10);
  }
  float voltage = totalVoltage / 7;
  pHValue = -5.02 * voltage + 19.86;

  // Baca level air
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH);
  distanceCm = duration * 0.034 / 2;
  capacityPercent = constrain(100 - (distanceCm / 32.1) * 100, 0, 100);

  // Debug values
  Serial.printf("Suhu: %.1f°C, PPM: %.1f, pH: %.2f, Level: %.1f%%\n",
    temperature, tdsValue, pHValue, capacityPercent);
}

void controlRelay() {
  if (ppmThreshold == 800) {
    // Mode panen (threshold 800)
    if (timerStarted && !timerExpired) {
      // Cek apakah timer 1 jam habis
      if (millis() - timerStartTime >= ONE_HOUR) {
        timerExpired = true;
        digitalWrite(relayPin1, LOW);
        digitalWrite(relayPin2, LOW);
        Serial.println("Timer 1 jam habis! Pompa OFF permanen.");
      } else {
        // Masih dalam 1 jam pertama
        if (tdsValue < 800) {
          digitalWrite(relayPin1, HIGH);
          digitalWrite(relayPin2, HIGH);
          Serial.printf("Mode Panen - Pompa ON (PPM: %.1f dibawah 800)\n", tdsValue);
        } else {
          digitalWrite(relayPin1, LOW);
          digitalWrite(relayPin2, LOW);
          Serial.printf("Mode Panen - Pompa OFF (PPM: %.1f diatas 800)\n", tdsValue);
        }

        // Log sisa waktu
        unsigned long timeLeft = (ONE_HOUR - (millis() - timerStartTime)) / 1000;
        Serial.printf("Sisa waktu: %02d:%02d:%02d\n",
          timeLeft / 3600,
          (timeLeft % 3600) / 60,
          timeLeft % 60
        );
      }
    } else if (timerExpired) {
      // Timer sudah habis, pompa tetap OFF
      digitalWrite(relayPin1, LOW);
      digitalWrite(relayPin2, LOW);
    }
  } else {
    // Mode normal
    if (tdsValue < ppmThreshold) {
      digitalWrite(relayPin1, HIGH);
      digitalWrite(relayPin2, HIGH);
      Serial.printf("Mode Normal - Pompa ON (PPM: %.1f dibawah %d)\n", tdsValue, ppmThreshold);
    } else {
      digitalWrite(relayPin1, LOW);
      digitalWrite(relayPin2, LOW);
      Serial.printf("Mode Normal - Pompa OFF (PPM: %.1f mencukupi %d)\n", tdsValue, ppmThreshold);
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

  // Baca sensor
  readSensors();

  // Kontrol relay
  controlRelay();

  // Update display
  updateDisplay();

  // Kirim data ke API
  sendDataToAPI();

  delay(3000);
}
```

## Fitur Utama

1. Mode Normal (Threshold ≠ 800):

- Kontrol PPM biasa
- Pompa ON jika PPM < threshold
- Pompa OFF jika PPM ≥ threshold

2. Mode Panen (Threshold = 800):

- Timer 1 jam mulai otomatis
- Selama timer aktif:
  - PPM < 800: Pompa ON
  - PPM ≥ 800: Pompa OFF
- Setelah 1 jam: Pompa OFF permanen

3. Recovery Mode:

- Set threshold selain 800
- Timer & flags direset
- Kembali ke mode normal

## Output Serial

```
# Mode Normal
PPM threshold diupdate: 400
Mode Normal - Pompa ON (PPM: 350.0 dibawah 400)

# Switch ke Mode Panen
PPM threshold diupdate: 800
Mode panen dimulai!
- Timer 1 jam aktif
- Pompa aktif jika PPM < 800
- Setelah 1 jam, pompa OFF permanen

# Dalam Mode Panen
Mode Panen - Pompa ON (PPM: 750.0 dibawah 800)
Sisa waktu: 00:45:30

Mode Panen - Pompa OFF (PPM: 920.0 diatas 800)
Sisa waktu: 00:30:20

Timer 1 jam habis! Pompa OFF permanen.

# Recovery ke Normal
PPM threshold diupdate: 400
Kembali ke mode normal!
Mode Normal - Pompa ON (PPM: 350.0 dibawah 400)
```

## Testing Mode

Untuk testing cepat, ubah timer jadi 1 menit:

```cpp
const unsigned long ONE_HOUR = 60000;  // 1 menit
```
