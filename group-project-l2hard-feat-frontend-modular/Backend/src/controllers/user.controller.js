import User from '../models/User.model.js';

// GET /api/users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Users fetched successfully',
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            message: 'User fetched successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch user',
            error: error.message
        });
    }
};

// POST /api/users
export const createUser = async (req, res) => {
    try {
        const { username, email, password, avatar, role } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        }).select('+password');

        if (existingUser) {
            return res.status(400).json({
                message: 'Username or email already exists'
            });
        }

        const newUser = await User.create({
            username,
            email,
            password,
            avatar,
            role
        });

        res.status(201).json({
            message: 'User created successfully',
            user: newUser
        });
    } catch (error) {
        res.status(400).json({
            message: 'Failed to create user',
            error: error.message
        });
    }
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, ...updateData } = req.body;

        const updatedUser = await User.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        if (!updatedUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        res.status(400).json({
            message: 'Failed to update user',
            error: error.message
        });
    }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            message: 'User deleted successfully',
            user: deletedUser
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to delete user',
            error: error.message
        });
    }
};