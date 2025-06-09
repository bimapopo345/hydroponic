import express from "express";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Route untuk update PPM (hanya admin)
router.post("/update-ppm", adminAuth, async (req, res) => {
  try {
    const { deviceId, plantType, weekNumber, ppmThreshold } = req.body;

    // Forward request ke endpoint relay-control yang sudah ada
    const relayResponse = await fetch(
      "http://localhost:5000/api/relay-control",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId,
          plantType,
          weekNumber,
          ppmThreshold,
        }),
      }
    );

    const data = await relayResponse.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update PPM settings",
      error: error.message,
    });
  }
});

export default router;
