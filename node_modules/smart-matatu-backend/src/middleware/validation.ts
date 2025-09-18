import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'

// Validation schemas
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50, 'Display name too long')
})

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export const reportSchema = z.object({
  routeId: z.string().min(1, 'Route ID is required'),
  reportType: z.enum(['delay', 'safety', 'crowding', 'breakdown', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  location: z.object({
    coordinates: z.array(z.number()).length(2, 'Coordinates must be [longitude, latitude]'),
    address: z.string().optional()
  }),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  isAnonymous: z.boolean().optional().default(false)
})

export const routeSchema = z.object({
  name: z.string().min(2, 'Route name must be at least 2 characters').max(100, 'Route name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long'),
  path: z.array(z.array(z.number()).length(2)).min(2, 'Path must have at least 2 coordinates'),
  stops: z.array(z.object({
    name: z.string().min(1, 'Stop name is required'),
    coordinates: z.array(z.number()).length(2, 'Stop coordinates must be [longitude, latitude]'),
    description: z.string().optional()
  })).min(2, 'Route must have at least 2 stops'),
  operator: z.string().min(1, 'Operator is required').max(100, 'Operator name too long'),
  fare: z.number().min(0, 'Fare must be non-negative'),
  operatingHours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format')
  })
})

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
        return
      }
      next(error)
    }
  }
}

// Query parameter validation
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        })
        return
      }
      next(error)
    }
  }
}

// Common query schemas
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  sort: z.string().optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
})

export const locationQuerySchema = z.object({
  lat: z.string().transform(val => parseFloat(val)),
  lng: z.string().transform(val => parseFloat(val)),
  radius: z.string().optional().transform(val => val ? parseFloat(val) : 5) // km
})
