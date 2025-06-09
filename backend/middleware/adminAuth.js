// Middleware untuk verifikasi role admin
const adminAuth = (req, res, next) => {
  try {
    // Izinkan akses hanya jika username adalah Bima Prawang Saputra
    if (req.user && req.user.username === "Bima Prawang Saputra") {
      next();
    } else {
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
