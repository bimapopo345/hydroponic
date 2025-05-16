# ESP32 Hidroponik Control dengan Timer Panen

Kode lengkap ESP32 untuk kontrol hidroponik dengan fitur timer khusus mode panen.

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

// Inisialisasi sensor dan LCD
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
GravityTDS gravityTds;
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Variabel sensor
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

// Variabel kontrol
int ppmThreshold = 100;  // Default value
unsigned long lastThresholdCheck = 0;
const unsigned long CHECK_INTERVAL = 5000;  // Check setiap 5 detik

// Variabel mode panen
bool harvestMode = false;     // Mode panen aktif/tidak
bool timerStarted = false;    // Timer sedang berjalan
unsigned long timerStartTime; // Waktu mulai timer
const unsigned long ONE_HOUR = 3600000; // 1 jam dalam ms (60000 = 1 menit untuk testing)

void setup() {
  Serial.begin(115200);
  Wire.begin(8, 9);  // SDA = GPIO 8, SCL = GPIO 9

  // Inisialisasi LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Inisialisasi...");

  // Setup sensor & relay
  setupSensors();

  // Koneksi WiFi
  connectToWiFi();

  // Get initial threshold
  getThresholdFromAPI();
}

void setupSensors() {
  // Setup TDS sensor
  gravityTds.setPin(TdsSensorPin);
  gravityTds.setAref(3.3);
  gravityTds.setAdcRange(4096);
  gravityTds.begin();

  // Setup temperature sensor
  sensors.begin();

  // Setup pins
  pinMode(SensorPin, INPUT);    // pH
  pinMode(trigPin, OUTPUT);     // ultrasonic
  pinMode(echoPin, INPUT);      // ultrasonic
  pinMode(relayPin1, OUTPUT);   // relay 1
  pinMode(relayPin2, OUTPUT);   // relay 2

  // Initial relay state
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
  http.begin("https://bcbf-103-224-73-240.ngrok-free.app/api/relay-control/ESP32_01");
  int httpCode = http.GET();

  if (httpCode > 0) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc["success"] && doc["data"]["ppmThreshold"]) {
      int newThreshold = doc["data"]["ppmThreshold"];

      // Jika threshold berubah
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
          Serial.println("- Relay ON jika PPM < 800");
          Serial.println("- Setelah 1 jam, relay permanen OFF");
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
  if (harvestMode) {
    // Mode panen (threshold 800)
    if (timerStarted) {
      if (millis() - timerStartTime >= ONE_HOUR) {
        // Timer 1 jam habis, relay permanen OFF
        timerStarted = false;
        digitalWrite(relayPin1, LOW);
        digitalWrite(relayPin2, LOW);
        Serial.println("Timer 1 jam habis! Relay OFF permanen.");
      } else {
        // Masih dalam 1 jam pertama
        if (tdsValue < 800) {
          digitalWrite(relayPin1, HIGH);
          digitalWrite(relayPin2, HIGH);
          Serial.printf("Mode Panen - Relay ON (PPM: %0.1f dibawah 800)\n", tdsValue);
        } else {
          digitalWrite(relayPin1, LOW);
          digitalWrite(relayPin2, LOW);
          Serial.printf("Mode Panen - Relay OFF (PPM: %0.1f mencukupi)\n", tdsValue);
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
      // Timer sudah habis, relay tetap OFF
      digitalWrite(relayPin1, LOW);
      digitalWrite(relayPin2, LOW);
    }
  } else {
    // Mode normal (non-panen)
    if (tdsValue < ppmThreshold) {
      digitalWrite(relayPin1, HIGH);
      digitalWrite(relayPin2, HIGH);
      Serial.printf("Mode Normal - Relay ON (PPM: %0.1f dibawah %d)\n", tdsValue, ppmThreshold);
    } else {
      digitalWrite(relayPin1, LOW);
      digitalWrite(relayPin2, LOW);
      Serial.printf("Mode Normal - Relay OFF (PPM: %0.1f mencukupi %d)\n", tdsValue, ppmThreshold);
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
  http.begin("https://bcbf-103-224-73-240.ngrok-free.app/api/sensor-data");
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

  // Kontrol relay
  controlRelay();

  // Update display
  updateDisplay();

  // Kirim data ke API
  sendDataToAPI();

  delay(3000);
}
```

## Cara Kerja

1. Inisialisasi:

   - Setup sensor (TDS, pH, suhu, ultrasonik)
   - Setup LCD I2C
   - Setup WiFi
   - Setup relay
   - Get threshold awal

2. Mode Normal (Threshold ≠ 800):

   - Relay ON jika PPM < threshold
   - Relay OFF jika PPM ≥ threshold
   - Kontrol normal terus berjalan

3. Mode Panen (Threshold = 800):

   - Timer 1 jam mulai
   - Selama timer berjalan:
     - Relay ON jika PPM < 800
     - Relay OFF jika PPM ≥ 800
   - Setelah timer habis:
     - Relay permanen OFF

4. Recovery Mode:
   - Set threshold < 800
   - Sistem kembali ke mode normal
   - Tidak perlu reset ESP32

## Testing

1. Untuk testing cepat, ubah durasi timer:

```cpp
// Di bagian variabel global
const unsigned long ONE_HOUR = 60000; // 1 menit
```

2. Upload ke ESP32 dan monitor:

   - Serial output untuk status detail
   - LCD untuk nilai sensor
   - Status relay

3. Urutan test:

   ```
   a. Set threshold 400
      - Verifikasi kontrol normal
      - Monitor relay ON/OFF

   b. Set threshold 800
      - Verifikasi timer mulai
      - Monitor relay selama 1 jam
      - Verifikasi relay OFF setelah 1 jam

   c. Set threshold 100
      - Verifikasi kembali ke mode normal
      - Monitor kontrol relay normal
   ```
