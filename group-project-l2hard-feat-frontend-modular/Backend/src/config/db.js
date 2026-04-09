import mongoose from "mongoose";

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            autoIndex: true
        });

        console.log("MongoDB Atlas connected");
    } catch (error) {
        console.error("Connection error:", error.message);
        process.exit(1);
    }
}

export default connectDB;