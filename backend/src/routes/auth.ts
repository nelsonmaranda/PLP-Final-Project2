import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import { validate, userRegistrationSchema, userLoginSchema } from '../middleware/validation'
import { authLimiter } from '../middleware/rateLimiter'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = express.Router()

// Register new user
router.post('/register', validate(userRegistrationSchema), async (req, res): Promise<void> => {
  try {
    const { email, password, displayName } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      })
      return
    }

    // Create new user
    const user = new User({
      email,
      password,
      displayName
    })

    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role
        },
        token
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Login user
router.post('/login', authLimiter, validate(userLoginSchema), async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
      return
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      })
      return
    }

    // Compare password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          lastLogin: user.lastLogin
        },
        token
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    })
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { displayName } = req.body
    const userId = req.user!._id

    const user = await User.findByIdAndUpdate(
      userId,
      { displayName },
      { new: true, runValidators: true }
    )

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role
        }
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

// Logout (client-side token removal)
router.post('/logout', authenticateToken, async (req: AuthRequest, res): Promise<void> => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
})

export default router
