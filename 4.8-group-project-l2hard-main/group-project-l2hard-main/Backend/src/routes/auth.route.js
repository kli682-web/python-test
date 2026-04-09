import express from "express";
import {
    login,
    sendVerificationCode,
    verifyCodeAndRegister
} from "../controllers/auth.controller.js";
// 引入刚刚拆分出来的 Google 控制器
import { googleLogin } from "../controllers/google_auth.controller.js";


const router = express.Router();

router.post("/login", login);
router.post("/send-code", sendVerificationCode);
router.post("/verify-code", verifyCodeAndRegister);
router.post("/google", googleLogin);

export default router;


