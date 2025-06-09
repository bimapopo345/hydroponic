import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import getUserData from "../middleware/getUserData.js";

const router = express.Router();

// Route untuk update PPM (hanya admin)
router.post("/update-ppm", getUserData, adminAuth, async (req, res) => {
  try {
    console.log("Admin update PPM request received:", req.body);
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
    console.log("Relay response:", data);
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
