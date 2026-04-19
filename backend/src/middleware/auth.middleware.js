const jwt = require('jsonwebtoken');
const User = require('../features/auth/user.model');

// ─────────────────────────────────────────────────────────────────────────────
// protect — verifies the HttpOnly JWT cookie and attaches req.user
// ─────────────────────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    req.user = user; // Attach user to request (sensitive fields stripped by toJSON)
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or has expired. Please log in again.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// authorize — checks req.user.roles against allowed roles
// Usage: router.get('/admin', protect, authorize('Super Admin'), handler)
// ─────────────────────────────────────────────────────────────────────────────
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Check if the user holds at least one of the allowed roles
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
