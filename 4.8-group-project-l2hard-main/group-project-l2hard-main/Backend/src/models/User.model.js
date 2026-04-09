import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema, model } = mongoose;

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
        },
        password: {
            type: String,
            required: false,
            minlength: 6,
            select: false
        },
        avatar: {
            type: String,
            default: ""
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// 索引配置
// userSchema.index({ email: 1 }, { unique: true });
// userSchema.index({ username: 1 }, { unique: true });

// 存入数据库前自动对密码加密
userSchema.pre('save', async function () {
    // 如果没有输入密码（比如 Google 登录），或者密码没有被修改，直接跳过加密
    if (!this.isModified('password') || !this.password) {
        return;
    }

    // 只有在存在密码且密码被修改时，才执行加密
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// 验证密码是否匹配的方法
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = model("User", userSchema);

export default User;