import express from 'express'
import Report from '../models/Report'
import Route from '../models/Route'
import { validate, reportSchema, paginationSchema } from '../middleware/validation'
import { validateQuery } from '../middleware/validation'
import { authenticateToken, requireRole, optionalAuth, AuthRequest } from '../middleware/auth'
import { reportLimiter, deviceFingerprintLimiter } from '../middleware/rateLimiter'

const router = express.Router()

// Submit new report
router.post('/', reportLimiter, deviceFingerprintLimiter, optionalAuth, validate(reportSchema), async (req: AuthRequest, res): Promise<void> => {
  try {
    const { routeId, reportType, description, location, severity, isAnonymous } = req.body

    // Verify route exists
    const route = await Route.findById(routeId)
    if (!route) {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      })
      return
    }

    // Create report
    const report = new Report({
      userId: req.user?._id,
      routeId,
      reportType,
      description,
      location,
      severity,
      isAnonymous: isAnonymous || !req.user,
      deviceFingerprint: req.deviceFingerprint
    })

    await report.save()

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: { report }
    })
  } catch (error) {
    console.error('Submit report error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get reports with pagination and filtering
router.get('/', authenticateToken, requireRole(['admin', 'moderator']), validateQuery(paginationSchema), async (req: AuthRequest, res): Promise<void> => {
  try {
    const { page, limit, sort, order } = req.query as any
    const { status, reportType, severity, routeId } = req.query as any
    const skip = (page - 1) * limit

    const query: any = {}
    if (status) query.status = status
    if (reportType) query.reportType = reportType
    if (severity) query.severity = severity
    if (routeId) query.routeId = routeId

    const sortOrder = order === 'asc' ? 1 : -1

    const reports = await Report.find(query)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'displayName email')
      .populate('routeId', 'name operator')
      .populate('verifiedBy', 'displayName')

    const total = await Report.countDocuments(query)

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
    })
  } catch (error) {
    console.error('Get reports error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get single report
router.get('/:id', authenticateToken, requireRole(['admin', 'moderator']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('userId', 'displayName email')
      .populate('routeId', 'name operator')
      .populate('verifiedBy', 'displayName')

    if (!report) {
      res.status(404).json({
        success: false,
        message: 'Report not found'
      })
      return
    }

    res.json({
      success: true,
      data: { report }
    })
  } catch (error) {
    console.error('Get report error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Verify report (moderator/admin only)
router.patch('/:id/verify', authenticateToken, requireRole(['admin', 'moderator']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: 'verified',
        verifiedBy: req.user!._id,
        verifiedAt: new Date()
      },
      { new: true }
    )

    if (!report) {
      res.status(404).json({
        success: false,
        message: 'Report not found'
      })
      return
    }

    res.json({
      success: true,
      message: 'Report verified successfully',
      data: { report }
    })
  } catch (error) {
    console.error('Verify report error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Resolve report (moderator/admin only)
router.patch('/:id/resolve', authenticateToken, requireRole(['admin', 'moderator']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedAt: new Date()
      },
      { new: true }
    )

    if (!report) {
      res.status(404).json({
        success: false,
        message: 'Report not found'
      })
      return
    }

    res.json({
      success: true,
      message: 'Report resolved successfully',
      data: { report }
    })
  } catch (error) {
    console.error('Resolve report error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Dismiss report (moderator/admin only)
router.patch('/:id/dismiss', authenticateToken, requireRole(['admin', 'moderator']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'dismissed' },
      { new: true }
    )

    if (!report) {
      res.status(404).json({
        success: false,
        message: 'Report not found'
      })
      return
    }

    res.json({
      success: true,
      message: 'Report dismissed successfully',
      data: { report }
    })
  } catch (error) {
    console.error('Dismiss report error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get reports by route
router.get('/route/:routeId', validateQuery(paginationSchema), async (req, res): Promise<void> => {
  try {
    const { routeId } = req.params
    const { page, limit, sort, order } = req.query as any
    const skip = (page - 1) * limit

    const query = { routeId, status: { $in: ['verified', 'resolved'] } }
    const sortOrder = order === 'asc' ? 1 : -1

    const reports = await Report.find(query)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'displayName')
      .populate('verifiedBy', 'displayName')

    const total = await Report.countDocuments(query)

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
    })
  } catch (error) {
    console.error('Get route reports error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

export default router
