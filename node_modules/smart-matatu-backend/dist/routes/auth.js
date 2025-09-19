"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/register', (0, validation_1.validate)(validation_1.userRegistrationSchema), async (req, res) => {
    try {
        const { email, password, displayName } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
            return;
        }
        const user = new User_1.default({
            email,
            password,
            displayName
        });
        await user.save();
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    displayName: user.displayName,
                    role: user.role
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/login', rateLimiter_1.authLimiter, (0, validation_1.validate)(validation_1.userLoginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
            return;
        }
        if (!user.isActive) {
            res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        user.lastLogin = new Date();
        await user.save();
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    displayName: user.displayName,
                    role: user.role,
                    lastLogin: user.lastLogin
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const { displayName } = req.body;
        const userId = req.user._id;
        const user = await User_1.default.findByIdAndUpdate(userId, { displayName }, { new: true, runValidators: true });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        return res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    _id: user._id,
                    email: user.email,
                    displayName: user.displayName,
                    role: user.role
                }
            }
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/logout', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logout successful'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map