/**
 * AQUASENSE - JWT Authentication Middleware
 * Validates bearer token, retrieves user, and attaches normalized user identity.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizeRole } = require('../utils/roles');

const authenticate = async (req, res, next) => {
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
          error: 'Not authorized: User account associated with this token not found'
        });
      }

      // Convert mongoose doc to plain object if needed and normalize role
      const userObj = user.toObject ? user.toObject() : { ...user };
      userObj.role = normalizeRole(userObj.role);
      userObj.id = userObj._id || userObj.id;

      req.user = userObj;
      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized: Invalid or expired token'
      });
    }
  }

  return res.status(401).json({
    success: false,
    error: 'Not authorized: No token provided in Authorization header'
  });
};

const protect = authenticate;

module.exports = {
  authenticate,
  protect
};
