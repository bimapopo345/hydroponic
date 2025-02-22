#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include <Arduino.h>
#include "config.h"
#include <OneWire.h>
#include <DallasTemperature.h>

class SensorManager {
private:
    // Sensor suhu setup
    OneWire oneWire;
    DallasTemperature tempSensor;
    
    // Kalibrasi pH
    const float PH_CALIBRATION_FACTOR = 3.5;
    const float PH_OFFSET = 0.0;
    
    // Kalibrasi TDS
    const float TDS_CALIBRATION_FACTOR = 0.5;
    const float TDS_TEMPERATURE_COEFFICIENT = 0.02;
    
    // Buffer untuk rata-rata pembacaan
    const int NUM_SAMPLES = 10;
    float phSamples[10];
    float tdsSamples[10];
    int sampleIndex = 0;

public:
    SensorManager() : oneWire(TEMP_PIN), tempSensor(&oneWire) {
        // Inisialisasi sensor suhu
        tempSensor.begin();
        
        // Inisialisasi pin ultrasonik
        pinMode(TRIG_PIN, OUTPUT);
        pinMode(ECHO_PIN, INPUT);
        
        // Inisialisasi pin analog
        pinMode(TDS_PIN, INPUT);
        pinMode(PH_PIN, INPUT);
    }

    // Baca suhu (dalam Celsius)
    float readTemperature() {
        tempSensor.requestTemperatures();
        float temp = tempSensor.getTempCByIndex(0);
        return (temp != DEVICE_DISCONNECTED_C) ? temp : 0.0;
    }

    // Baca pH dengan rata-rata 10 pembacaan
    float readPH() {
        float voltage = analogRead(PH_PIN) * (3.3 / 4095.0);
        float phValue = 7 + ((2.5 - voltage) / PH_CALIBRATION_FACTOR) + PH_OFFSET;
        
        // Simpan ke buffer
        phSamples[sampleIndex] = phValue;
        
        // Hitung rata-rata
        float average = 0;
        for (int i = 0; i < NUM_SAMPLES; i++) {
            average += phSamples[i];
        }
        average /= NUM_SAMPLES;
        
        // Update index
        sampleIndex = (sampleIndex + 1) % NUM_SAMPLES;
        
        return average;
    }

    // Baca jarak air (dalam cm)
    float readDistance() {
        // Kirim pulse
        digitalWrite(TRIG_PIN, LOW);
        delayMicroseconds(2);
        digitalWrite(TRIG_PIN, HIGH);
        delayMicroseconds(10);
        digitalWrite(TRIG_PIN, LOW);
        
        // Baca durasi
        long duration = pulseIn(ECHO_PIN, HIGH);
        
        // Konversi ke cm (kecepatan suara = 343m/s)
        return duration * 0.034 / 2;
    }

    // Baca PPM dengan kompensasi suhu
    float readPPM() {
        float voltage = analogRead(TDS_PIN) * (3.3 / 4095.0);
        float temperature = readTemperature();
        
        // Kompensasi suhu
        float compensationCoefficient = 1.0 + TDS_TEMPERATURE_COEFFICIENT * (temperature - 25.0);
        float compensatedVoltage = voltage / compensationCoefficient;
        
        // Konversi ke PPM
        float tdsValue = (133.42 * pow(compensatedVoltage, 3) - 255.86 * pow(compensatedVoltage, 2) + 857.39 * compensatedVoltage) * TDS_CALIBRATION_FACTOR;
        
        // Simpan ke buffer
        tdsSamples[sampleIndex] = tdsValue;
        
        // Hitung rata-rata
        float average = 0;
        for (int i = 0; i < NUM_SAMPLES; i++) {
            average += tdsSamples[i];
        }
        average /= NUM_SAMPLES;
        
        return average;
    }

    // Reset buffer sampel
    void resetSamples() {
        for (int i = 0; i < NUM_SAMPLES; i++) {
            phSamples[i] = 0;
            tdsSamples[i] = 0;
        }
        sampleIndex = 0;
    }
};

#endif // SENSOR_MANAGER_H
