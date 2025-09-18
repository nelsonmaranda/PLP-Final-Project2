import mongoose, { Document, Schema } from 'mongoose'

export interface IStop {
  name: string
  coordinates: [number, number] // [longitude, latitude]
  description?: string
}

export interface IRoute extends Document {
  _id: string
  name: string
  description: string
  path: [number, number][] // Array of [longitude, latitude] coordinates
  stops: IStop[]
  operator: string
  fare: number
  operatingHours: {
    start: string // HH:MM format
    end: string   // HH:MM format
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const StopSchema = new Schema<IStop>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function(coords: number[]) {
        return coords.length === 2 && 
               coords[0] >= -180 && coords[0] <= 180 && // longitude
               coords[1] >= -90 && coords[1] <= 90      // latitude
      },
      message: 'Coordinates must be [longitude, latitude] with valid ranges'
    }
  },
  description: {
    type: String,
    trim: true
  }
}, { _id: false })

const RouteSchema = new Schema<IRoute>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  path: {
    type: [[Number]],
    required: true,
    validate: {
      validator: function(path: number[][]) {
        return path.length >= 2 && path.every(coord => 
          coord.length === 2 && 
          coord[0] >= -180 && coord[0] <= 180 && 
          coord[1] >= -90 && coord[1] <= 90
        )
      },
      message: 'Path must contain at least 2 valid coordinate pairs'
    }
  },
  stops: [StopSchema],
  operator: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  fare: {
    type: Number,
    required: true,
    min: 0
  },
  operatingHours: {
    start: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
    },
    end: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Create 2dsphere index for geospatial queries
RouteSchema.index({ 'stops.coordinates': '2dsphere' })
RouteSchema.index({ 'path': '2dsphere' })

export default mongoose.model<IRoute>('Route', RouteSchema)
