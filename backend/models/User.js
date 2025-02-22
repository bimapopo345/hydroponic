import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
  },
  password: {
    type: String,
    required: true,
  },
  profile: {
    fullName: String,
    avatar: String,
    bio: String,
    phone: String,
    address: String,
    company: String,
    position: String,
    socialLinks: {
      facebook: String,
      twitter: String,
      linkedin: String,
    },
  },
  dashboardData: {
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    stats: {
      temperature: Number,
      ph: Number,
      distance: Number,
      ppm: Number,
    },
    history: [
      {
        time: String,
        temperature: Number,
        ph: Number,
        distance: Number,
        ppm: Number,
      },
    ],
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

const User = mongoose.model("User", userSchema);

export default User;
