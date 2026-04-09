import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

const unauthorized = (res, msg = "Not authorized") => {
    return res.status(401).json({
        code: 401,
        msg,
        data: null
    });
};

export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return unauthorized(res, "Missing or invalid authorization header");
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return unauthorized(res, "Missing token");
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your_jwt_secret"
        );

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return unauthorized(res, "User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return unauthorized(res, "Invalid token");
        }

        if (error.name === "TokenExpiredError") {
            return unauthorized(res, "Token expired");
        }

        return res.status(500).json({
            code: 500,
            msg: "Authentication failed",
            data: null
        });
    }
};

export default protect;
