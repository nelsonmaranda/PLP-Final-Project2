"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Route_1 = __importDefault(require("../models/Route"));
const validation_1 = require("../middleware/validation");
const validation_2 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = express_1.default.Router();
router.get('/', rateLimiter_1.apiLimiter, (0, validation_2.validateQuery)(validation_1.paginationSchema), async (req, res) => {
    try {
        const { page, limit, sort, order } = req.query;
        const skip = (page - 1) * limit;
        const query = { isActive: true };
        const sortOrder = order === 'asc' ? 1 : -1;
        const routes = await Route_1.default.find(query)
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limit)
            .populate('stops');
        const total = await Route_1.default.countDocuments(query);
        res.json({
            success: true,
            data: {
                routes,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Get routes error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/nearby', rateLimiter_1.apiLimiter, (0, validation_2.validateQuery)(validation_1.locationQuerySchema), async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        const routes = await Route_1.default.find({
            isActive: true,
            'stops.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: radius * 1000
                }
            }
        }).populate('stops');
        res.json({
            success: true,
            data: {
                routes,
                location: { lat, lng },
                radius
            }
        });
    }
    catch (error) {
        console.error('Get nearby routes error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/:id', rateLimiter_1.apiLimiter, async (req, res) => {
    try {
        const route = await Route_1.default.findById(req.params.id).populate('stops');
        if (!route) {
            res.status(404).json({
                success: false,
                message: 'Route not found'
            });
            return;
        }
        res.json({
            success: true,
            data: { route }
        });
    }
    catch (error) {
        console.error('Get route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'moderator']), (0, validation_1.validate)(validation_1.routeSchema), async (req, res) => {
    try {
        const route = new Route_1.default(req.body);
        await route.save();
        res.status(201).json({
            success: true,
            message: 'Route created successfully',
            data: { route }
        });
    }
    catch (error) {
        console.error('Create route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'moderator']), (0, validation_1.validate)(validation_1.routeSchema), async (req, res) => {
    try {
        const route = await Route_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!route) {
            res.status(404).json({
                success: false,
                message: 'Route not found'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Route updated successfully',
            data: { route }
        });
    }
    catch (error) {
        console.error('Update route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const route = await Route_1.default.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!route) {
            res.status(404).json({
                success: false,
                message: 'Route not found'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Route deactivated successfully'
        });
    }
    catch (error) {
        console.error('Delete route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/search/:query', rateLimiter_1.apiLimiter, async (req, res) => {
    try {
        const { query } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        const searchQuery = {
            isActive: true,
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { operator: { $regex: query, $options: 'i' } }
            ]
        };
        const routes = await Route_1.default.find(searchQuery)
            .skip(skip)
            .limit(limit)
            .populate('stops');
        const total = await Route_1.default.countDocuments(searchQuery);
        res.json({
            success: true,
            data: {
                routes,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    }
    catch (error) {
        console.error('Search routes error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map