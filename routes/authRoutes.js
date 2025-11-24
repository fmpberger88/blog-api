// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/users");

const authRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and registration
 */

/* ------------------------------------------------------------------
 *   Validierungs-Middleware
 * ------------------------------------------------------------------ */

const validateRegistration = [
    body("username")
        .trim()
        .notEmpty()
        .withMessage("Username is required")
        .escape(),

    body("first_name")
        .trim()
        .notEmpty()
        .withMessage("First name is required")
        .escape(),

    body("family_name")
        .trim()
        .notEmpty()
        .withMessage("Family name is required")
        .escape(),

    body("email")
        .isEmail()
        .withMessage("Valid email is required")
        .normalizeEmail(),

    // Passwort NICHT escapen (sonst veränderst du es vor dem Hashing)
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
];

const validateLogin = [
    body("email")
        .isEmail()
        .withMessage("Valid email is required")
        .normalizeEmail(),
    body("password")
        .notEmpty()
        .withMessage("Password is required"),
];

/* ------------------------------------------------------------------
 *   Registrierung
 * ------------------------------------------------------------------ */

/**
 * @swagger
 * /api/v1/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Register a new user with username, first name, family name, email, and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - first_name
 *               - family_name
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               first_name:
 *                 type: string
 *               family_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               username: johndoe
 *               first_name: John
 *               family_name: Doe
 *               email: johndoe@example.com
 *               password: strongpassword
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
authRouter.post("/register", validateRegistration, async (req, res, next) => {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array(),
        });
    }

    const { username, first_name, family_name, email, password } = req.body;

    try {
        // prüfen, ob es bereits einen User mit dieser E-Mail ODER diesem Username gibt
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        }).exec();

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists",
            });
        }

        // neuen User anlegen
        const user = new User({
            username,
            first_name,
            family_name,
            email,
            password, // Hashing übernimmt idealerweise das User-Model (pre save Hook)
        });

        await user.save();

        // du kannst hier auch gleich ein JWT zurückgeben, wenn du möchtest
        return res.status(201).json({
            message: "Registration successful",
            user: {
                id: user._id,
                username: user.username,
                first_name: user.first_name,
                family_name: user.family_name,
                email: user.email,
                isAdmin: user.isAdmin,
                isAuthor: user.isAuthor,
            },
        });
    } catch (err) {
        // Duplicate-Key-Fehler (z.B. unique Index auf email oder username)
        if (err.code === 11000) {
            return res.status(409).json({
                message: "User already exists",
                details: err.keyValue,
            });
        }

        // alles andere an globalen Error-Handler
        return next(err);
    }
});

/* ------------------------------------------------------------------
 *   Login
 * ------------------------------------------------------------------ */

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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
authRouter.post("/login", validateLogin, async (req, res, next) => {
    // Validierungsfehler prüfen
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Validation failed",
            errors: errors.array(),
        });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).exec();

        // User nicht gefunden oder Passwort falsch
        if (!user || !(await user.isValidPassword(password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not set");
            return res
                .status(500)
                .json({ message: "Server misconfiguration: JWT_SECRET missing" });
        }

        const payload = {
            id: user._id,
            email: user.email,
            isAdmin: user.isAdmin,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        return res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                first_name: user.first_name,
                family_name: user.family_name,
                email: user.email,
                isAdmin: user.isAdmin,
                isAuthor: user.isAuthor,
            },
        });
    } catch (err) {
        return next(err);
    }
});

module.exports = authRouter;
