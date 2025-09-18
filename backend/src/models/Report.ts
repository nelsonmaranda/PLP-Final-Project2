import mongoose, { Document, Schema } from 'mongoose'

export interface IReport extends Document {
  _id: string
  userId?: string
  routeId: string
  reportType: 'delay' | 'safety' | 'crowding' | 'breakdown' | 'other'
  description: string
  location: {
    coordinates: [number, number] // [longitude, latitude]
    address?: string
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'verified' | 'resolved' | 'dismissed'
  deviceFingerprint: string
  images?: string[] // URLs to uploaded images
  isAnonymous: boolean
  verifiedBy?: string // moderator/admin who verified
  verifiedAt?: Date
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ReportSchema = new Schema<IReport>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous reports
  },
  routeId: {
    type: String,
    required: true
  },
  reportType: {
    type: String,
    enum: ['delay', 'safety', 'crowding', 'breakdown', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  location: {
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coords: number[]) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && 
                 coords[1] >= -90 && coords[1] <= 90
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges'
      }
    },
    address: {
      type: String,
      trim: true,
      maxlength: 200
    }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'resolved', 'dismissed'],
    default: 'pending'
  },
  deviceFingerprint: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Create 2dsphere index for geospatial queries
ReportSchema.index({ 'location.coordinates': '2dsphere' })

// Create compound indexes for efficient queries
ReportSchema.index({ routeId: 1, status: 1 })
ReportSchema.index({ reportType: 1, severity: 1 })
ReportSchema.index({ createdAt: -1 })

export default mongoose.model<IReport>('Report', ReportSchema)
