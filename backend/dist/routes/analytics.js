"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const analyticsService_1 = __importDefault(require("../services/analyticsService"));
const router = (0, express_1.Router)();
router.get('/efficiency/:routeId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { routeId } = req.params;
        const efficiency = await analyticsService_1.default.calculateRouteEfficiency(routeId);
        res.json({
            success: true,
            data: efficiency
        });
    }
    catch (error) {
        console.error('Route efficiency error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate route efficiency'
        });
    }
});
router.post('/travel-time/predict', auth_1.authenticateToken, async (req, res) => {
    try {
        const { routeId, fromStop, toStop, timeOfDay } = req.body;
        if (!routeId || !fromStop || !toStop) {
            return res.status(400).json({
                success: false,
                message: 'Route ID, from stop, and to stop are required'
            });
        }
        const prediction = await analyticsService_1.default.predictTravelTime(routeId, fromStop, toStop, timeOfDay);
        res.json({
            success: true,
            data: prediction
        });
    }
    catch (error) {
        console.error('Travel time prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to predict travel time'
        });
    }
});
router.post('/routes/alternatives', auth_1.authenticateToken, async (req, res) => {
    try {
        const { fromStop, toStop, maxTime, maxCost } = req.body;
        if (!fromStop || !toStop) {
            return res.status(400).json({
                success: false,
                message: 'From stop and to stop are required'
            });
        }
        const alternatives = await analyticsService_1.default.findAlternativeRoutes(fromStop, toStop, maxTime, maxCost);
        res.json({
            success: true,
            data: {
                alternatives,
                count: alternatives.length
            }
        });
    }
    catch (error) {
        console.error('Alternative routes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find alternative routes'
        });
    }
});
router.get('/trends/:routeId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { routeId } = req.params;
        const { period = 'weekly' } = req.query;
        if (!['daily', 'weekly', 'monthly'].includes(period)) {
            return res.status(400).json({
                success: false,
                message: 'Period must be daily, weekly, or monthly'
            });
        }
        const trends = await analyticsService_1.default.analyzeTrends(routeId, period);
        res.json({
            success: true,
            data: trends
        });
    }
    catch (error) {
        console.error('Trend analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze trends'
        });
    }
});
router.post('/demand/forecast', auth_1.authenticateToken, async (req, res) => {
    try {
        const { routeId, timeSlot } = req.body;
        if (!routeId || !timeSlot) {
            return res.status(400).json({
                success: false,
                message: 'Route ID and time slot are required'
            });
        }
        const forecast = await analyticsService_1.default.forecastDemand(routeId, timeSlot);
        res.json({
            success: true,
            data: forecast
        });
    }
    catch (error) {
        console.error('Demand forecasting error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to forecast demand'
        });
    }
});
router.get('/recommendations/:userId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.user?.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        const recommendations = await analyticsService_1.default.generateUserRecommendations(userId);
        res.json({
            success: true,
            data: recommendations
        });
    }
    catch (error) {
        console.error('User recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate recommendations'
        });
    }
});
router.post('/efficiency/bulk', auth_1.authenticateToken, async (req, res) => {
    try {
        const { routeIds } = req.body;
        if (!Array.isArray(routeIds) || routeIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Route IDs array is required'
            });
        }
        const efficiencyScores = await Promise.all(routeIds.map(async (routeId) => {
            try {
                return await analyticsService_1.default.calculateRouteEfficiency(routeId);
            }
            catch (error) {
                console.error(`Error calculating efficiency for route ${routeId}:`, error);
                return null;
            }
        }));
        const validScores = efficiencyScores.filter(score => score !== null);
        res.json({
            success: true,
            data: {
                scores: validScores,
                count: validScores.length,
                total: routeIds.length
            }
        });
    }
    catch (error) {
        console.error('Bulk efficiency calculation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate bulk efficiency scores'
        });
    }
});
router.post('/routes/compare', auth_1.authenticateToken, async (req, res) => {
    try {
        const { routeIds } = req.body;
        if (!Array.isArray(routeIds) || routeIds.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'At least 2 route IDs are required for comparison'
            });
        }
        const comparisons = await Promise.all(routeIds.map(async (routeId) => {
            try {
                const efficiency = await analyticsService_1.default.calculateRouteEfficiency(routeId);
                return {
                    routeId,
                    routeName: efficiency.routeName,
                    efficiencyScore: efficiency.efficiencyScore,
                    factors: efficiency.factors,
                    recommendations: efficiency.recommendations
                };
            }
            catch (error) {
                console.error(`Error comparing route ${routeId}:`, error);
                return null;
            }
        }));
        const validComparisons = comparisons.filter(comp => comp !== null);
        validComparisons.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
        res.json({
            success: true,
            data: {
                comparisons: validComparisons,
                bestRoute: validComparisons[0],
                worstRoute: validComparisons[validComparisons.length - 1]
            }
        });
    }
    catch (error) {
        console.error('Route comparison error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to compare routes'
        });
    }
});
router.get('/dashboard/:userId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.user?.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        const recommendations = await analyticsService_1.default.generateUserRecommendations(userId);
        const recentTrends = [];
        res.json({
            success: true,
            data: {
                recommendations,
                recentTrends,
                lastUpdated: new Date()
            }
        });
    }
    catch (error) {
        console.error('Analytics dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load analytics dashboard'
        });
    }
});
exports.default = router;
//# sourceMappingURL=analytics.js.map