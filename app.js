const express = require('express');
const morgan = require('morgan');
const helmet = require("helmet");
const cors = require('cors');

require('dotenv').config();


// _________________ Database _________________

// _________________ Environment Variables _________________
const PORT = process.env.PORT || 5000;

// _________________ Express App_____________
const app = express();

// _________________ Middlewares _________________
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(helmet());
app.use(cors());

// _________________ Routes _________________


// _________________ Error Handler _________________

// _________________ Server _________________
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
})

