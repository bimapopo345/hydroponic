# ESP32 Timer Control Fix

```cpp
// ... (include dan definisi sama)

// Variabel timer
unsigned long timerStartTime = 0;
bool timerStarted = false;
bool timerExpired = false;
const unsigned long ONE_HOUR = 3600000; // 1 jam (60000 = 1 menit untuk testing)

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

void loop() {
  // ... (kode awal sama)

  // Baca sensor
  sensors.requestTemperatures();
  Celsius = sensors.getTempCByIndex(0);
  temperature = Celsius + 0.39;

  gravityTds.setTemperature(temperature);
  gravityTds.update();
  tdsValue = gravityTds.getTdsValue();

  // Kontrol relay berdasarkan threshold dan timer
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

  // ... (kode akhir sama)
}
```

## Perubahan Utama

1. Variabel Timer:

```cpp
unsigned long timerStartTime = 0;
bool timerStarted = false;     // Timer sedang berjalan
bool timerExpired = false;     // Timer sudah habis
```

2. Logika Timer:

```
IF threshold = 800 THEN
  IF timer aktif AND timer belum habis THEN
    IF dalam 1 jam pertama THEN
      IF PPM < 800 THEN relay ON
      IF PPM ≥ 800 THEN relay OFF
    ELSE
      Timer habis -> relay OFF permanen
    END IF
  END IF
ELSE
  Mode normal (kontrol PPM biasa)
END IF
```

3. Status:

```
Mode Panen - PPM dibawah 800:
Timer aktif -> Relay ON
PPM: 750, Sisa waktu: 00:45:30

Mode Panen - PPM diatas 800:
Timer aktif -> Relay OFF
PPM: 920, Sisa waktu: 00:30:15

Timer Habis:
Relay OFF permanen
```

## Testing

1. Set threshold 800:

- Timer mulai
- PPM < 800: relay ON
- PPM > 800: relay OFF
- 1 jam habis: relay OFF permanen

2. Set threshold < 800:

- Timer reset
- Kembali ke mode normal
- Kontrol PPM normal
