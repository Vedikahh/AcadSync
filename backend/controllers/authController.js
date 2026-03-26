const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const allowedRoles = ['student', 'organizer', 'admin'];

const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') return 'student';
  const value = role.toLowerCase();
  return allowedRoles.includes(value) ? value : 'student';
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
exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      organization,
      phone,
      year,
      designation,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedRole = normalizeRole(role);

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      department,
      organization,
      phone,
      year,
      designation,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        organization: user.organization,
        phone: user.phone,
        year: user.year,
        designation: user.designation,
        avatar: user.avatar,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    // Compare raw password with hashed
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        organization: user.organization,
        phone: user.phone,
        year: user.year,
        designation: user.designation,
        avatar: user.avatar,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user data (resolve from JWT)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user with Google
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'No Google token provided' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { name, email } = ticket.getPayload();

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
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      organization: user.organization,
      phone: user.phone,
      year: user.year,
      designation: user.designation,
      avatar: user.avatar,
      token: generateToken(user._id, user.role),
    });

  } catch (error) {
    res.status(500).json({ message: 'Google Auth Error: ' + error.message });
  }
};

// @desc    Register user with Google token, role and department
// @route   POST /api/auth/google-register
// @access  Public
exports.googleRegister = async (req, res) => {
  try {
    const { token, role, department, organization, phone, year, designation } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'No Google token provided' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { name, email } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user with explicit role and department
    const normalizedRole = normalizeRole(role);
    user = await User.create({
      name,
      email,
      role: normalizedRole,
      department,
      organization,
      phone,
      year,
      designation,
      provider: 'google'
    });

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      organization: user.organization,
      phone: user.phone,
      year: user.year,
      designation: user.designation,
      avatar: user.avatar,
      token: generateToken(user._id, user.role),
    });

  } catch (error) {
    res.status(500).json({ message: 'Google Register Error: ' + error.message });
  }
};
