// ./db/mongoDB.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI; // oder MONGODB_URI, je nachdem

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in environment variables');
    process.exit(1); // oder throw new Error(...)
}

mongoose.set('strictQuery', false);

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('✅ Connected successfully to MongoDB!');
    })
    .catch((err) => {
        console.error('❌ Error connecting to MongoDB:', err.message);
        process.exit(1);
    });

module.exports = mongoose;
