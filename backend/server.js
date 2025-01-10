import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname } from "path";
import User from "./models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bimapopo345@gmail.com",
    pass: "lqdo qyny xdkx lvsr",
  },
});

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://fishtech-v2.vercel.app" // Production frontend URL
        : "http://localhost:5173", // Development frontend URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect("mongodb+srv://bimapopo81:Bima1234@sinau.q23pt.mongodb.net/", {
    dbName: "air",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Generate random water stats
const generateWaterStats = () => ({
  ph: Number((Math.random() * (7.5 - 6.5) + 6.5).toFixed(1)),
  temperature: Number((Math.random() * (27 - 23) + 23).toFixed(1)),
  oxygen: Number((Math.random() * (9 - 7) + 7).toFixed(1)),
  turbidity: Number((Math.random() * (6 - 4) + 4).toFixed(1)),
});

// Send welcome email
const sendWelcomeEmail = async (email, username) => {
  try {
    await transporter.sendMail({
      from: "bimapopo345@gmail.com",
      to: email,
      subject: "Welcome to GrowFeed!",
      html: `
        <h2>Welcome to GrowFeed, ${username}!</h2>
        <p>Thank you for registering with GrowFeed. We're excited to have you on board!</p>
        <p>With your account, you can:</p>
        <ul>
          <li>Monitor your aquarium's water quality</li>
          <li>Track historical data</li>
          <li>Receive expert recommendations</li>
        </ul>
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>Best regards,<br>The GrowFeed Team</p>
      `,
    });
    console.log("Welcome email sent successfully");
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};

// Routes
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  console.log("Registration attempt:", { username, email });

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        error:
          existingUser.username === username
            ? "Username already exists"
            : "Email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with initial dashboard data
    const user = new User({
      username,
      email,
      password: hashedPassword,
      profile: {
        fullName: "",
        avatar: "",
        bio: "",
        phone: "",
        address: "",
        company: "",
        position: "",
        socialLinks: {
          facebook: "",
          twitter: "",
          linkedin: "",
        },
      },
      dashboardData: {
        lastLogin: new Date(),
        stats: generateWaterStats(),
        history: Array.from({ length: 24 }, (_, i) => ({
          time: `${i}:00`,
          ...generateWaterStats(),
        })),
      },
    });

    await user.save();
    console.log("User saved successfully:", user._id);

    // Send welcome email
    await sendWelcomeEmail(email, username);

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", { username });

  try {
    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login and generate new stats
    user.dashboardData.lastLogin = new Date();
    user.dashboardData.stats = generateWaterStats();
    user.dashboardData.history = Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      ...generateWaterStats(),
    }));

    await user.save();
    console.log("User logged in successfully:", user._id);

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
        dashboardData: user.dashboardData,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/dashboard/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log("Fetching dashboard for user:", userId);

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure profile exists
    if (!user.profile) {
      console.log("Initializing missing profile for user:", userId);
      user.profile = {
        fullName: "",
        avatar: "",
        bio: "",
        phone: "",
        address: "",
        company: "",
        position: "",
        socialLinks: {
          facebook: "",
          twitter: "",
          linkedin: "",
        },
      };
    }

    // Ensure dashboardData exists
    if (!user.dashboardData) {
      console.log("Initializing missing dashboardData for user:", userId);
      user.dashboardData = {
        lastLogin: new Date(),
        stats: generateWaterStats(),
        history: Array.from({ length: 24 }, (_, i) => ({
          time: `${i}:00`,
          ...generateWaterStats(),
        })),
      };
    }

    // Generate new stats for real-time feel
    const newStats = generateWaterStats();
    user.dashboardData.stats = newStats;
    user.dashboardData.history = [
      ...user.dashboardData.history.slice(1),
      { time: new Date().toLocaleTimeString(), ...newStats },
    ];

    await user.save();
    console.log("Dashboard data updated for user:", userId);

    res.status(200).json({
      username: user.username,
      email: user.email,
      profile: user.profile,
      dashboardData: user.dashboardData,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({
      error: "Failed to load dashboard data",
      details: err.message,
    });
  }
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  console.log("Password reset requested for:", email);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate reset token
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${
      process.env.NODE_ENV === "production"
        ? "https://fishtech-v2.vercel.app"
        : "http://localhost:5173"
    }/reset-password/${token}`;
    const mailOptions = {
      from: "bimapopo345@gmail.com",
      to: user.email,
      subject: "Password Reset Request - GrowFeed",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${user.username},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="padding: 10px 20px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        <p>Best regards,<br>The GrowFeed Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Reset email sent to:", email);
    res.status(200).json({ message: "Reset email sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  console.log("Password reset attempt with token");

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Send confirmation email
    await transporter.sendMail({
      from: "bimapopo345@gmail.com",
      to: user.email,
      subject: "Password Reset Successful - GrowFeed",
      html: `
        <h2>Password Reset Successful</h2>
        <p>Hi ${user.username},</p>
        <p>Your password has been successfully reset.</p>
        <p>If you did not perform this action, please contact us immediately.</p>
        <p>Best regards,<br>The GrowFeed Team</p>
      `,
    });

    console.log("Password reset successful for user:", user._id);
    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  const profileData = req.body;
  console.log("Profile update for user:", userId);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update profile fields
    user.profile = {
      ...user.profile,
      ...profileData,
    };

    await user.save();
    console.log("Profile updated successfully for user:", userId);

    res.status(200).json({
      message: "Profile updated successfully",
      profile: user.profile,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
