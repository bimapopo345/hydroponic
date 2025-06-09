import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const adminServer = express();

adminServer.use(cors());
adminServer.use(express.json());

// Admin routes
adminServer.use("/api/admin", adminRoutes);

const PORT = process.env.ADMIN_PORT || 5001;

adminServer.listen(PORT, () => {
  console.log(`Admin server running on port ${PORT}`);
});

export default adminServer;
