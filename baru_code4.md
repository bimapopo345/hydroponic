# ESP32 Code dengan PPM Threshold dari API

```cpp
#include <EEPROM.h>
#include "GravityTDS.h"
#include <OneWire.h>
#include <DallasTemperature.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // Untuk parsing JSON

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

// Variabel untuk threshold
int ppmThreshold = 100;  // Default value
unsigned long lastThresholdCheck = 0;
const unsigned long CHECK_INTERVAL = 30000; // Check setiap 30 detik

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
  http.begin("https://6d49-103-167-106-105.ngrok-free.app/api/relay-control/ESP32_01");
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
      }
    }
  }
  http.end();
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

  // Kontrol relay dengan threshold dari API
  if (tdsValue < ppmThreshold) {
    digitalWrite(relayPin1, HIGH);
    digitalWrite(relayPin2, HIGH);
    Serial.printf("Relay ON - PPM (%0.1f) dibawah threshold (%d)\n", tdsValue, ppmThreshold);
  } else {
    digitalWrite(relayPin1, LOW);
    digitalWrite(relayPin2, LOW);
    Serial.printf("Relay OFF - PPM (%0.1f) mencukupi threshold (%d)\n", tdsValue, ppmThreshold);
  }

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

  // Update LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("ppm=");
  lcd.print(tdsValue, 0);
  lcd.setCursor(9, 0);
  lcd.print("pH=");
  lcd.print(pHValue, 2);
  lcd.setCursor(0, 1);
  lcd.print("tmp=");
  lcd.print(correctedTemperature, 1);
  lcd.setCursor(9, 1);
  lcd.print("cap=");
  lcd.print(capacityPercent, 1);

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
  http.begin("https://6d49-103-167-106-105.ngrok-free.app/api/sensor-data");
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

1. Tambahan Fungsi:

- `getThresholdFromAPI()` untuk mengambil threshold PPM dari backend
- Check threshold setiap 30 detik
- Logging status relay dan PPM yang lebih detail

2. Penyederhanaan:

- Tanpa penyimpanan di EEPROM
- Fokus pada komunikasi dengan API
- Threshold default 100 PPM
- Interval check yang lebih panjang (30 detik vs 3 detik)

3. Kontrol Relay:

- Menggunakan threshold dari API
- ON jika PPM < threshold
- OFF jika PPM >= threshold

## Cara Penggunaan

1. Upload kode ke ESP32
2. Pastikan backend sudah running
3. Update URL ngrok sesuai dengan yang aktif
4. Monitor Serial untuk melihat:
   - Status koneksi
   - Update threshold
   - Status relay dan PPM

## Troubleshooting

1. Jika threshold tidak terupdate:

   - Cek koneksi WiFi
   - Verifikasi URL ngrok
   - Cek response dari API

2. Jika relay tidak berfungsi:
   - Cek nilai PPM vs threshold
   - Verifikasi pin relay
   - Monitor log Serial
