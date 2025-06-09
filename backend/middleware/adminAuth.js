// Middleware untuk verifikasi role admin
const adminAuth = (req, res, next) => {
  try {
    console.log("AdminAuth Middleware - Checking user:", req.user);
    // Izinkan akses hanya jika username adalah Bima Prawang Saputra
    if (req.user && req.user.username === "Bima Prawang Saputra") {
      console.log("AdminAuth - Access granted for admin");
      next();
    } else {
      console.log("AdminAuth - Access denied: Not admin user");
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error in admin authentication",
    });
  }
};

export default adminAuth;
