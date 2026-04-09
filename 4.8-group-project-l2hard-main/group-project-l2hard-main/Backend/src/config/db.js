import mongoose from "mongoose";

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            autoIndex: true
        });

        console.log("MongoDB Atlas connected");
        return true;
    } catch (error) {
        console.error("Connection error:", error.message);
        return false;
    }
}

export default connectDB;
