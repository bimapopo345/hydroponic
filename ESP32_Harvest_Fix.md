# ESP32 Harvest Mode dengan Auto-Recovery

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

// WiFi credentials
const char* ssid = "Onlydems";
const char* password = "12345678";

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
float capacityPercent;
float temperatureCorrection = 0.39;

// Variabel untuk threshold dan timer
int ppmThreshold = 100;  // Default value
unsigned long lastThresholdCheck = 0;
const unsigned long CHECK_INTERVAL = 5000; // Check setiap 5 detik

// Timer variables untuk harvest mode
bool harvestMode = false;  // Mode panen aktif/tidak
bool timerStarted = false; // Timer sedang berjalan/tidak
unsigned long timerStartTime = 0;
const unsigned long ONE_HOUR = 3600000; // 1 jam dalam milidetik

void setup() {
  Serial.begin(115200);
  Wire.begin(8, 9);

  // Inisialisasi LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Inisialisasi...");

  // Koneksi WiFi
  connectToWiFi();

  // Inisialisasi sensor dan relay
  setupSensors();
}

void setupSensors() {
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
  http.begin("https://56eb-140-213-138-206.ngrok-free.app/api/relay-control/ESP32_01");
  int httpCode = http.GET();

  if (httpCode > 0) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc["success"] && doc["data"]["ppmThreshold"]) {
      int newThreshold = doc["data"]["ppmThreshold"];

      // Jika threshold berubah
      if (newThreshold != ppmThreshold) {
        ppmThreshold = newThreshold;
        Serial.printf("PPM threshold diupdate: %d\n", ppmThreshold);

        // Deteksi perubahan mode
        if (ppmThreshold == 800 && !harvestMode) {
          // Masuk mode panen
          harvestMode = true;
          timerStarted = true;
          timerStartTime = millis();
          Serial.println("Mode panen dimulai! Timer 1 jam aktif.");
        }
        else if (ppmThreshold != 800 && harvestMode) {
          // Keluar mode panen
          harvestMode = false;
          timerStarted = false;
          Serial.println("Kembali ke mode normal!");
        }
      }
    }
  }
  http.end();
}

void controlRelay() {
  if (harvestMode) {
    // Mode panen (threshold 800)
    if (timerStarted) {
      if (millis() - timerStartTime >= ONE_HOUR) {
        // Timer 1 jam habis
        timerStarted = false;
        digitalWrite(relayPin1, LOW);
        digitalWrite(relayPin2, LOW);
        Serial.println("Timer 1 jam habis!");
      } else {
        // Masih dalam 1 jam pertama
        if (tdsValue < 800) {
          digitalWrite(relayPin1, HIGH);
          digitalWrite(relayPin2, HIGH);
          Serial.printf("Mode Panen - Relay ON (PPM: %0.1f)\n", tdsValue);
        } else {
          digitalWrite(relayPin1, LOW);
          digitalWrite(relayPin2, LOW);
          Serial.printf("Mode Panen - Relay OFF (PPM: %0.1f)\n", tdsValue);
        }

        // Tampilkan sisa waktu
        unsigned long timeLeft = (ONE_HOUR - (millis() - timerStartTime)) / 1000;
        Serial.printf("Sisa waktu: %02d:%02d:%02d\n",
          timeLeft / 3600,
          (timeLeft % 3600) / 60,
          timeLeft % 60
        );
      }
    }
  } else {
    // Mode normal
    if (tdsValue < ppmThreshold) {
      digitalWrite(relayPin1, HIGH);
      digitalWrite(relayPin2, HIGH);
      Serial.printf("Mode Normal - Relay ON (PPM: %0.1f, Target: %d)\n", tdsValue, ppmThreshold);
    } else {
      digitalWrite(relayPin1, LOW);
      digitalWrite(relayPin2, LOW);
      Serial.printf("Mode Normal - Relay OFF (PPM: %0.1f, Target: %d)\n", tdsValue, ppmThreshold);
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
  if (harvestMode) {
    if (timerStarted) {
      // Tampilkan sisa waktu mode panen
      unsigned long timeLeft = (ONE_HOUR - (millis() - timerStartTime)) / 1000;
      lcd.printf("Panen: %02d:%02d", (timeLeft % 3600) / 60, timeLeft % 60);
    } else {
      lcd.print("Mode Panen OFF");
    }
  } else {
    // Display normal
    lcd.print("tmp=");
    lcd.print(temperature, 1);
    lcd.setCursor(9, 1);
    lcd.print("cap=");
    lcd.print(capacityPercent, 1);
  }
}

void readSensors() {
  // Baca suhu
  sensors.requestTemperatures();
  Celsius = sensors.getTempCByIndex(0);
  temperature = Celsius + temperatureCorrection;

  // Baca TDS
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

  // Baca jarak air
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH);
  distanceCm = duration * 0.034 / 2;
  capacityPercent = constrain(100 - (distanceCm / 32.1) * 100, 0, 100);
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
  http.begin("https://56eb-140-213-138-206.ngrok-free.app/api/sensor-data");
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

  // Baca semua sensor
  readSensors();

  // Kontrol relay berdasarkan mode
  controlRelay();

  // Update display
  updateDisplay();

  // Kirim data ke API
  sendDataToAPI();

  delay(3000);
}
```

## Perubahan Utama

1. Auto Recovery:

- Tidak perlu reset ESP32
- System otomatis kembali ke mode normal saat threshold ≠ 800
- Perubahan threshold langsung aktif

2. Mode Panen (threshold = 800):

- Timer 1 jam mulai otomatis
- Kontrol PPM selama timer berjalan
- Relay OFF setelah timer habis

3. Mode Normal (threshold ≠ 800):

- Kontrol PPM normal
- Relay ON saat PPM < threshold
- Monitor semua sensor

## Status Display

1. Mode Normal:

```
ppm=350 pH=7.00
tmp=25.5 cap=75%
```

2. Mode Panen (timer aktif):

```
ppm=750 pH=7.00
Panen: 45:30
```

3. Mode Panen (timer habis):

```
ppm=800 pH=7.00
Mode Panen OFF
```

## Log Serial

```
> PPM threshold diupdate: 800
> Mode panen dimulai! Timer 1 jam aktif.
> Sisa waktu: 00:45:30
> Timer 1 jam habis!
> PPM threshold diupdate: 100
> Kembali ke mode normal!
```
