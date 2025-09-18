"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Score_1 = __importDefault(require("../models/Score"));
const Report_1 = __importDefault(require("../models/Report"));
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
        const sortOrder = order === 'asc' ? 1 : -1;
        const scores = await Score_1.default.find()
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limit)
            .populate('routeId', 'name operator fare');
        const total = await Score_1.default.countDocuments();
        res.json({
            success: true,
            data: {
                scores,
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
        console.error('Get scores error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/route/:routeId', rateLimiter_1.apiLimiter, async (req, res) => {
    try {
        const { routeId } = req.params;
        const score = await Score_1.default.findOne({ routeId })
            .populate('routeId', 'name operator fare');
        if (!score) {
            res.status($1).json({
                success: false,
                message: 'Score not found for this route'
            });
        }
        res.json({
            success: true,
            data: { score }
        });
    }
    catch (error) {
        console.error('Get route score error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/top/:limit?', rateLimiter_1.apiLimiter, async (req, res) => {
    try {
        const limit = parseInt(req.params.limit) || 10;
        const scores = await Score_1.default.find()
            .sort({ overall: -1 })
            .limit(limit)
            .populate('routeId', 'name operator fare');
        res.json({
            success: true,
            data: { scores }
        });
    }
    catch (error) {
        console.error('Get top scores error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/worst/:limit?', rateLimiter_1.apiLimiter, async (req, res) => {
    try {
        const limit = parseInt(req.params.limit) || 10;
        const scores = await Score_1.default.find()
            .sort({ overall: 1 })
            .limit(limit)
            .populate('routeId', 'name operator fare');
        res.json({
            success: true,
            data: { scores }
        });
    }
    catch (error) {
        console.error('Get worst scores error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/recalculate', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin']), async (req, res) => {
    try {
        const routes = await Route_1.default.find({ isActive: true });
        const results = [];
        for (const route of routes) {
            const score = await calculateRouteScore(route._id);
            results.push(score);
        }
        res.json({
            success: true,
            message: 'Scores recalculated successfully',
            data: { results }
        });
    }
    catch (error) {
        console.error('Recalculate scores error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/recalculate/:routeId', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'moderator']), async (req, res) => {
    try {
        const { routeId } = req.params;
        const route = await Route_1.default.findById(routeId);
        if (!route) {
            res.status($1).json({
                success: false,
                message: 'Route not found'
            });
        }
        const score = await calculateRouteScore(routeId);
        res.json({
            success: true,
            message: 'Route score recalculated successfully',
            data: { score }
        });
    }
    catch (error) {
        console.error('Recalculate route score error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
async function calculateRouteScore(routeId) {
    const reports = await Report_1.default.find({
        routeId,
        status: { $in: ['verified', 'resolved'] }
    });
    if (reports.length === 0) {
        const defaultScore = {
            routeId,
            reliability: 0,
            safety: 0,
            punctuality: 0,
            comfort: 0,
            overall: 0,
            totalReports: 0,
            lastCalculated: new Date()
        };
        await Score_1.default.findOneAndUpdate({ routeId }, defaultScore, { upsert: true, new: true });
        return defaultScore;
    }
    let reliabilityScore = 0;
    let safetyScore = 0;
    let punctualityScore = 0;
    let comfortScore = 0;
    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    const reportTypeWeights = {
        delay: { reliability: 0.4, punctuality: 0.6 },
        safety: { safety: 1.0 },
        crowding: { comfort: 0.8, reliability: 0.2 },
        breakdown: { reliability: 0.6, safety: 0.4 },
        other: { reliability: 0.3, safety: 0.3, comfort: 0.4 }
    };
    for (const report of reports) {
        const severityWeight = severityWeights[report.severity] || 1;
        const typeWeights = reportTypeWeights[report.reportType] || { reliability: 0.25, safety: 0.25, punctuality: 0.25, comfort: 0.25 };
        const impact = -severityWeight * 0.5;
        if (typeWeights.reliability)
            reliabilityScore += impact * typeWeights.reliability;
        if (typeWeights.safety)
            safetyScore += impact * typeWeights.safety;
        if (typeWeights.punctuality)
            punctualityScore += impact * typeWeights.punctuality;
        if (typeWeights.comfort)
            comfortScore += impact * typeWeights.comfort;
    }
    const normalizeScore = (score) => Math.max(0, Math.min(5, 5 + score));
    const finalScores = {
        routeId,
        reliability: normalizeScore(reliabilityScore),
        safety: normalizeScore(safetyScore),
        punctuality: normalizeScore(punctualityScore),
        comfort: normalizeScore(comfortScore),
        totalReports: reports.length,
        lastCalculated: new Date()
    }(finalScores).overall = (finalScores.reliability + finalScores.safety + finalScores.punctuality + finalScores.comfort) / 4;
    await Score_1.default.findOneAndUpdate({ routeId }, finalScores, { upsert: true, new: true });
    return finalScores;
}
exports.default = router;
//# sourceMappingURL=scores.js.map