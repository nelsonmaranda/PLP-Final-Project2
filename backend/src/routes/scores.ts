import express from 'express'
import Score from '../models/Score'
import Report from '../models/Report'
import Route from '../models/Route'
import { validateQuery, paginationSchema } from '../middleware/validation'
import { validateQuery as validateQueryMiddleware } from '../middleware/validation'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { apiLimiter } from '../middleware/rateLimiter'

const router = express.Router()

// Get all scores with pagination
router.get('/', apiLimiter, validateQueryMiddleware(paginationSchema), async (req, res): Promise<void> => {
  try {
    const { page, limit, sort, order } = req.query as any
    const skip = (page - 1) * limit

    const sortOrder = order === 'asc' ? 1 : -1

    const scores = await Score.find()
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('routeId', 'name operator fare')

    const total = await Score.countDocuments()

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
    })
  } catch (error) {
    console.error('Get scores error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get score for specific route
router.get('/route/:routeId', apiLimiter, async (req, res): Promise<void> => {
  try {
    const { routeId } = req.params

    const score = await Score.findOne({ routeId })
      .populate('routeId', 'name operator fare')

    if (!score) {
      res.status($1).json({
        success: false,
        message: 'Score not found for this route'
      })
    }

    res.json({
      success: true,
      data: { score }
    })
  } catch (error) {
    console.error('Get route score error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get top performing routes
router.get('/top/:limit?', apiLimiter, async (req, res): Promise<void> => {
  try {
    const limit = parseInt(req.params.limit) || 10

    const scores = await Score.find()
      .sort({ overall: -1 })
      .limit(limit)
      .populate('routeId', 'name operator fare')

    res.json({
      success: true,
      data: { scores }
    })
  } catch (error) {
    console.error('Get top scores error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get worst performing routes
router.get('/worst/:limit?', apiLimiter, async (req, res): Promise<void> => {
  try {
    const limit = parseInt(req.params.limit) || 10

    const scores = await Score.find()
      .sort({ overall: 1 })
      .limit(limit)
      .populate('routeId', 'name operator fare')

    res.json({
      success: true,
      data: { scores }
    })
  } catch (error) {
    console.error('Get worst scores error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Recalculate scores for all routes (admin only)
router.post('/recalculate', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const routes = await Route.find({ isActive: true })
    const results = []

    for (const route of routes) {
      const score = await calculateRouteScore(route._id)
      results.push(score)
    }

    res.json({
      success: true,
      message: 'Scores recalculated successfully',
      data: { results }
    })
  } catch (error) {
    console.error('Recalculate scores error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Recalculate score for specific route (admin/moderator only)
router.post('/recalculate/:routeId', authenticateToken, requireRole(['admin', 'moderator']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const { routeId } = req.params

    const route = await Route.findById(routeId)
    if (!route) {
      res.status($1).json({
        success: false,
        message: 'Route not found'
      })
    }

    const score = await calculateRouteScore(routeId)

    res.json({
      success: true,
      message: 'Route score recalculated successfully',
      data: { score }
    })
  } catch (error) {
    console.error('Recalculate route score error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Helper function to calculate route score
async function calculateRouteScore(routeId: string) {
  const reports = await Report.find({
    routeId,
    status: { $in: ['verified', 'resolved'] }
  })

  if (reports.length === 0) {
    // No reports, return default scores
    const defaultScore = {
      routeId,
      reliability: 0,
      safety: 0,
      punctuality: 0,
      comfort: 0,
      overall: 0,
      totalReports: 0,
      lastCalculated: new Date()
    }

    await Score.findOneAndUpdate(
      { routeId },
      defaultScore,
      { upsert: true, new: true }
    )

    return defaultScore
  }

  // Calculate scores based on report types and severity
  let reliabilityScore = 0
  let safetyScore = 0
  let punctualityScore = 0
  let comfortScore = 0

  const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 }
    const reportTypeWeights: Record<string, Record<string, number>> = {
      delay: { reliability: 0.4, punctuality: 0.6 },
      safety: { safety: 1.0 },
      crowding: { comfort: 0.8, reliability: 0.2 },
      breakdown: { reliability: 0.6, safety: 0.4 },
      other: { reliability: 0.3, safety: 0.3, comfort: 0.4 }
    }

  for (const report of reports) {
    const severityWeight = severityWeights[report.severity] || 1
    const typeWeights = reportTypeWeights[report.reportType] || { reliability: 0.25, safety: 0.25, punctuality: 0.25, comfort: 0.25 }

    // Negative impact based on severity
    const impact = -severityWeight * 0.5

    if (typeWeights.reliability) reliabilityScore += impact * typeWeights.reliability
    if (typeWeights.safety) safetyScore += impact * typeWeights.safety
    if (typeWeights.punctuality) punctualityScore += impact * typeWeights.punctuality
    if (typeWeights.comfort) comfortScore += impact * typeWeights.comfort
  }

  // Normalize scores to 0-5 range, starting from 5 (perfect score)
  const normalizeScore = (score: number) => Math.max(0, Math.min(5, 5 + score))

  const finalScores: any = {
    routeId,
    reliability: normalizeScore(reliabilityScore),
    safety: normalizeScore(safetyScore),
    punctuality: normalizeScore(punctualityScore),
    comfort: normalizeScore(comfortScore),
    totalReports: reports.length,
    lastCalculated: new Date()
  }

  // Calculate overall score
  (finalScores as any).overall = (finalScores.reliability + finalScores.safety + finalScores.punctuality + finalScores.comfort) / 4

  // Save or update score
  await Score.findOneAndUpdate(
    { routeId },
    finalScores,
    { upsert: true, new: true }
  )

  return finalScores
}

export default router
