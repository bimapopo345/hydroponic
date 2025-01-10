import mongoose from "mongoose";

const waterStatsSchema = new mongoose.Schema({
  ph: { type: Number, default: 7.0 },
  temperature: { type: Number, default: 25.0 },
  oxygen: { type: Number, default: 8.0 },
  turbidity: { type: Number, default: 5.0 },
});

const historyEntrySchema = new mongoose.Schema({
  time: { type: String, required: true },
  ph: { type: Number, required: true },
  temperature: { type: Number, required: true },
  oxygen: { type: Number, required: true },
  turbidity: { type: Number, required: true },
});

const dashboardDataSchema = new mongoose.Schema({
  lastLogin: { type: Date, default: Date.now },
  stats: { type: waterStatsSchema, default: () => ({}) },
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
    default: () => ({
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
    }),
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
        ph: 7.0,
        temperature: 25.0,
        oxygen: 8.0,
        turbidity: 5.0,
      },
      history: Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        ph: Number((Math.random() * (7.5 - 6.5) + 6.5).toFixed(1)),
        temperature: Number((Math.random() * (27 - 23) + 23).toFixed(1)),
        oxygen: Number((Math.random() * (9 - 7) + 7).toFixed(1)),
        turbidity: Number((Math.random() * (6 - 4) + 4).toFixed(1)),
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

// Ensure profile and dashboardData are properly initialized
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
