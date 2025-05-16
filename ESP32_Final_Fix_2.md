# ESP32 Final Fix 2 (dengan EEPROM & Timer)

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
#define ADDR_KVALUE 0     // float, 4 bytes
#define ADDR_PPM_REF 10   // float, 4 bytes
#define ADDR_TEMP_C  20   // float, 4 bytes

// WiFi credentials
const char* ssid = "Onlydems";
const char* password = "12345678";

// Inisialisasi sensor dan LCD
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
GravityTDS gravityTds;
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Sensor variables
float temperature = 25, tdsValue = 0;
float Celsius = 0;
float voltage, pHValue;
float slope = -5.02;
float offset = 19.86;
long duration;
float distanceCm;
float capacityPercent;
float temperatureCorrection = 0.39;

// Calibration variables
float kValue = 1.0;        // TDS K-Value
float ppmReference = 0.0;  // Referensi PPM
float tempCalibration = 0.0; // Koreksi suhu

// Timer variables
unsigned long timerStartTime = 0;
bool timerStarted = false;
bool timerExpired = false;
const unsigned long ONE_HOUR = 3600000; // 1 jam (60000 = 1 menit untuk testing)

// Control variables
int ppmThreshold = 100;  // Default value
unsigned long lastThresholdCheck = 0;
const unsigned long CHECK_INTERVAL = 5000;

void loadCalibrationData() {
  EEPROM.get(ADDR_KVALUE, kValue);
  EEPROM.get(ADDR_PPM_REF, ppmReference);
  EEPROM.get(ADDR_TEMP_C, tempCalibration);

  if (isnan(kValue) || kValue <= 0) kValue = 1.0;
  if (isnan(tempCalibration)) tempCalibration = 0.39;

  Serial.println("Loading calibration data:");
  Serial.printf("K-Value: %.2f\n", kValue);
  Serial.printf("PPM Ref: %.1f\n", ppmReference);
  Serial.printf("Temp Correction: %.2f\n", tempCalibration);

  gravityTds.setKvalue(kValue);
  temperatureCorrection = tempCalibration;
}

void saveCalibrationData() {
  EEPROM.put(ADDR_KVALUE, kValue);
  EEPROM.put(ADDR_PPM_REF, tdsValue); // Simpan PPM saat ini sebagai referensi
  EEPROM.put(ADDR_TEMP_C, temperatureCorrection);
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

  // Setup TDS sensor dengan kalibrasi
  gravityTds.setPin(TdsSensorPin);
  gravityTds.setAref(3.3);
  gravityTds.setAdcRange(4096);
  loadCalibrationData();
  gravityTds.begin();

  // Setup sensor lain
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
  // ... (sama seperti sebelumnya)
}

void getThresholdFromAPI() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin("https://bcbf-103-224-73-240.ngrok-free.app/api/relay-control/ESP32_01");
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
          timerExpired = false;
          timerStartTime = millis();
          Serial.println("Mode panen dimulai!");
          Serial.println("- Timer 1 jam aktif");
          Serial.println("- Pompa ON jika PPM < 800");
          Serial.println("- Setelah 1 jam, pompa OFF permanen");
        }
        // Reset mode panen jika threshold bukan 800
        else if (ppmThreshold != 800) {
          timerStarted = false;
          timerExpired = false;
          Serial.println("Kembali ke mode normal!");
          Serial.printf("Kontrol PPM dengan threshold: %d\n", ppmThreshold);
        }
      }
    }
  }
  http.end();
}

void readSensors() {
  // Baca suhu
  sensors.requestTemperatures();
  Celsius = sensors.getTempCByIndex(0);
  temperature = Celsius + temperatureCorrection;

  // Baca TDS dengan kalibrasi
  gravityTds.setTemperature(temperature);
  gravityTds.update();
  tdsValue = gravityTds.getTdsValue();

  // Baca pH
  float totalVoltage = 0;
  for (int i = 0; i < 7; i++) {
    int sensorValue = analogRead(SensorPin);
    voltage = sensorValue * (3.3 / 4095.0);
    totalVoltage += voltage;
    delay(10);
  }
  voltage = totalVoltage / 7;
  pHValue = slope * voltage + offset;

  // Baca level air
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH);
  distanceCm = duration * 0.034 / 2;
  capacityPercent = constrain(100 - (distanceCm / 32.1) * 100, 0, 100);
}

void controlRelay() {
  if (ppmThreshold == 800) {
    // Mode panen
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
          Serial.printf("Mode Panen - Pompa OFF (PPM: %.1f mencukupi)\n", tdsValue);
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
      // Timer habis, pompa tetap OFF
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

void checkCalibrationCommand() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    // Format: calibrate:k:1.02 atau calibrate:temp:0.5
    if (cmd.startsWith("calibrate")) {
      int firstColon = cmd.indexOf(':');
      int secondColon = cmd.indexOf(':', firstColon + 1);

      if (firstColon > 0 && secondColon > 0) {
        String type = cmd.substring(firstColon + 1, secondColon);
        float value = cmd.substring(secondColon + 1).toFloat();

        if (type == "k" && value > 0) {
          kValue = value;
          gravityTds.setKvalue(kValue);
          saveCalibrationData();
          Serial.printf("K-Value updated: %.2f\n", kValue);
        }
        else if (type == "temp" && !isnan(value)) {
          temperatureCorrection = value;
          saveCalibrationData();
          Serial.printf("Temp correction: %.2f\n", temperatureCorrection);
        }
      }
    }
  }
}

void loop() {
  // Check kalibrasi via Serial
  checkCalibrationCommand();

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

  // Update LCD
  updateDisplay();

  // Kirim data ke API
  sendDataToAPI();

  delay(3000);
}
```

## Perubahan dari Versi Sebelumnya

1. EEPROM & Kalibrasi:

- Simpan K-Value TDS
- Simpan referensi PPM
- Simpan koreksi suhu
- Kalibrasi via Serial

2. Mode Panen:

- Timer aktif saat threshold = 800
- PPM ≥ 800: Relay OFF, timer jalan
- PPM < 800: Relay ON selama timer aktif
- 1 jam habis: Relay OFF permanen

3. Recovery Mode:

- Set threshold < 800
- Reset semua flag timer
- Kembali ke mode normal

## Cara Kalibrasi

Via Serial Monitor:

```
calibrate:k:1.02    // Set K-Value TDS
calibrate:temp:0.5  // Set koreksi suhu
```

## Testing

1. Mode Normal:

```
PPM threshold: 400
PPM: 350 -> Relay ON
PPM: 420 -> Relay OFF
```

2. Mode Panen:

```
PPM threshold: 800 -> Timer start
PPM: 750 -> Relay ON
PPM: 920 -> Relay OFF (timer tetap jalan)
Timer habis -> Relay OFF permanen
```

3. Recovery:

```
PPM threshold: 400
Timer reset
Kembali kontrol normal
```
