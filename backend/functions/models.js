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
  avatarUrl: { type: String },
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
    enum: ['delay', 'breakdown', 'safety', 'crowding', 'overcrowding', 'accident', 'harassment', 'other'], 
    required: true 
  },
  description: { type: String },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  },
  // Optional metadata to support SACCO analytics and fare calculations
  sacco: { type: String },
  direction: { type: String, enum: ['from_cbd', 'to_cbd', 'along_route'] },
  fare: { type: Number },
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
  // Device fingerprint (IP + UA) for de-duplicating rider actions
  deviceFingerprint: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Score Schema
const scoreSchema = new mongoose.Schema({
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for user-specific scores
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

// Rate limit Schema for device-based throttling per route
const rateLimitSchema = new mongoose.Schema({
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for user-specific rate limits
  fingerprint: { type: String, required: true },
  lastRatedAt: { type: Date, default: Date.now },
  count: { type: Number, default: 0 }
});

rateLimitSchema.index({ routeId: 1, fingerprint: 1 });
rateLimitSchema.index({ lastRatedAt: 1 });
rateLimitSchema.index({ userId: 1 });

// Create indexes for better performance
routeSchema.index({ 'stops.coordinates': '2dsphere' });
reportSchema.index({ location: '2dsphere' });
reportSchema.index({ routeId: 1, createdAt: -1 });
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ sacco: 1 });
reportSchema.index({ deviceFingerprint: 1, createdAt: -1 });
scoreSchema.index({ routeId: 1 });
scoreSchema.index({ userId: 1 });

// Traffic cache for congestion info per route
const trafficCacheSchema = new mongoose.Schema({
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  congestionIndex: { type: Number, default: 0 }, // 0-100
  trafficFactor: { type: Number, default: 1.0 }, // multiplier ~ [0.8, 1.6]
  provider: { type: String, default: 'none' },
  meta: { type: Object },
  updatedAt: { type: Date, default: Date.now }
});
trafficCacheSchema.index({ routeId: 1 }, { unique: true });

// Profile Photo Schema for storing uploaded profile images - TEMPORARILY DISABLED
// const profilePhotoSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   filename: { type: String, required: true },
//   originalName: { type: String, required: true },
//   mimetype: { type: String, required: true },
//   size: { type: Number, required: true },
//   url: { type: String, required: true }, // URL to access the image
//   isActive: { type: Boolean, default: true }, // For soft deletion
//   uploadedAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// profilePhotoSchema.index({ userId: 1, isActive: 1 });
// profilePhotoSchema.index({ uploadedAt: -1 });

// Create models
const User = mongoose.model('User', userSchema);
const Route = mongoose.model('Route', routeSchema);
const Report = mongoose.model('Report', reportSchema);
const Score = mongoose.model('Score', scoreSchema);
const RateLimit = mongoose.model('RateLimit', rateLimitSchema);
const TrafficCache = mongoose.model('TrafficCache', trafficCacheSchema);
// const ProfilePhoto = mongoose.model('ProfilePhoto', profilePhotoSchema);

// Payment and Subscription Models
const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planType: { 
    type: String, 
    enum: ['free', 'premium', 'sacco', 'enterprise'], 
    default: 'free' 
  },
  status: { 
    type: String, 
    enum: ['active', 'cancelled', 'expired', 'pending'], 
    default: 'active' 
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  features: {
    advancedAnalytics: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    unlimitedReports: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'KES' },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['stripe', 'mpesa', 'airtel_money', 'bank_transfer'], 
    required: true 
  },
  stripePaymentIntentId: { type: String },
  transactionId: { type: String },
  description: { type: String },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Analytics and Monitoring Models
const analyticsEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  eventType: { 
    type: String, 
    enum: ['page_view', 'report_submitted', 'route_searched', 'payment_made', 'subscription_changed'],
    required: true 
  },
  eventData: { type: Object },
  sessionId: { type: String },
  userAgent: { type: String },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now }
})

const performanceMetricSchema = new mongoose.Schema({
  metricType: { 
    type: String, 
    enum: ['api_response_time', 'page_load_time', 'error_rate', 'user_engagement'],
    required: true 
  },
  value: { type: Number, required: true },
  endpoint: { type: String },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Object }
})

// Add indexes for performance
subscriptionSchema.index({ userId: 1 })
subscriptionSchema.index({ status: 1 })
paymentSchema.index({ userId: 1 })
paymentSchema.index({ status: 1 })
paymentSchema.index({ createdAt: -1 })
analyticsEventSchema.index({ userId: 1, timestamp: -1 })
analyticsEventSchema.index({ eventType: 1, timestamp: -1 })
performanceMetricSchema.index({ metricType: 1, timestamp: -1 })

// Create models
const Subscription = mongoose.model('Subscription', subscriptionSchema)
const Payment = mongoose.model('Payment', paymentSchema)
const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema)
const PerformanceMetric = mongoose.model('PerformanceMetric', performanceMetricSchema)

module.exports = {
  User,
  Route,
  Report,
  Score,
  RateLimit,
  TrafficCache,
  Subscription,
  Payment,
  AnalyticsEvent,
  PerformanceMetric
  // ProfilePhoto - TEMPORARILY DISABLED
};
