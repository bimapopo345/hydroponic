# ESP32 Harvest Control (PPM 800)

```cpp
// Kode sama seperti sebelumnya sampai bagian variabel timer

// Tambahan flag untuk mode panen
bool harvestMode = false;  // Flag untuk menandai mode panen aktif
bool timerExpired = false; // Flag untuk menandai timer 1 jam sudah habis

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

        // Deteksi mode panen (threshold 800)
        if (ppmThreshold == 800 && !harvestMode) {
          harvestMode = true;
          timerStarted = true;
          timerStartTime = millis();
          timerExpired = false;
          Serial.println("Mode panen dimulai! Timer 1 jam aktif.");
        }
      }
    }
  }
  http.end();
}

void controlRelay() {
  // Mode panen (threshold 800)
  if (harvestMode) {
    if (timerStarted && !timerExpired) {
      // Cek apakah timer 1 jam sudah habis
      if (millis() - timerStartTime >= ONE_HOUR) {
        timerExpired = true;
        timerStarted = false;
        digitalWrite(relayPin1, LOW);
        digitalWrite(relayPin2, LOW);
        Serial.println("Timer 1 jam habis - Mode panen selesai!");
      } else {
        // Selama timer belum habis, kontrol relay berdasarkan PPM
        if (tdsValue < 800) {
          digitalWrite(relayPin1, HIGH);
          digitalWrite(relayPin2, HIGH);
          Serial.printf("Relay ON - PPM (%0.1f) dibawah 800\n", tdsValue);
        } else {
          digitalWrite(relayPin1, LOW);
          digitalWrite(relayPin2, LOW);
          Serial.printf("Relay OFF - PPM (%0.1f) mencukupi\n", tdsValue);
        }

        // Tampilkan sisa waktu
        unsigned long timeLeft = (ONE_HOUR - (millis() - timerStartTime)) / 1000;
        Serial.printf("Sisa waktu mode panen: %02d:%02d:%02d\n",
          timeLeft / 3600,           // jam
          (timeLeft % 3600) / 60,    // menit
          timeLeft % 60              // detik
        );
      }
    } else if (timerExpired) {
      // Setelah timer habis, relay tetap OFF
      digitalWrite(relayPin1, LOW);
      digitalWrite(relayPin2, LOW);
    }
  } else {
    // Mode normal (threshold bukan 800)
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

// Update LCD display untuk menampilkan status panen
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
    if (timerExpired) {
      lcd.print("PANEN SELESAI!");
    } else if (timerStarted) {
      unsigned long timeLeft = (ONE_HOUR - (millis() - timerStartTime)) / 1000;
      lcd.printf("Panen: %02d:%02d", (timeLeft % 3600) / 60, timeLeft % 60);
    }
  } else {
    lcd.print("tmp=");
    lcd.print(correctedTemperature, 1);
    lcd.setCursor(9, 1);
    lcd.print("cap=");
    lcd.print(capacityPercent, 1);
  }
}

void loop() {
  if (millis() - lastThresholdCheck >= CHECK_INTERVAL) {
    getThresholdFromAPI();
    lastThresholdCheck = millis();
  }

  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    return;
  }

  // Baca sensor
  sensors.requestTemperatures();
  Celsius = sensors.getTempCByIndex(0);
  temperature = Celsius + temperatureCorrection;

  gravityTds.setTemperature(temperature);
  gravityTds.update();
  tdsValue = gravityTds.getTdsValue();

  // Kontrol relay dengan logika panen
  controlRelay();

  // Baca sensor lain dan update display
  readSensors();
  updateDisplay();
  sendDataToAPI();

  delay(3000);
}
```

## Cara Kerja

1. Mode Normal (PPM < 800):

- Relay ON jika PPM < threshold
- Relay OFF jika PPM >= threshold
- Kontrol normal berkelanjutan

2. Mode Panen (PPM = 800):

- Timer 1 jam dimulai saat threshold 800 terdeteksi
- Selama 1 jam pertama:
  - Relay ON jika PPM < 800
  - Relay OFF jika PPM >= 800
- Setelah 1 jam:
  - Relay permanen OFF
  - Tidak ada lagi kontrol PPM
  - Display menunjukkan "PANEN SELESAI!"

## Status Display

```
Mode Normal:
ppm=350 pH=7.00
tmp=25.5 cap=75%

Mode Panen (aktif):
ppm=750 pH=7.00
Panen: MM:SS

Mode Panen (selesai):
ppm=800 pH=7.00
PANEN SELESAI!
```

## Notes

- Timer 1 jam hanya aktif sekali saat deteksi awal PPM 800
- Setelah timer habis, pompa tidak akan aktif lagi
- Perlu reset ESP32 untuk memulai siklus baru
