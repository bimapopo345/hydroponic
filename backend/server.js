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
import SensorData from "./models/SensorData.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import relayRoutes from "./routes/relayRoutes.js";
import { logRoutes, logMiddleware } from "./routes/logRoutes.js";

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
        ? "https://your-frontend-url.vercel.app"
        : "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());

// Add log middleware before routes
app.use(logMiddleware);

// Routes
app.use("/api", sensorRoutes);
app.use("/api", relayRoutes);
app.use("/logweb", logRoutes); // Add new log web route

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://bimapopo81:Bima1234@sinau.q23pt.mongodb.net/hidroponik",
    {
      dbName: "hidroponik",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected to hidroponik database"))
  .catch((err) => console.log(err));

// Keep existing routes...
// ... (rest of the file remains the same)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Log web interface available at http://localhost:${PORT}/logweb`);
});
