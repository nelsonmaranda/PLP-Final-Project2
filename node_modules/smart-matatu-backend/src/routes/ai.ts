import express from 'express'
import { inferenceInputSchema, runInference } from '../services/aiService'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// POST /api/ai/predict
router.post('/predict', authenticateToken, async (req, res) => {
  try {
    const parsed = inferenceInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: parsed.error.flatten(),
      })
    }

    const result = await runInference(parsed.data)
    return res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('AI inference error:', error)
    return res.status(500).json({ success: false, message: 'Inference failed' })
  }
})

export default router

