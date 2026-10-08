/**
 * JWT Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'aquasense_jwt_secure_secret_2026_dev_key'
      );

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User account associated with this token not found'
        });
      }

      req.user = user;
      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized: Invalid or expired token'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized: No token provided in Authorization header'
    });
  }
};

module.exports = { protect };
