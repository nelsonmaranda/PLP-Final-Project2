import rateLimit from 'express-rate-limit'
import { Request, Response } from 'express'

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict rate limiter for report submission
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 reports per hour
  message: {
    success: false,
    message: 'Too many reports submitted, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Auth rate limiter for login attempts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
})

// Device fingerprint rate limiter
export const deviceFingerprintLimiter = (req: Request, res: Response, next: any): void => {
  const deviceFingerprint = req.headers['x-device-fingerprint'] as string
  
  if (!deviceFingerprint) {
    res.status(400).json({
      success: false,
      message: 'Device fingerprint required'
    })
    return
  }

  // Store device fingerprint in request for later use
  req.deviceFingerprint = deviceFingerprint
  next()
}

// Extend Request interface to include deviceFingerprint
declare global {
  namespace Express {
    interface Request {
      deviceFingerprint?: string
    }
  }
}
