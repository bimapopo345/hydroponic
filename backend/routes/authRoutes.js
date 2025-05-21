import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "bimapopo345@gmail.com",
    pass: process.env.EMAIL_PASS || "lqdo qyny xdkx lvsr",
  },
});

const router = express.Router();

// Login route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Return user data without password
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error occurred" });
  }
});

// Forgot Password route
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    await user.save();

    // Send password reset email
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h1>You requested a password reset</h1>
        <p>Click this link to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Password reset email has been sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Server error occurred" });
  }
});

// Reset Password route
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and new password are required" });
    }

    const user = await User.findOne({ resetPasswordToken: token });
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Server error occurred" });
  }
});

// Register route
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "Username or email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Return user data without password
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
    };

    res.status(201).json({ user: userResponse });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error occurred" });
  }
});

export default router;
