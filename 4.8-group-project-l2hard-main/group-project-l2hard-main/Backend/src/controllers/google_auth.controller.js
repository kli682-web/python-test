import { OAuth2Client } from 'google-auth-library';
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- 内部辅助函数 (保持与 auth.controller.js 一致) ---

const successResponse = (res, data, msg = "success", code = 200) => {
    res.status(code).json({ code, msg, data });
};

const errorResponse = (res, msg, code = 400) => {
    res.status(code).json({ code, msg, data: null });
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "your_jwt_secret", {
        expiresIn: "30d"
    });
};

const serializeUser = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar
});

/**
 * Google 登录与自动注册逻辑
 * @route POST /api/auth/google
 * @param {string} idToken 前端传回的 Google 身份令牌
 */
export const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return errorResponse(res, "Google ID Token is required");
        }
        console.log("后端期望的 Audience:", process.env.GOOGLE_CLIENT_ID);
        // 1. 验证 Token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { email, name, picture, sub: googleId } = ticket.getPayload();

        // 2. 查找或创建用户
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                email: email,
                username: name || `google_user_${googleId.slice(-6)}`,
                avatar: picture,
                role: 'user'
            });
            console.log(`[Auth] New Google user registered: ${email}`);
        }

        // 3. 返回统一响应
        return successResponse(res, {
            user: serializeUser(user),
            token: generateToken(user._id)
        }, "Google login successful");

    } catch (err) {
        console.error("Google Auth Error:", err.message);
        return errorResponse(res, "Invalid Google token", 401);
    }
};