import jwt from "jsonwebtoken";
import { Resend } from "resend";
import User from "../models/User.model.js";

// 这个 controller 负责认证相关的核心流程：
// - 邮箱密码登录
// - 注册验证码发送
// - 验证码校验并注册
// - 获取当前登录用户信息
//
// 整个文件统一使用 successResponse / errorResponse，
// 让前端面对这些接口时都能拿到结构一致的响应。

// 邮箱格式校验规则
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// 注册验证码有效期：5 分钟
const CODE_EXPIRES_MS = 5 * 60 * 1000;

// 使用进程内存临时保存验证码
// 结构：email -> { code, expiresAt }
const verificationStore = new Map();

// 当前版本把验证码存在 Node 进程内存中，实现简单，适合开发阶段。
// 但它也有局限：
// 1. 服务重启后验证码会丢失
// 2. 多实例部署时实例之间不会共享验证码
// 如果以后上线，改成 Redis 或数据库存储会更好。

// 统一成功响应格式
const successResponse = (res, data, msg = "success", code = 200) => {
    res.status(code).json({
        code,
        msg,
        data
    });
};

// 统一错误响应格式
const errorResponse = (res, msg, code = 400) => {
    res.status(code).json({
        code,
        msg,
        data: null
    });
};

// 生成 JWT，注册成功或密码登录成功后都会复用
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "your_jwt_secret", {
        expiresIn: "30d"
    });
};

// 统一邮箱格式，避免大小写和前后空格影响查询
const normalizeEmail = (email = "") => email.trim().toLowerCase();

// 生成 6 位数字验证码
const createVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// 创建 Resend 客户端
const getResendClient = () => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    return new Resend(process.env.RESEND_API_KEY);
};

// 获取邮件发件人配置
const getEmailFrom = () => {
    return process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM;
};

// 统一返回给前端的用户信息，避免返回密码等敏感字段
const serializeUser = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar
});

// 这里单独做一次“序列化”的意义：
// - 明确接口到底返回哪些用户字段
// - 避免 password 等敏感字段被意外返回给前端

// 发送邮箱验证码邮件
const sendVerificationEmail = async (email, code) => {
    const from = getEmailFrom();
    if (!from) throw new Error("RESEND_FROM_EMAIL is not configured");

    const resend = getResendClient();

    // 重点：解构出 data 和 error
    const { data, error } = await resend.emails.send({
        from,
        to: email,
        subject: "Your verification code",
        text: `Your verification code is ${code}. It expires in 5 minutes.`
    });

    // 如果有错误，必须抛出，否则外层逻辑不知道发送失败了
    if (error) {
        console.error("Resend API 报错详情:", error); // 这里会告诉你具体原因
        throw new Error(`邮件发送失败: ${error.message}`);
    }

    console.log("邮件发送成功，ID:", data.id);
};

/**
 * 密码登录接口
 * @route POST /api/auth/login
 * @param {string} email 用户邮箱
 * @param {string} password 用户密码
 */
// 登录时要特别注意两点：
// 1. 查询用户必须显式 `.select("+password")`
//    因为 User model 里 password 字段默认不会被查出来。
// 2. 密码比对通过 `user.matchPassword(...)` 完成，
//    这样密码逻辑会集中在模型层，而不是散落在 controller 里。
export const login = async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        if (!email || !password) {
            return errorResponse(res, "Email and password are required");
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user || !(await user.matchPassword(password))) {
            return errorResponse(res, "Invalid email or password", 401);
        }

        return successResponse(res, {
            user: serializeUser(user),
            token: generateToken(user._id)
        }, "Login successful");
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * 获取当前登录用户信息
 * 该接口依赖 protect 中间件完成鉴权，成功后直接返回当前用户资料
 * @route GET /users/me
 */
// 它依赖 protect 中间件先完成 JWT 校验，并把当前用户对象挂到 req.user 上。
// 因此这里不需要再次解析 token，直接返回当前登录用户即可。
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return errorResponse(res, "User not found", 401);
        }

        return successResponse(res, serializeUser(req.user));
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * 发送注册验证码接口
 * 该接口只用于注册前校验邮箱，已注册邮箱不能再次发送注册验证码
 * @route POST /api/auth/send-code
 * @param {string} email 用户注册邮箱
 */
export const sendVerificationCode = async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);

        if (!email || !EMAIL_REGEX.test(email)) {
            return errorResponse(res, "Valid email is required");
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return errorResponse(res, "Email is already registered", 409);
        }

        const code = createVerificationCode();

        // 同一邮箱再次发送时，直接覆盖旧验证码
        verificationStore.set(email, {
            code,
            expiresAt: Date.now() + CODE_EXPIRES_MS
        });

        try {
            await sendVerificationEmail(email, code);
        } catch (error) {
            // 如果邮件发送失败，则删除刚写入的验证码，避免状态不一致
            verificationStore.delete(email);
            throw error;
        }

        //打印一下
        console.log(`[${new Date().toISOString()}] 验证码已发送 - 邮箱: ${email}, 验证码: ${code}`);

        return successResponse(
            res,
            { email, expiresIn: CODE_EXPIRES_MS / 1000 },
            "Verification code sent"
        );
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * 校验验证码并完成注册，然后直接登录
 * @route POST /api/auth/verify-code
 * @param {string} email 用户邮箱
 * @param {string} code 邮箱验证码
 * @param {string} username 注册用户名
 * @param {string} password 注册密码
 * @param {string=} avatar 用户头像，可选
 * @param {string=} role 用户角色，可选
 */
export const verifyCodeAndRegister = async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const {
            code,
            username,
            password,
            avatar,
            role
        } = req.body;

        if (!email || !EMAIL_REGEX.test(email)) {
            return errorResponse(res, "Valid email is required");
        }

        if (!code || !username || !password) {
            return errorResponse(
                res,
                "Email, code, username and password are required"
            );
        }

        const verification = verificationStore.get(email);

        if (!verification) {
            return errorResponse(res, "Verification code not found", 404);
        }

        // 验证码过期后立即删除，防止继续使用
        if (verification.expiresAt < Date.now()) {
            verificationStore.delete(email);
            return errorResponse(res, "Verification code has expired", 410);
        }

        if (verification.code !== String(code).trim()) {
            return errorResponse(res, "Invalid verification code", 401);
        }

        // 同时检查邮箱和用户名，避免注册时发生唯一性冲突
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            verificationStore.delete(email);
            if (existingUser.email === email) {
                return errorResponse(res, "Email is already registered", 409);
            }

            return errorResponse(res, "Username already exists", 409);
        }

        // 创建用户时，密码加密由 User 模型中的 pre-save 钩子自动处理
        const user = await User.create({
            email,
            username,
            password,
            avatar,
            role
        });

        // 注册完成后删除验证码，避免重复注册
        verificationStore.delete(email);

        return successResponse(res, {
            user: serializeUser(user),
            token: generateToken(user._id)
        }, "Registration successful", 201);
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};
