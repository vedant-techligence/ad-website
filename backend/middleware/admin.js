/**
 * adminMiddleware
 * Runs AFTER authMiddleware — assumes req.user is already set.
 * Rejects requests from non-admin users with a 403.
 *
 * Requires the User model / JWT payload to include a `role` field.
 * Ask Vedant (auth/User model owner) to confirm the exact field name
 * and value used for admins (e.g. role: "admin") so this matches.
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin privileges required.",
    });
  }

  next();
};

module.exports = { adminMiddleware };
