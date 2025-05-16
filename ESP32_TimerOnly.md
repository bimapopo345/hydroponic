# ESP32 dengan Timer Control

```cpp
// ... (semua include dan definisi pin sama seperti aslinya)

// Tambah variabel timer untuk mode panen
bool harvestMode = false;     // Mode panen aktif/tidak
bool timerStarted = false;    // Timer sedang berjalan
unsigned long timerStartTime; // Waktu mulai timer
const unsigned long ONE_HOUR = 3600000; // 1 jam dalam ms (60000 = 1 menit untuk testing)

// ... (kode setup dan fungsi lain tetap sama sampai getThresholdFromAPI)

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
          Serial.println("Mode panen dimulai! Timer 1 jam aktif.");
        }
        // Keluar mode panen jika threshold bukan 800
        else if (ppmThreshold != 800 && harvestMode) {
          harvestMode = false;
          timerStarted = false;
          Serial.println("Kembali ke mode normal!");
        }
      }
    }
  }
  http.end();
}

// Ubah bagian kontrol relay di loop()
void loop() {
  // ... (kode sebelum kontrol relay tetap sama)

  // Kontrol relay dengan threshold dan timer
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
          Serial.printf("Mode Panen - Relay ON (PPM: %0.1f)\n", tdsValue);
        } else {
          digitalWrite(relayPin1, LOW);
          digitalWrite(relayPin2, LOW);
          Serial.printf("Mode Panen - Relay OFF (PPM: %0.1f)\n", tdsValue);
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
      Serial.printf("Mode Normal - Relay ON (PPM: %0.1f)\n", tdsValue);
    } else {
      digitalWrite(relayPin1, LOW);
      digitalWrite(relayPin2, LOW);
      Serial.printf("Mode Normal - Relay OFF (PPM: %0.1f)\n", tdsValue);
    }
  }

  // ... (kode setelah kontrol relay tetap sama)
}

// ... (fungsi lain tetap sama)
```

## Perubahan pada Kode

1. Tambahan Variabel:

```cpp
bool harvestMode = false;     // Mode panen aktif/tidak
bool timerStarted = false;    // Timer sedang berjalan
unsigned long timerStartTime; // Waktu mulai timer
const unsigned long ONE_HOUR = 3600000; // 1 jam (ms)
```

2. Modifikasi getThresholdFromAPI():

- Deteksi threshold 800
- Set timer dan flags
- Auto recovery

3. Modifikasi Loop:

- Kontrol relay dengan timer
- Log status detail
- Auto-recovery ke mode normal

## Testing

1. Set ONE_HOUR untuk testing:

```cpp
// 1 jam (production)
const unsigned long ONE_HOUR = 3600000;

// 1 menit (testing)
const unsigned long ONE_HOUR = 60000;
```

2. Status Log:

```
PPM threshold diupdate: 800
Mode panen dimulai! Timer 1 jam aktif.
Mode Panen - Relay ON (PPM: 750.0)
Sisa waktu: 00:58:30
Timer 1 jam habis! Pompa OFF permanen.
```
