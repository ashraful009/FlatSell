const jwt = require('jsonwebtoken');
const User = require('./user.model');
const generateOTP = require('../../utils/generateOTP');
const { sendEmail, otpEmailTemplate } = require('../../utils/sendEmail');

// ─── Helper: sign JWT and attach as HttpOnly cookie ──────────────────────────
const sendTokenCookie = (res, user) => {
  const token = jwt.sign(
    { id: user._id, roles: user.roles },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,                                          // JS cannot read this cookie
    sameSite: 'strict',                                      // CSRF protection
    secure:   process.env.NODE_ENV === 'production',         // HTTPS only in prod
    maxAge:   7 * 24 * 60 * 60 * 1000,                      // 7 days in ms
  });

  return token;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new user & send OTP
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Check if email already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  // Generate OTP & expiry (10 minutes)
  const otp       = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  // Create user (password hashed by pre-save hook)
  const user = await User.create({ name, email, password, otp, otpExpiry });

  // Send OTP email
  await sendEmail({
    to:      email,
    subject: 'Verify your FlatSell account',
    html:    otpEmailTemplate(name, otp),
  });

  res.status(201).json({
    success: true,
    message: `OTP sent to ${email}. Please verify your account.`,
    data:    { email },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify email with OTP
// @route   POST /api/auth/verify-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  const user = await User.findOne({ email }).select('+otp +otpExpiry');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.isVerified) {
    return res.status(400).json({ success: false, message: 'Account already verified' });
  }

  // Check OTP expiry
  if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
    return res.status(400).json({ success: false, message: 'OTP has expired. Please register again.' });
  }

  // Check OTP match
  if (user.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
  }

  // Mark verified, clear OTP
  user.isVerified = true;
  user.otp        = null;
  user.otpExpiry  = null;
  await user.save();

  // Auto-login after verification — attach cookie
  sendTokenCookie(res, user);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully! Welcome to FlatSell 🎉',
    data:    { user },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  if (user.isVerified) {
    return res.status(400).json({ success: false, message: 'Account is already verified' });
  }

  const otp       = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  user.otp       = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  await sendEmail({
    to:      email,
    subject: 'Your new FlatSell OTP code',
    html:    otpEmailTemplate(user.name, otp),
  });

  res.status(200).json({ success: true, message: 'New OTP sent to your email.' });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Login user → set JWT as HttpOnly cookie (token never in JSON body)
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  // Find user (include password for comparison)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // Check if verified
  if (!user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email before logging in.',
      data:    { email, needsVerification: true },
    });
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // Sign JWT → set as HttpOnly cookie (NOT sent in response body)
  sendTokenCookie(res, user);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data:    { user }, // password/otp stripped by toJSON()
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get current logged-in user (session persistence)
// @route   GET /api/auth/me
// @access  Protected — verifies HttpOnly cookie automatically
//
// USAGE IN AUTHCONTEXT:
//   useEffect(() => {
//     axiosInstance.get('/auth/me')
//       .then(res => setUser(res.data.data.user))
//       .catch(() => setUser(null));
//   }, []);
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  // req.user is attached by the `protect` middleware
  res.status(200).json({
    success: true,
    data:    { user: req.user },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Logout — clear the HttpOnly cookie
// @route   POST /api/auth/logout
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'strict',
    secure:   process.env.NODE_ENV === 'production',
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

module.exports = { register, verifyOTP, resendOTP, login, getMe, logout };
