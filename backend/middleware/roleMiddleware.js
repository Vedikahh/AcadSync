const { AuthorizationError } = require('../utils/errorHandler');

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // req.user is set by the protect middleware
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AuthorizationError(`Role (${req.user?.role}) is not allowed to access this resource`));
    }
    next();
  };
};
