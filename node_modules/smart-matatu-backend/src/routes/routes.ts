import express from 'express'
import Route from '../models/Route'
import { validate, routeSchema, paginationSchema, locationQuerySchema } from '../middleware/validation'
import { validateQuery } from '../middleware/validation'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { apiLimiter } from '../middleware/rateLimiter'

const router = express.Router()

// Get all routes with pagination and filtering
router.get('/', apiLimiter, validateQuery(paginationSchema), async (req, res): Promise<void> => {
  try {
    const { page, limit, sort, order } = req.query as any
    const skip = (page - 1) * limit

    const query = { isActive: true }
    const sortOrder = order === 'asc' ? 1 : -1

    const routes = await Route.find(query)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('stops')

    const total = await Route.countDocuments(query)

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
    })
  } catch (error) {
    console.error('Get routes error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get routes near a location
router.get('/nearby', apiLimiter, validateQuery(locationQuerySchema), async (req, res): Promise<void> => {
  try {
    const { lat, lng, radius } = req.query as any

    const routes = await Route.find({
      isActive: true,
      'stops.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    }).populate('stops')

    res.json({
      success: true,
      data: {
        routes,
        location: { lat, lng },
        radius
      }
    })
  } catch (error) {
    console.error('Get nearby routes error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get single route by ID
router.get('/:id', apiLimiter, async (req, res): Promise<void> => {
  try {
    const route = await Route.findById(req.params.id).populate('stops')

    if (!route) {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      })
      return
    }

    res.json({
      success: true,
      data: { route }
    })
  } catch (error) {
    console.error('Get route error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Create new route (admin/moderator only)
router.post('/', authenticateToken, requireRole(['admin', 'moderator']), validate(routeSchema), async (req: AuthRequest, res): Promise<void> => {
  try {
    const route = new Route(req.body)
    await route.save()

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: { route }
    })
  } catch (error) {
    console.error('Create route error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Update route (admin/moderator only)
router.put('/:id', authenticateToken, requireRole(['admin', 'moderator']), validate(routeSchema), async (req: AuthRequest, res): Promise<void> => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!route) {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      })
      return
    }

    res.json({
      success: true,
      message: 'Route updated successfully',
      data: { route }
    })
  } catch (error) {
    console.error('Update route error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Delete route (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res): Promise<void> => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )

    if (!route) {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      })
      return
    }

    res.json({
      success: true,
      message: 'Route deactivated successfully'
    })
  } catch (error) {
    console.error('Delete route error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Search routes
router.get('/search/:query', apiLimiter, async (req, res): Promise<void> => {
  try {
    const { query } = req.params
    const { page = 1, limit = 10 } = req.query as any
    const skip = (page - 1) * limit

    const searchQuery = {
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { operator: { $regex: query, $options: 'i' } }
      ]
    }

    const routes = await Route.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .populate('stops')

    const total = await Route.countDocuments(searchQuery)

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
    })
  } catch (error) {
    console.error('Search routes error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

export default router
