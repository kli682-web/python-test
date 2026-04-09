import express from 'express';
import protect from '../middleware/auth.middleware.js';
import { getCurrentUser } from '../controllers/auth.controller.js';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} from '../controllers/user.controller.js';

const router = express.Router();

// 这一行之后，下面所有 /api/users 路由都必须先通过 JWT 鉴权
router.use(protect);


router.get('/me', getCurrentUser);

// GET /api/users
router.get('/', getAllUsers);

// GET /api/users/:id
router.get('/:id', getUserById);

// POST /api/users
router.post('/', createUser);

// PUT /api/users/:id
router.put('/:id', updateUser);

// DELETE /api/users/:id
router.delete('/:id', deleteUser);

export default router;