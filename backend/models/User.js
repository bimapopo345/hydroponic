import mongoose from "mongoose";

// Schema for nutrient solution stats: TDS, EC, Temperature, pH
const nutrientStatsSchema = new mongoose.Schema({
  tds: { type: Number, default: 300 }, // in ppm
  ec: { type: Number, default: 800 }, // in us/cm
  temperature: { type: Number, default: 25.0 }, // in °C
  ph: { type: Number, default: 6.0 },
});

const historyEntrySchema = new mongoose.Schema({
  time: { type: String, required: true },
  tds: { type: Number, required: true },
  ec: { type: Number, required: true },
  temperature: { type: Number, required: true },
  ph: { type: Number, required: true },
});

const dashboardDataSchema = new mongoose.Schema({
  lastLogin: { type: Date, default: Date.now },
  stats: { type: nutrientStatsSchema, default: () => ({}) },
  history: { type: [historyEntrySchema], default: [] },
});

const socialLinksSchema = new mongoose.Schema({
  facebook: { type: String, default: "" },
  twitter: { type: String, default: "" },
  linkedin: { type: String, default: "" },
});

const profileSchema = new mongoose.Schema({
  fullName: { type: String, default: "" },
  avatar: { type: String, default: "" },
  bio: { type: String, default: "" },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  company: { type: String, default: "" },
  position: { type: String, default: "" },
  socialLinks: { type: socialLinksSchema, default: () => ({}) },
});

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  profile: {
    type: profileSchema,
    default: () => ({}),
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  dashboardData: {
    type: dashboardDataSchema,
    default: () => ({
      lastLogin: new Date(),
      stats: {
        tds: 300,
        ec: 800,
        temperature: 25.0,
        ph: 6.0,
      },
      history: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        tds: 300 + Math.floor(Math.random() * 200),
        ec: 800 + Math.floor(Math.random() * 300),
        temperature: Number((Math.random() * (28 - 20) + 20).toFixed(1)),
        ph: Number((Math.random() * (6.8 - 5.5) + 5.5).toFixed(1)),
      })),
    }),
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
UserSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Initialize profile and dashboardData if missing
UserSchema.pre("save", function (next) {
  if (!this.profile) {
    this.profile = this.schema.path("profile").default();
  }
  if (!this.dashboardData) {
    this.dashboardData = this.schema.path("dashboardData").default();
  }
  next();
});

const User = mongoose.model("User", UserSchema);

export default User;
