import mongoose, { Document, Schema } from 'mongoose'

export interface IScore extends Document {
  _id: string
  routeId: string
  reliability: number // 0-5 scale
  safety: number      // 0-5 scale
  punctuality: number // 0-5 scale
  comfort: number     // 0-5 scale
  overall: number     // 0-5 scale (calculated average)
  totalReports: number
  lastCalculated: Date
  createdAt: Date
  updatedAt: Date
}

const ScoreSchema = new Schema<IScore>({
  routeId: {
    type: String,
    required: true,
    unique: true
  },
  reliability: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  safety: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  punctuality: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  comfort: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  overall: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  totalReports: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lastCalculated: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
})

// Calculate overall score before saving
ScoreSchema.pre('save', function(next) {
  const doc = this as any
  doc.overall = (doc.reliability + doc.safety + doc.punctuality + doc.comfort) / 4
  next()
})

// Create index for efficient queries
ScoreSchema.index({ routeId: 1 })
ScoreSchema.index({ overall: -1 })
ScoreSchema.index({ lastCalculated: -1 })

export default mongoose.model<IScore>('Score', ScoreSchema)
