# Schema untuk Kontrol Relay

## MongoDB Schema

```javascript
const relayControlSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    default: "ESP32_01",
  },
  plantType: {
    type: String,
    enum: ["selada", "pakcoy"],
    required: true,
  },
  weekNumber: {
    type: Number,
    enum: [1, 2, 3],
    required: true,
  },
  ppmThreshold: {
    type: Number,
    required: true,
    min: 0,
    max: 2000,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index untuk query yang lebih efisien
relayControlSchema.index({ deviceId: 1, timestamp: -1 });

const RelayControl = mongoose.model("RelayControl", relayControlSchema);
```

## API Endpoints

### 1. Set PPM Threshold

```http
POST /api/relay-control

Request Body:
{
    "deviceId": "ESP32_01",
    "plantType": "selada",
    "weekNumber": 1,
    "ppmThreshold": 100
}

Response 201:
{
    "success": true,
    "data": {
        "deviceId": "ESP32_01",
        "plantType": "selada",
        "weekNumber": 1,
        "ppmThreshold": 100,
        "timestamp": "2025-02-22T00:52:45.000Z"
    }
}
```

### 2. Get Current Settings

```http
GET /api/relay-control/:deviceId

Response 200:
{
    "success": true,
    "data": {
        "deviceId": "ESP32_01",
        "plantType": "selada",
        "weekNumber": 1,
        "ppmThreshold": 100,
        "timestamp": "2025-02-22T00:52:45.000Z"
    }
}
```

## PPM Values Reference

### Selada

- Minggu pertama: 100 PPM
- Minggu kedua: 400 PPM
- Minggu ketiga: 800 PPM

### Pakcoy

- Minggu pertama: 100 PPM
- Minggu kedua: 400 PPM
- Minggu ketiga: 800 PPM
