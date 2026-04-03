const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../utils/errorHandler');

exports.protect = async (req, res, next) => {
  let token;
  
  // Check for Bearer token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // We attach the full decoded payload (which will include { id, role } from login)
      req.user = decoded;
      
      return next();
    } catch (error) {
      return next(new AuthenticationError('Not authorized, token failed'));
    }
  }

  if (!token) {
    return next(new AuthenticationError('Not authorized, no token'));
  }
};
