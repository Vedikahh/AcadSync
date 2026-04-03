const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dns = require('dns').promises;
const { OAuth2Client } = require('google-auth-library');
const mailService = require('../utils/mailService');
const emailTemplates = require('../utils/emailTemplates');
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} = require('../utils/errorHandler');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const PASSWORD_RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 15);
const EMAIL_VERIFY_OTP_TTL_MINUTES = Number(process.env.EMAIL_VERIFY_OTP_TTL_MINUTES || 10);

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const isEmailFormatValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isPasswordValid = (password) => typeof password === 'string' && password.length >= 8;
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const sanitizeText = (value) => String(value || '').trim();
const parseInterests = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeText(item)).filter(Boolean).slice(0, 10);
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
};
const isOnboardingCompleted = (user) => hasText(user?.department) && hasText(user?.year);
const isEmailVerificationEnabled = () => true;
const getFrontendBaseUrl = () => process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

const RESERVED_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.net',
  'example.org',
  'localhost',
  'test',
  'invalid',
]);

const hasValidMailDomain = async (email) => {
  const domain = String(email || '').split('@')[1];
  if (!domain) return false;

  const normalizedDomain = domain.trim().toLowerCase();
  if (
    RESERVED_EMAIL_DOMAINS.has(normalizedDomain) ||
    normalizedDomain.endsWith('.test') ||
    normalizedDomain.endsWith('.invalid') ||
    normalizedDomain.endsWith('.localhost')
  ) {
    return false;
  }

  try {
    const mxRecords = await dns.resolveMx(normalizedDomain);
    return Array.isArray(mxRecords) && mxRecords.length > 0;
  } catch {
    try {
      // RFC fallback: a domain can technically accept mail via A/AAAA when MX is absent.
      const [aRecords, aaaaRecords] = await Promise.all([
        dns.resolve4(normalizedDomain).catch(() => []),
        dns.resolve6(normalizedDomain).catch(() => []),
      ]);
      return aRecords.length > 0 || aaaaRecords.length > 0;
    } catch {
      return false;
    }
  }
};

const createTokenPair = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
};

const createVerificationOtpPair = () => {
  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  return { otp, hashedOtp };
};

const buildAuthPayload = (user) => ({
  _id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  bio: user.bio || '',
  year: user.year || '',
  interests: Array.isArray(user.interests) ? user.interests : [],
  phone: user.phone || '',
  alternateContact: user.alternateContact || '',
  avatar: user.avatar,
  provider: user.provider,
  notificationChannels: user.notificationChannels,
  notificationPreferences: user.notificationPreferences,
  emailPreferences: user.emailPreferences,
  isEmailVerified: user.isEmailVerified,
  onboardingCompleted: isOnboardingCompleted(user),
  token: generateToken(user._id, user.role),
});

const sendPasswordResetEmail = async (user, rawToken) => {
  const resetUrl = `${getFrontendBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const html = emailTemplates.passwordReset(user.name, resetUrl, PASSWORD_RESET_TTL_MINUTES);

  const result = await mailService.sendMail({
    to: user.email,
    subject: 'AcadSync password reset',
    html,
    text: `Reset your password: ${resetUrl}`,
  });

  if (!result?.success) {
    throw new Error(result?.error || 'Password reset email delivery failed');
  }
};

const sendVerificationOtpEmail = async (user, otpCode) => {
  const html = emailTemplates.emailVerification(user.name, otpCode, EMAIL_VERIFY_OTP_TTL_MINUTES);

  const result = await mailService.sendMail({
    to: user.email,
    subject: 'Verify your AcadSync account',
    html,
    text: `Your AcadSync verification OTP is ${otpCode}. It expires in ${EMAIL_VERIFY_OTP_TTL_MINUTES} minutes.`,
  });

  if (!result?.success) {
    throw new Error(result?.error || 'Verification OTP email delivery failed');
  }
};

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { password } = req.body;
    const name = sanitizeText(req.body.name);
    const email = normalizeEmail(req.body.email);
    const role = sanitizeText(req.body.role) || 'student';
    const department = sanitizeText(req.body.department);
    const year = sanitizeText(req.body.year);
    const phone = sanitizeText(req.body.phone);
    const alternateContact = sanitizeText(req.body.alternateContact);
    const bio = sanitizeText(req.body.bio);
    const interests = parseInterests(req.body.interests);

    if (!['student', 'organizer', 'admin'].includes(role)) {
      throw new ValidationError('Invalid role selected');
    }

    if (!name || !email || !password) {
      throw new ValidationError('Please add all required fields');
    }

    if (!department || !year) {
      throw new ValidationError('Department and academic year are required');
    }

    if (!isEmailFormatValid(email)) {
      throw new ValidationError('Please enter a valid email id');
    }

    if (!(await hasValidMailDomain(email))) {
      throw new ValidationError('Please enter a valid email id');
    }

    if (!isPasswordValid(password)) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new ConflictError('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      year,
      phone,
      alternateContact,
      bio,
      interests,
      provider: 'local',
      isEmailVerified: !isEmailVerificationEnabled(),
    });

    if (!user) {
      throw new ValidationError('Invalid user data received');
    }

    if (isEmailVerificationEnabled()) {
      const { otp, hashedOtp } = createVerificationOtpPair();
      user.emailVerificationToken = hashedOtp;
      user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFY_OTP_TTL_MINUTES * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      await sendVerificationOtpEmail(user, otp);

      res.status(201).json({
        message: 'Registration successful. Please verify your email using the OTP sent to your inbox.',
        verificationRequired: true,
        email: user.email,
      });
      return;
    }

    res.status(201).json(buildAuthPayload(user));
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Please provide email and password');
    }

    if (!isEmailFormatValid(email) || !(await hasValidMailDomain(email))) {
      throw new ValidationError('Please enter a valid email id');
    }

    // Check for user email
    const user = await User.findOne({ email });

    // Compare raw password with hashed
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (user.provider === 'local' && isEmailVerificationEnabled() && !user.isEmailVerified) {
      throw new AuthorizationError('Please verify your email before signing in.');
    }

    res.json(buildAuthPayload(user));
  } catch (error) {
    next(error);
  }
};

// @desc    Get user data (resolve from JWT)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const payload = {
      ...user.toObject(),
      onboardingCompleted: isOnboardingCompleted(user),
    };
    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user with Google
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      throw new ValidationError('No Google token provided');
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { name } = ticket.getPayload();
    const email = normalizeEmail(ticket.getPayload().email);

    // Check if user exists by email
    let user = await User.findOne({ email });

    if (!user) {
      // User does not exist. Instead of auto-creating, return isNewUser true
      // Pass the token back so the frontend can submit it again with role/dept
      return res.status(200).json({
        isNewUser: true,
        email,
        name,
        token
      });
    }

    res.json({
      ...buildAuthPayload(user),
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Register user with Google token, role and department
// @route   POST /api/auth/google-register
// @access  Public
exports.googleRegister = async (req, res, next) => {
  try {
    const { token } = req.body;
    const role = sanitizeText(req.body.role) || 'student';
    const department = sanitizeText(req.body.department);
    const year = sanitizeText(req.body.year);
    const phone = sanitizeText(req.body.phone);
    const alternateContact = sanitizeText(req.body.alternateContact);
    const bio = sanitizeText(req.body.bio);
    const interests = parseInterests(req.body.interests);

    if (!['student', 'organizer', 'admin'].includes(role)) {
      throw new ValidationError('Invalid role selected');
    }

    if (!token) {
      throw new ValidationError('No Google token provided');
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { name } = ticket.getPayload();
    const email = normalizeEmail(ticket.getPayload().email);

    let user = await User.findOne({ email });
    if (user) {
      throw new ConflictError('User already exists');
    }

    // Create user with explicit role and department
    user = await User.create({
      name,
      email,
      role,
      department,
      year,
      phone,
      alternateContact,
      bio,
      interests,
      provider: 'google',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    res.status(201).json({
      ...buildAuthPayload(user),
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Send forgot password email with reset token
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const safeMessage = {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    if (!email || !isEmailFormatValid(email)) {
      return res.status(200).json(safeMessage);
    }

    if (!(await hasValidMailDomain(email))) {
      return res.status(200).json(safeMessage);
    }

    const user = await User.findOne({ email, provider: 'local' });
    if (!user) {
      return res.status(200).json(safeMessage);
    }

    const { rawToken, hashedToken } = createTokenPair();
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
    user.passwordResetUsedAt = undefined;
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user, rawToken);

    return res.status(200).json(safeMessage);
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !isPasswordValid(password)) {
      throw new ValidationError('Invalid reset request');
    }

    const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');

    const user = await User.findOne({
      provider: 'local',
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
      $or: [{ passwordResetUsedAt: { $exists: false } }, { passwordResetUsedAt: null }],
    });

    if (!user) {
      throw new ValidationError('Reset token is invalid or expired');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetUsedAt = new Date();
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful. You can now sign in.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email using token
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const token = req.params.token;
    if (!token) {
      throw new ValidationError('Invalid verification link');
    }

    const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({
      provider: 'local',
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new ValidationError('Verification link is invalid or expired');
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: 'Email verified successfully.',
      ...buildAuthPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a new email verification link
// @route   POST /api/auth/verify-email/request
// @access  Public
exports.requestEmailVerification = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const safeMessage = {
      message: 'If that account exists and is eligible, a verification OTP has been sent.',
    };

    if (!email || !isEmailFormatValid(email)) {
      return res.status(200).json(safeMessage);
    }

    if (!(await hasValidMailDomain(email))) {
      return res.status(200).json(safeMessage);
    }

    const user = await User.findOne({ email, provider: 'local' });
    if (!user || user.isEmailVerified) {
      return res.status(200).json(safeMessage);
    }

    const { otp, hashedOtp } = createVerificationOtpPair();
    user.emailVerificationToken = hashedOtp;
    user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFY_OTP_TTL_MINUTES * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendVerificationOtpEmail(user, otp);

    return res.status(200).json(safeMessage);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email using OTP
// @route   POST /api/auth/verify-email/otp
// @access  Public
exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();

    if (!email || !isEmailFormatValid(email) || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      throw new ValidationError('Invalid OTP verification request');
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.findOne({
      email,
      provider: 'local',
      emailVerificationToken: hashedOtp,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new ValidationError('OTP is invalid or expired');
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: 'Email verified successfully.',
      ...buildAuthPayload(user),
    });
  } catch (error) {
    next(error);
  }
};
