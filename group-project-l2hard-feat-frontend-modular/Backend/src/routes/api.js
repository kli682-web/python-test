import express from 'express';
import userRouter from './user.route.js';
const router = express.Router();

// test route
router.get('/test', (req, res) => {
    res.json({ message: 'Hello from backend API' });
});

// mount sub routes
router.use('/users', userRouter);

export default router;