import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Get user dashboard data
router.get("/dashboard/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user data without sensitive information
    const userData = {
      username: user.username,
      email: user.email,
      profile: user.profile || {},
      dashboardData: user.dashboardData || {
        lastLogin: new Date(),
        stats: {
          tds: 0,
          ec: 0,
          temperature: 0,
          ph: 0,
        },
        history: [],
      },
    };

    res.json(userData);
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Server error occurred" });
  }
});

// Update user profile
router.put("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.profile = {
      ...user.profile,
      ...profileData,
    };

    await user.save();
    res.json({
      message: "Profile updated successfully",
      profile: user.profile,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Server error occurred" });
  }
});

export default router;
