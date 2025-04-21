import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Schema untuk plant preset dan relay control
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

// POST: Set PPM threshold baru
router.post("/relay-control", async (req, res) => {
  try {
    const { deviceId, plantType, weekNumber, ppmThreshold } = req.body;

    const relayControl = new RelayControl({
      deviceId,
      plantType,
      weekNumber,
      ppmThreshold,
    });

    await relayControl.save();

    res.status(201).json({
      success: true,
      data: relayControl,
    });
  } catch (error) {
    console.error("Error setting relay control:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mengatur kontrol relay",
    });
  }
});

// GET: Ambil pengaturan relay terbaru untuk device tertentu
router.get("/relay-control/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const latestControl = await RelayControl.findOne({ deviceId }).sort({
      timestamp: -1,
    });

    if (!latestControl) {
      return res.status(404).json({
        success: false,
        error: "Pengaturan relay tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: latestControl,
    });
  } catch (error) {
    console.error("Error fetching relay control:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mengambil pengaturan relay",
    });
  }
});

export default router;
