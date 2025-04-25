# ESP32 Hidroponik Control dengan Timer

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

// Timer variables untuk relay
bool timerStarted = false;
unsigned long timerStartTime = 0;
const unsigned long ONE_HOUR = 3600000; // 1 jam dalam milidetik
bool highThresholdDetected = false;

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

  // Koneksi WiFi
  connectToWiFi();

  // Inisialisasi sensor
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
  http.begin("https://56eb-140-213-138-206.ngrok-free.app/api/relay-control/ESP32_01");
  int httpCode = http.GET();

  if (httpCode > 0) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc["success"] && doc["data"]["ppmThreshold"]) {
      int newThreshold = doc["data"]["ppmThreshold"];
      if (newThreshold != ppmThreshold) {
        ppmThreshold = newThreshold;
        Serial.printf("PPM threshold diupdate: %d\n", ppmThreshold);

        // Reset timer jika threshold berubah
        if (ppmThreshold == 800 && !highThresholdDetected) {
          highThresholdDetected = true;
          timerStarted = true;
          timerStartTime = millis();
          Serial.println("Timer 1 jam dimulai!");
        }
      }
    }
  }
  http.end();
}

void controlRelay() {
  if (ppmThreshold == 800) {
    if (highThresholdDetected && timerStarted) {
      // Periksa apakah 1 jam sudah berlalu
      if (millis() - timerStartTime >= ONE_HOUR) {
        digitalWrite(relayPin1, LOW);
        digitalWrite(relayPin2, LOW);
        timerStarted = false;
        Serial.println("Timer 1 jam selesai, relay dimatikan!");
      } else {
        // Relay masih ON selama timer berjalan
        digitalWrite(relayPin1, HIGH);
        digitalWrite(relayPin2, HIGH);

        // Tampilkan sisa waktu
        unsigned long timeLeft = (ONE_HOUR - (millis() - timerStartTime)) / 1000; // dalam detik
        Serial.printf("Sisa waktu: %02d:%02d:%02d\n",
          timeLeft / 3600,           // jam
          (timeLeft % 3600) / 60,    // menit
          timeLeft % 60              // detik
        );
      }
    }
  } else {
    // Untuk threshold selain 800, gunakan kontrol normal
    if (tdsValue < ppmThreshold) {
      digitalWrite(relayPin1, HIGH);
      digitalWrite(relayPin2, HIGH);
      Serial.printf("Relay ON - PPM (%0.1f) dibawah threshold (%d)\n", tdsValue, ppmThreshold);
    } else {
      digitalWrite(relayPin1, LOW);
      digitalWrite(relayPin2, LOW);
      Serial.printf("Relay OFF - PPM (%0.1f) mencukupi threshold (%d)\n", tdsValue, ppmThreshold);
    }
  }
}

void loop() {
  // Check threshold setiap interval
  if (millis() - lastThresholdCheck >= CHECK_INTERVAL) {
    getThresholdFromAPI();
    lastThresholdCheck = millis();
  }

  // Jika WiFi terputus, coba sambung kembali
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    return;
  }

  // Baca semua sensor
  sensors.requestTemperatures();
  Celsius = sensors.getTempCByIndex(0);
  float correctedTemperature = Celsius + temperatureCorrection;
  temperature = correctedTemperature;

  gravityTds.setTemperature(temperature);
  gravityTds.update();
  tdsValue = gravityTds.getTdsValue();

  // Kontrol relay dengan timer
  controlRelay();

  // Baca pH
  float totalVoltage = 0;
  for (int i = 0; i < 7; i++) {
    int sensorValue = analogRead(SensorPin);
    voltage = sensorValue * (3.3 / 4095.0);
    totalVoltage += voltage;
    delay(100);
  }
  voltage = totalVoltage / 7;
  pHValue = slope * voltage + offset;

  // Baca jarak ultrasonik
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  duration = pulseIn(echoPin, HIGH);
  distanceCm = duration * 0.034 / 2;
  distanceInch = distanceCm * 0.393701;
  capacityPercent = constrain(100 - (distanceCm / 32.1) * 100, 0, 100);

  // Update LCD dengan info timer jika aktif
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("ppm=");
  lcd.print(tdsValue, 0);
  lcd.setCursor(9, 0);
  lcd.print("pH=");
  lcd.print(pHValue, 2);

  // Tampilkan timer atau info normal
  lcd.setCursor(0, 1);
  if (timerStarted && ppmThreshold == 800) {
    unsigned long timeLeft = (ONE_HOUR - (millis() - timerStartTime)) / 1000;
    lcd.printf("Timer: %02d:%02d", (timeLeft % 3600) / 60, timeLeft % 60);
  } else {
    lcd.print("tmp=");
    lcd.print(correctedTemperature, 1);
    lcd.setCursor(9, 1);
    lcd.print("cap=");
    lcd.print(capacityPercent, 1);
  }

  // Kirim data ke API
  sendDataToAPI();

  iteration++;
  delay(3000);
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
    String response = http.getString();
    Serial.println("Data terkirim!");
  } else {
    Serial.print("Error: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}
```

## Perubahan Utama

1. Timer Control:

- Timer 1 jam dimulai saat threshold 800 terdeteksi
- Relay ON selama timer berjalan
- Relay OFF otomatis setelah 1 jam
- Reset timer jika threshold berubah ke 800 lagi

2. Display Info:

- LCD menampilkan sisa waktu timer
- Serial monitor menampilkan status timer
- Format waktu dalam HH:MM:SS

3. Kontrol Relay:

- Threshold 800: Kontrol dengan timer
- Threshold lain: Kontrol normal dengan PPM

## Cara Kerja

1. Deteksi Threshold 800:

```cpp
if (ppmThreshold == 800 && !highThresholdDetected) {
  highThresholdDetected = true;
  timerStarted = true;
  timerStartTime = millis();
}
```

2. Timer Control:

```cpp
if (millis() - timerStartTime >= ONE_HOUR) {
  digitalWrite(relayPin1, LOW);
  digitalWrite(relayPin2, LOW);
  timerStarted = false;
}
```

3. Display Timer:

```cpp
unsigned long timeLeft = (ONE_HOUR - (millis() - timerStartTime)) / 1000;
lcd.printf("Timer: %02d:%02d", (timeLeft % 3600) / 60, timeLeft % 60);
```
