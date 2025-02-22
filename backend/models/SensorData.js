import mongoose from "mongoose";

const sensorDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
  },
  temperature: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  ph: {
    type: Number,
    required: true,
    min: 0,
    max: 14,
  },
  distance: {
    type: Number,
    required: true,
    min: 0,
    max: 500,
  },
  ppm: {
    type: Number,
    required: true,
    min: 0,
    max: 3000,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index untuk query yang lebih efisien
sensorDataSchema.index({ userId: 1, timestamp: -1 });
sensorDataSchema.index({ deviceId: 1, timestamp: -1 });

const SensorData = mongoose.model("SensorData", sensorDataSchema);

export default SensorData;
