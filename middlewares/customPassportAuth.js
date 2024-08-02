// customPassportAuth.js
const passport = require('passport');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

// Custom Passport Authentication Middleware
const customPassportAuth = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            if (info && info.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired. Please log in again.' });
            } else if (info) {
                return res.status(401).json({ message: `${info.message}! Please log in` });
            } else {
                return res.status(401).json({ message: 'Unauthorized access. Please log in.' });
            }
        }

        req.user = user;
        next();
    })(req, res, next);
};

module.exports = customPassportAuth;
