import express from "express";
import SensorData from "../models/SensorData.js";

const router = express.Router();

// POST: Tambah data sensor baru
router.post("/sensor-data", async (req, res) => {
  try {
    const { userId, deviceId, temperature, ph, distance, ppm } = req.body;

    const sensorData = new SensorData({
      userId,
      deviceId,
      temperature,
      ph,
      distance,
      ppm,
      timestamp: new Date(),
    });

    await sensorData.save();

    res.status(201).json({
      success: true,
      data: sensorData,
    });
  } catch (error) {
    console.error("Error saving sensor data:", error);
    res.status(500).json({
      success: false,
      error: "Gagal menyimpan data sensor",
    });
  }
});

// GET: Ambil data sensor terbaru
router.get("/sensor-data/:userId/latest", async (req, res) => {
  try {
    const { userId } = req.params;

    const latestData = await SensorData.findOne({ userId })
      .sort({ timestamp: -1 })
      .select("-__v");

    if (!latestData) {
      return res.status(404).json({
        success: false,
        error: "Data sensor tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      data: latestData,
    });
  } catch (error) {
    console.error("Error fetching latest sensor data:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mengambil data sensor terbaru",
    });
  }
});

// GET: Ambil riwayat data sensor
router.get("/sensor-data/:userId/history", async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to, limit = 100 } = req.query;

    const query = { userId };

    // Filter berdasarkan rentang waktu jika ada
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }

    const history = await SensorData.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .select("-__v");

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching sensor history:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mengambil riwayat data sensor",
    });
  }
});

// GET: Statistik data sensor
router.get("/sensor-data/:userId/stats", async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = "24h" } = req.query;

    // Tentukan rentang waktu berdasarkan periode
    const now = new Date();
    let startTime = new Date();

    switch (period) {
      case "24h":
        startTime.setHours(now.getHours() - 24);
        break;
      case "7d":
        startTime.setDate(now.getDate() - 7);
        break;
      case "30d":
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime.setHours(now.getHours() - 24);
    }

    const stats = await SensorData.aggregate([
      {
        $match: {
          userId: userId,
          timestamp: { $gte: startTime, $lte: now },
        },
      },
      {
        $group: {
          _id: null,
          avgTemperature: { $avg: "$temperature" },
          avgPh: { $avg: "$ph" },
          avgDistance: { $avg: "$distance" },
          avgPpm: { $avg: "$ppm" },
          maxTemperature: { $max: "$temperature" },
          maxPh: { $max: "$ph" },
          maxDistance: { $max: "$distance" },
          maxPpm: { $max: "$ppm" },
          minTemperature: { $min: "$temperature" },
          minPh: { $min: "$ph" },
          minDistance: { $min: "$distance" },
          minPpm: { $min: "$ppm" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || null,
    });
  } catch (error) {
    console.error("Error fetching sensor statistics:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mengambil statistik data sensor",
    });
  }
});

// POST: Simulasi data sensor (untuk testing)
router.post("/sensor-data/simulate", async (req, res) => {
  try {
    const { userId, deviceId, count = 1 } = req.body;
    const data = [];

    for (let i = 0; i < count; i++) {
      const sensorData = new SensorData({
        userId,
        deviceId,
        temperature: (Math.random() * (30 - 20) + 20).toFixed(1),
        ph: (Math.random() * (7 - 5.5) + 5.5).toFixed(1),
        distance: (Math.random() * (100 - 5) + 5).toFixed(1),
        ppm: (Math.random() * (900 - 200) + 200).toFixed(1),
        timestamp: new Date(Date.now() - i * 60000), // Each data point 1 minute apart
      });

      await sensorData.save();
      data.push(sensorData);
    }

    res.status(201).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error simulating sensor data:", error);
    res.status(500).json({
      success: false,
      error: "Gagal mensimulasikan data sensor",
    });
  }
});

export default router;
