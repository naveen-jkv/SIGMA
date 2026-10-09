/**
 * AQUASENSE - Authentication Controller
 * User registration (strictly defaulted to HEALTH_WORKER),
 * secure login, and authenticated user profile (/api/auth/me)
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizeRole, ROLES } = require('../utils/roles');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'aquasense_jwt_secure_secret_2026_dev_key',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user (public intake)
// @route   POST /api/auth/register
// @access  Public
// @security Never grants HEALTH_AUTHORITY; always defaults to HEALTH_WORKER
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email address already exists'
      });
    }

    // MANDATORY SECURITY: Public self-registration ALWAYS creates HEALTH_WORKER.
    // Client-supplied roles (e.g. HEALTH_AUTHORITY, AUTHORITY, ADMIN) are discarded.
    const assignedRole = ROLES.HEALTH_WORKER;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role),
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);
    const normalizedRole = normalizeRole(user.role);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: normalizedRole,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private (JWT protected)
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    const normalizedRole = normalizeRole(user.role);

    return res.status(200).json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: normalizedRole,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  generateToken
};
