const crypto = require('crypto');

/**
 * Generates a cryptographically secure 6-digit OTP
 * Uses crypto.randomInt for better security than Math.random()
 * @returns {string} 6-digit OTP string e.g. "482901"
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

module.exports = generateOTP;
