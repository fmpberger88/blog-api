const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User = require('../models/users');

const authRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and registration
 */

// Registration
/**
 * @swagger
 * /api/v1/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Register a new user with username, email, and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               username: johndoe
 *               email: johndoe@example.com
 *               password: strongpassword
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 */
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
/**
 * @swagger
 * /api/v1/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login a user
 *     description: Authenticate a user and return a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               email: johndoe@example.com
 *               password: strongpassword
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
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

module.exports = authRouter;