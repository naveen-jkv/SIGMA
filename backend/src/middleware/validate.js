/**
 * Input Validation Middleware
 */

const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'A valid email is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Please provide both email and password' });
  }
  next();
};

const validateCaseInput = (req, res, next) => {
  const { age, gender, symptoms, district, locality, latitude, longitude } = req.body;
  if (age === undefined || age === null || isNaN(age)) {
    return res.status(400).json({ success: false, error: 'Valid age is required' });
  }
  if (!gender) {
    return res.status(400).json({ success: false, error: 'Gender is required' });
  }
  if (!symptoms || (Array.isArray(symptoms) && symptoms.length === 0)) {
    return res.status(400).json({ success: false, error: 'At least one symptom is required' });
  }
  if (!district || !locality) {
    return res.status(400).json({ success: false, error: 'District and locality are required' });
  }
  if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ success: false, error: 'Valid latitude and longitude coordinates are required' });
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateCaseInput
};
