const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User = require('../models/users');

const authRouter = express.Router();

// Registration
authRouter.post('/register', [
    body('username')
        .trim()
        .notEmpty(),
    body('email')
        .isEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')

],
    async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    res.send('Registration successful');
});

// Login
authRouter.post('/login', [
    body('email')
        .isEmail()
        .withMessage('Must be valid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !( await user.isValidPassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials '});
    }

    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
})

// Example protected Route
authRouter.get('/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.send(`Hello, ${req.user.username}`);
});

module.exports = authRouter;