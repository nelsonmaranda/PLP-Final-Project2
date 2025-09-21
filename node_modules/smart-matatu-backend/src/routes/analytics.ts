import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import analyticsService from '../services/analyticsService';

const router = Router();

// Route efficiency scoring
router.get('/efficiency/:routeId', authenticateToken, async (req, res) => {
  try {
    const { routeId } = req.params;
    const efficiency = await analyticsService.calculateRouteEfficiency(routeId);
    
    res.json({
      success: true,
      data: efficiency
    });
  } catch (error) {
    console.error('Route efficiency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate route efficiency'
    });
  }
});

// Travel time prediction
router.post('/travel-time/predict', authenticateToken, async (req, res) => {
  try {
    const { routeId, fromStop, toStop, timeOfDay } = req.body;
    
    if (!routeId || !fromStop || !toStop) {
      return res.status(400).json({
        success: false,
        message: 'Route ID, from stop, and to stop are required'
      });
    }
    
    const prediction = await analyticsService.predictTravelTime(routeId, fromStop, toStop, timeOfDay);
    
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Travel time prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict travel time'
    });
  }
});

// Alternative routes
router.post('/routes/alternatives', authenticateToken, async (req, res) => {
  try {
    const { fromStop, toStop, maxTime, maxCost } = req.body;
    
    if (!fromStop || !toStop) {
      return res.status(400).json({
        success: false,
        message: 'From stop and to stop are required'
      });
    }
    
    const alternatives = await analyticsService.findAlternativeRoutes(fromStop, toStop, maxTime, maxCost);
    
    res.json({
      success: true,
      data: {
        alternatives,
        count: alternatives.length
      }
    });
  } catch (error) {
    console.error('Alternative routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find alternative routes'
    });
  }
});

// Trend analysis
router.get('/trends/:routeId', authenticateToken, async (req, res) => {
  try {
    const { routeId } = req.params;
    const { period = 'weekly' } = req.query;
    
    if (!['daily', 'weekly', 'monthly'].includes(period as string)) {
      return res.status(400).json({
        success: false,
        message: 'Period must be daily, weekly, or monthly'
      });
    }
    
    const trends = await analyticsService.analyzeTrends(routeId, period as 'daily' | 'weekly' | 'monthly');
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Trend analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze trends'
    });
  }
});

// Demand forecasting
router.post('/demand/forecast', authenticateToken, async (req, res) => {
  try {
    const { routeId, timeSlot } = req.body;
    
    if (!routeId || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Route ID and time slot are required'
      });
    }
    
    const forecast = await analyticsService.forecastDemand(routeId, timeSlot);
    
    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    console.error('Demand forecasting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to forecast demand'
    });
  }
});

// User recommendations
router.get('/recommendations/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can access their own recommendations
    if (req.user?.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const recommendations = await analyticsService.generateUserRecommendations(userId);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('User recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations'
    });
  }
});

// Bulk efficiency scores for multiple routes
router.post('/efficiency/bulk', authenticateToken, async (req, res) => {
  try {
    const { routeIds } = req.body;
    
    if (!Array.isArray(routeIds) || routeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Route IDs array is required'
      });
    }
    
    const efficiencyScores = await Promise.all(
      routeIds.map(async (routeId: string) => {
        try {
          return await analyticsService.calculateRouteEfficiency(routeId);
        } catch (error) {
          console.error(`Error calculating efficiency for route ${routeId}:`, error);
          return null;
        }
      })
    );
    
    const validScores = efficiencyScores.filter(score => score !== null);
    
    res.json({
      success: true,
      data: {
        scores: validScores,
        count: validScores.length,
        total: routeIds.length
      }
    });
  } catch (error) {
    console.error('Bulk efficiency calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate bulk efficiency scores'
    });
  }
});

// Route comparison
router.post('/routes/compare', authenticateToken, async (req, res) => {
  try {
    const { routeIds } = req.body;
    
    if (!Array.isArray(routeIds) || routeIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 route IDs are required for comparison'
      });
    }
    
    const comparisons = await Promise.all(
      routeIds.map(async (routeId: string) => {
        try {
          const efficiency = await analyticsService.calculateRouteEfficiency(routeId);
          return {
            routeId,
            routeName: efficiency.routeName,
            efficiencyScore: efficiency.efficiencyScore,
            factors: efficiency.factors,
            recommendations: efficiency.recommendations
          };
        } catch (error) {
          console.error(`Error comparing route ${routeId}:`, error);
          return null;
        }
      })
    );
    
    const validComparisons = comparisons.filter(comp => comp !== null);
    
    // Sort by efficiency score
    validComparisons.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    
    res.json({
      success: true,
      data: {
        comparisons: validComparisons,
        bestRoute: validComparisons[0],
        worstRoute: validComparisons[validComparisons.length - 1]
      }
    });
  } catch (error) {
    console.error('Route comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare routes'
    });
  }
});

// Analytics dashboard data
router.get('/dashboard/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can access their dashboard
    if (req.user?.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get user recommendations
    const recommendations = await analyticsService.generateUserRecommendations(userId);
    
    // Get recent trends for user's frequently used routes
    // This would need to be implemented based on user's report history
    const recentTrends = []; // Placeholder
    
    res.json({
      success: true,
      data: {
        recommendations,
        recentTrends,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load analytics dashboard'
    });
  }
});

export default router;
