"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Report_1 = __importDefault(require("../models/Report"));
const Route_1 = __importDefault(require("../models/Route"));
const validation_1 = require("../middleware/validation");
const validation_2 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = express_1.default.Router();
router.post('/', rateLimiter_1.reportLimiter, rateLimiter_1.deviceFingerprintLimiter, auth_1.optionalAuth, (0, validation_1.validate)(validation_1.reportSchema), async (req, res) => {
    try {
        const { routeId, reportType, description, location, severity, isAnonymous } = req.body;
        const route = await Route_1.default.findById(routeId);
        if (!route) {
            res.status(404).json({
                success: false,
                message: 'Route not found'
            });
            return;
        }
        const report = new Report_1.default({
            userId: req.user?._id,
            routeId,
            reportType,
            description,
            location,
            severity,
            isAnonymous: isAnonymous || !req.user,
            deviceFingerprint: req.deviceFingerprint
        });
        await report.save();
        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            data: { report }
        });
    }
    catch (error) {
        console.error('Submit report error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'moderator']), (0, validation_2.validateQuery)(validation_1.paginationSchema), async (req, res) => {
    try {
        const { page, limit, sort, order } = req.query;
        const { status, reportType, severity, routeId } = req.query;
        const skip = (page - 1) * limit;
        const query = {};
        if (status)
            query.status = status;
        if (reportType)
            query.reportType = reportType;
        if (severity)
            query.severity = severity;
        if (routeId)
            query.routeId = routeId;
        const sortOrder = order === 'asc' ? 1 : -1;
        const reports = await Report_1.default.find(query)
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'displayName email')
            .populate('routeId', 'name operator')
            .populate('verifiedBy', 'displayName');
        const total = await Report_1.default.countDocuments(query);
        res.json({
            success: true,
            data: {
                reports,
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
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'moderator']), async (req, res) => {
    try {
        const report = await Report_1.default.findById(req.params.id)
            .populate('userId', 'displayName email')
            .populate('routeId', 'name operator')
            .populate('verifiedBy', 'displayName');
        if (!report) {
            res.status(404).json({
                success: false,
                message: 'Report not found'
            });
            return;
        }
        res.json({
            success: true,
            data: { report }
        });
    }
    catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.patch('/:id/verify', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'moderator']), async (req, res) => {
    try {
        const report = await Report_1.default.findByIdAndUpdate(req.params.id, {
            status: 'verified',
            verifiedBy: req.user._id,
            verifiedAt: new Date()
        }, { new: true });
        if (!report) {
            res.status(404).json({
                success: false,
                message: 'Report not found'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Report verified successfully',
            data: { report }
        });
    }
    catch (error) {
        console.error('Verify report error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.patch('/:id/resolve', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'moderator']), async (req, res) => {
    try {
        const report = await Report_1.default.findByIdAndUpdate(req.params.id, {
            status: 'resolved',
            resolvedAt: new Date()
        }, { new: true });
        if (!report) {
            res.status(404).json({
                success: false,
                message: 'Report not found'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Report resolved successfully',
            data: { report }
        });
    }
    catch (error) {
        console.error('Resolve report error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.patch('/:id/dismiss', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'moderator']), async (req, res) => {
    try {
        const report = await Report_1.default.findByIdAndUpdate(req.params.id, { status: 'dismissed' }, { new: true });
        if (!report) {
            res.status(404).json({
                success: false,
                message: 'Report not found'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Report dismissed successfully',
            data: { report }
        });
    }
    catch (error) {
        console.error('Dismiss report error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/route/:routeId', (0, validation_2.validateQuery)(validation_1.paginationSchema), async (req, res) => {
    try {
        const { routeId } = req.params;
        const { page, limit, sort, order } = req.query;
        const skip = (page - 1) * limit;
        const query = { routeId, status: { $in: ['verified', 'resolved'] } };
        const sortOrder = order === 'asc' ? 1 : -1;
        const reports = await Report_1.default.find(query)
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'displayName')
            .populate('verifiedBy', 'displayName');
        const total = await Report_1.default.countDocuments(query);
        res.json({
            success: true,
            data: {
                reports,
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
        console.error('Get route reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map