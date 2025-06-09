import User from "../models/User.js";

// Middleware untuk mendapatkan data user dari token
const getUserData = async (req, res, next) => {
  try {
    console.log("Getting user data from request...");
    // Untuk sementara kita cek berdasarkan body request
    const { username } = req.body;
    console.log("Username from request:", username);

    if (username) {
      const user = await User.findOne({ username });
      if (user) {
        console.log("User found:", user.username);
        req.user = user;
      } else {
        console.log("User not found for username:", username);
      }
    } else {
      console.log("No username in request");
    }
    next();
  } catch (error) {
    console.error("Error in getUserData middleware:", error);
    next();
  }
};

export default getUserData;
