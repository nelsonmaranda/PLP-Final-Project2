const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['user', 'sacco', 'authority', 'moderator', 'admin'], 
    default: 'user' 
  },
  requestedRole: { 
    type: String, 
    enum: ['user', 'sacco', 'authority', 'moderator', 'admin'] 
  },
  status: { 
    type: String, 
    enum: ['active', 'pending', 'suspended', 'rejected'], 
    default: 'active' 
  },
  organization: { type: String },
  permissions: [{ type: String }],
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  savedRoutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Route Schema
const routeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  operator: { type: String, required: true },
  routeNumber: { type: String, required: true },
  path: { type: [Number], required: true }, // Flattened array of coordinates [lng1, lat1, lng2, lat2, ...]
  stops: [{
    name: { type: String, required: true },
    coordinates: { type: [Number], required: true } // [lng, lat]
  }],
  fare: { type: Number, required: true },
  operatingHours: {
    start: { type: String, required: true },
    end: { type: String, required: true }
  },
  isActive: { type: Boolean, default: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Report Schema
const reportSchema = new mongoose.Schema({
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportType: { 
    type: String, 
    enum: ['delay', 'breakdown', 'safety', 'crowding', 'other'], 
    required: true 
  },
  description: { type: String },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'], 
    default: 'pending' 
  },
  isAnonymous: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Score Schema
const scoreSchema = new mongoose.Schema({
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  reliability: { type: Number, min: 0, max: 5, required: true },
  safety: { type: Number, min: 0, max: 5, required: true },
  punctuality: { type: Number, min: 0, max: 5, required: true },
  comfort: { type: Number, min: 0, max: 5, required: true },
  overall: { type: Number, min: 0, max: 5, required: true },
  totalReports: { type: Number, default: 0 },
  lastCalculated: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create indexes for better performance
routeSchema.index({ 'stops.coordinates': '2dsphere' });
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ routeId: 1, createdAt: -1 });
scoreSchema.index({ routeId: 1 });

// Create models
const User = mongoose.model('User', userSchema);
const Route = mongoose.model('Route', routeSchema);
const Report = mongoose.model('Report', reportSchema);
const Score = mongoose.model('Score', scoreSchema);

module.exports = {
  User,
  Route,
  Report,
  Score
};
