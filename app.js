const express = require('express');
const morgan = require('morgan');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require('cors');
const passport = require('passport');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const commentRouter = require('./routes/commentRoutes');

const errorHandler = require('./middlewares/errorHandler');

// _________________ Database _________________
require('./db/mongoDB');

// _________________ Environment Variables _________________
const PORT = process.env.PORT || 5000;

// Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// _________________ Swagger _____________
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Blog API Documentation',
            version: '1.0.0',
            description: 'This is a simple API for managing blogs, comments, and users',
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);


// _________________ Express App _____________
const app = express();

// _________________ Passport JWT-Strategy _________________
require('./middlewares/passport');

// _________________ Middlewares _________________
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(passport.initialize); // Not sure wether required?
app.use(morgan('dev'));

app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.tiny.cloud"], // Erlauben Sie Skripte von vertrauenswürdigen Quellen wie TinyMCE CDN
        styleSrc: ["'self'", "'unsafe-inline'"], // Unsichere Inline-Stile erlauben
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"], // Bildquellen
        connectSrc: ["'self'", "https://api.tinymce.com"], // API-Verbindungen
        frameSrc: ["'none'"], // Verhindern Sie das Einbetten von Inhalten in Frames
        objectSrc: ["'none'"], // Verhindern Sie die Verwendung von <object>, <embed>, <applet>
        upgradeInsecureRequests: [], // Automatische HTTPS-Nutzung
    },
}));

// _________________ CORS Configuration _________________
const allowedOrigins = [
    'https://www.fmpberger.com',
    'https://blog-dashboard.onrender.com',
    'http://localhost:5173'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

// _________________ Rate Limiting _________________
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
})

app.use(limiter);

// _________________ Routes _________________
app.use('/api/v1/', authRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/comments', commentRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// _________________ Error Handler _________________
app.use(errorHandler);

// _________________ Server _________________
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
})

