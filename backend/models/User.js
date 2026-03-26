const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function() { return this.provider === 'local'; },
  },
  role: {
    type: String,
    enum: ['student', 'organizer', 'admin'],
    default: 'student',
  },
  department: {
    type: String,
  },
  organization: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  year: {
    type: String,
    default: '',
  },
  designation: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
  },
  avatar: {
    type: String,
    default: '',
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
