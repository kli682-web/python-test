import express from 'express';
import authRouter from './auth.route.js';
import userRouter from './user.route.js';
import aiRoutes from './ai.routes.js';
import ragRoutes from './rag.routes.js';
import profileRouter from './profile.route.js';

const router = express.Router();

// test route
router.get('/test', (req, res) => {
    res.json({ message: 'Hello from backend API' });
});

// mount sub routes
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/ai', aiRoutes);
router.use('/profile', profileRouter);
export default router;
