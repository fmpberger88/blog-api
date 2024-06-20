// Import the mongoose module
const mongoose = require('mongoose');

const mongoDB = process.env.MONGODB_URI;

main().catch((err) => console.log("MongoDB connection error:", err));

async function main() {
    try {
        // try to connect
        await mongoose.connect(mongoDB);
        console.log("Connected successfully to MongoDB!");
    } catch (err) {
        // throw error if it does not
        console.error("Failed to connect to MongoDB:", err.message);
        throw err;
    }
}
