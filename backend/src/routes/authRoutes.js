const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validate');

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.get('/me', authenticate, getMe);

module.exports = router;
