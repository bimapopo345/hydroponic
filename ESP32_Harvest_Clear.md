# ESP32 Harvest Mode dengan Timer Kontrol

```cpp
// ... (include libraries dan definisi pin sama seperti sebelumnya)

void controlRelay() {
  if (harvestMode) {
    // Mode panen (threshold 800) dengan timer 1 jam
    if (timerStarted) {
      if (millis() - timerStartTime >= ONE_HOUR) {
        // Timer 1 jam habis, relay permanen OFF
        timerStarted = false;
        digitalWrite(relayPin1, LOW);
        digitalWrite(relayPin2, LOW);
        Serial.println("Timer 1 jam habis! Pompa OFF permanen.");
      } else {
        // Masih dalam periode 1 jam:
        // - Relay ON jika PPM < 800
        // - Relay OFF jika PPM >= 800
        if (tdsValue < 800) {
          digitalWrite(relayPin1, HIGH);
          digitalWrite(relayPin2, HIGH);
          Serial.printf("Mode Panen - Relay ON (PPM: %0.1f dibawah 800)\n", tdsValue);
        } else {
          digitalWrite(relayPin1, LOW);
          digitalWrite(relayPin2, LOW);
          Serial.printf("Mode Panen - Relay OFF (PPM: %0.1f mencukupi)\n", tdsValue);
        }

        // Tampilkan sisa waktu timer
        unsigned long timeLeft = (ONE_HOUR - (millis() - timerStartTime)) / 1000;
        Serial.printf("Sisa waktu panen: %02d:%02d:%02d\n",
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
    // Mode normal (PPM bukan 800)
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

void getThresholdFromAPI() {
  // ... (kode koneksi API sama)

  if (httpCode > 0) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc["success"] && doc["data"]["ppmThreshold"]) {
      int newThreshold = doc["data"]["ppmThreshold"];

      if (newThreshold != ppmThreshold) {
        ppmThreshold = newThreshold;
        Serial.printf("PPM threshold diupdate: %d\n", ppmThreshold);

        // Deteksi mode panen (threshold = 800)
        if (ppmThreshold == 800 && !harvestMode) {
          // Mulai mode panen dengan timer 1 jam
          harvestMode = true;
          timerStarted = true;
          timerStartTime = millis();
          Serial.println("Mode panen dimulai! Timer 1 jam aktif.");
          Serial.println("- Pompa ON jika PPM < 800");
          Serial.println("- Pompa OFF jika PPM >= 800");
          Serial.println("- Setelah 1 jam, pompa permanen OFF");
        }
        else if (ppmThreshold != 800 && harvestMode) {
          // Keluar dari mode panen
          harvestMode = false;
          timerStarted = false;
          Serial.println("Kembali ke mode normal!");
          Serial.printf("Pompa akan kontrol PPM target: %d\n", ppmThreshold);
        }
      }
    }
  }
}
```

## Alur Kontrol Detail

1. Saat PPM = 800:

   ```
   Mode Panen AKTIF
   │
   ├─ Timer 1 jam berjalan
   │  │
   │  ├─ PPM < 800: Relay ON
   │  └─ PPM >= 800: Relay OFF
   │
   └─ Timer habis: Relay permanen OFF
   ```

2. Saat Timer Masih Aktif:

   ```
   PPM = 750 -> Relay ON
   PPM = 802 -> Relay OFF
   PPM = 780 -> Relay ON
   PPM = 805 -> Relay OFF
   ```

3. Setelah Timer Habis:

   ```
   PPM = 750 -> Relay tetap OFF
   PPM = 802 -> Relay tetap OFF
   ```

4. Kembali ke Mode Normal:
   ```
   Threshold diubah ke 400
   │
   ├─ harvestMode = false
   ├─ timerStarted = false
   │
   └─ Kontrol normal aktif:
      ├─ PPM < 400: Relay ON
      └─ PPM >= 400: Relay OFF
   ```

## Serial Output Sample

```
> PPM threshold diupdate: 800
> Mode panen dimulai! Timer 1 jam aktif.
> - Pompa ON jika PPM < 800
> - Pompa OFF jika PPM >= 800
> - Setelah 1 jam, pompa permanen OFF
>
> Mode Panen - Relay ON (PPM: 750.0 dibawah 800)
> Sisa waktu panen: 00:58:30
>
> Mode Panen - Relay OFF (PPM: 802.0 mencukupi)
> Sisa waktu panen: 00:45:20
>
> Mode Panen - Relay ON (PPM: 780.0 dibawah 800)
> Sisa waktu panen: 00:30:15
>
> Timer 1 jam habis! Pompa OFF permanen.
>
> PPM threshold diupdate: 400
> Kembali ke mode normal!
> Pompa akan kontrol PPM target: 400
>
> Mode Normal - Relay ON (PPM: 350.0 dibawah 400)
```

## Keterangan

1. Mode Panen (PPM 800):

   - Timer 1 jam aktif
   - Relay masih bisa ON/OFF selama timer berjalan
   - Setelah timer habis, relay permanen OFF

2. Selama Timer Aktif:

   - Relay ON saat PPM < 800
   - Relay OFF saat PPM >= 800
   - Monitor sisa waktu timer

3. Recovery Mode:
   - Set threshold < 800
   - Kembali ke kontrol normal
   - Tidak perlu reset ESP32
