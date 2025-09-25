const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Route, Report, Score, RateLimit } = require('./models');

// Create Express app
const app = express();

// Trust proxy for Firebase Functions
app.set('trust proxy', true);

// JWT Secret (in production, use environment variable)
const JWT_SECRET = functions.config().jwt?.secret || process.env.JWT_SECRET;

// Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    // Try Firebase config first, then environment variable
    const mongoURI = functions.config().mongodb?.uri || process.env.MONGODB_URI;
    
    if (!mongoURI || mongoURI === 'undefined') {
      console.log('No MongoDB URI found, using mock data');
      return false;
    }

    await mongoose.connect(mongoURI);
    console.log('MongoDB Atlas connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Falling back to mock data');
    return false;
  }
};

// Initialize database connection
let isDBConnected = false;
connectDB().then(connected => {
  isDBConnected = connected;
});

// Basic middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginResourcePolicy: false // Allow cross-origin requests
}));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://smart-matwana-ke.web.app',
    'https://smart-matwana-ke.firebaseapp.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
});

// Temporary cleanup endpoint to fix database schema issues
app.post('/cleanup', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }
    
    // Clear all collections to fix schema issues
    await Promise.all([
      Route.deleteMany({}),
      Report.deleteMany({}),
      Score.deleteMany({})
    ]);
    
    console.log('Database cleaned up successfully');
    return res.json({ success: true, message: 'Database cleaned up successfully' });
  } catch (error) {
    console.error('Error cleaning up database:', error);
    return res.status(500).json({ success: false, message: 'Error cleaning up database' });
  }
});

// Routes endpoint (database-backed)
app.get('/routes', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    // First, let's seed some routes if none exist
    const routeCount = await Route.countDocuments({});
    if (routeCount === 0) {
      console.log('No routes found, seeding sample routes...');
      const sampleRoutes = [
        {
          name: 'Route 46 - CBD to Westlands',
          description: 'Route from Central Business District to Westlands',
          operator: 'Westlands Shuttle',
          routeNumber: '46',
          path: [36.8219, -1.2921, 36.8125, -1.2635],
          stops: [
            { name: 'Kencom', coordinates: [36.8219, -1.2921] },
            { name: 'Museum Hill', coordinates: [36.8125, -1.2635] },
            { name: 'Westlands', coordinates: [36.8095, -1.2659] }
          ],
          fare: 50,
          operatingHours: { start: '05:00', end: '22:00' },
          isActive: true
        },
        {
          name: 'Route 44 - CBD to Kasarani',
          description: 'Route from Central Business District to Kasarani',
          operator: 'Kasarani Express',
          routeNumber: '44',
          path: [36.8219, -1.2921, 36.8908, -1.2203],
          stops: [
            { name: 'Kencom', coordinates: [36.8219, -1.2921] },
            { name: 'Thika Road Mall', coordinates: [36.8908, -1.2203] },
            { name: 'Kasarani', coordinates: [36.8908, -1.2155] }
          ],
          fare: 80,
          operatingHours: { start: '05:30', end: '21:30' },
          isActive: true
        },
        {
          name: 'Route 58 - CBD to Embakasi',
          description: 'Route from Central Business District to Embakasi',
          operator: 'Embakasi Matatu',
          routeNumber: '58',
          path: [36.8219, -1.2921, 36.8951, -1.3197],
          stops: [
            { name: 'Kencom', coordinates: [36.8219, -1.2921] },
            { name: 'Nyayo Stadium', coordinates: [36.8317, -1.3134] },
            { name: 'Embakasi', coordinates: [36.8951, -1.3197] }
          ],
          fare: 60,
          operatingHours: { start: '05:00', end: '22:30' },
          isActive: true
        },
        {
          name: 'Route 111 - CBD to Karen',
          description: 'Route from Central Business District to Karen',
          operator: 'Karen Shuttle',
          routeNumber: '111',
          path: [36.8219, -1.2921, 36.6872, -1.3197],
          stops: [
            { name: 'Kencom', coordinates: [36.8219, -1.2921] },
            { name: 'Yaya Centre', coordinates: [36.7833, -1.2833] },
            { name: 'Karen', coordinates: [36.6872, -1.3197] }
          ],
          fare: 120,
          operatingHours: { start: '06:00', end: '21:00' },
          isActive: true
        },
        {
          name: 'Route 24 - CBD to Kibera',
          description: 'Route from Central Business District to Kibera',
          operator: 'Kibera Express',
          routeNumber: '24',
          path: [36.8219, -1.2921, 36.7833, -1.3134],
          stops: [
            { name: 'Kencom', coordinates: [36.8219, -1.2921] },
            { name: 'Railways', coordinates: [36.8281, -1.3054] },
            { name: 'Kibera', coordinates: [36.7833, -1.3134] }
          ],
          fare: 40,
          operatingHours: { start: '05:00', end: '23:00' },
          isActive: true
        }
      ];
      
      await Route.insertMany(sampleRoutes);
      console.log('Sample routes seeded successfully');
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [routes, total] = await Promise.all([
      Route.find({ isActive: true }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Route.countDocuments({ isActive: true })
    ]);

    const routeIds = routes.map((r) => r._id);
    const scores = await Score.find({ routeId: { $in: routeIds } });
    const scoreMap = new Map(scores.map((s) => [String(s.routeId), s]));

    const routesWithScores = routes.map((r) => {
      const s = scoreMap.get(String(r._id));
      return {
        ...r.toObject(),
        score: s
          ? {
              reliability: s.reliability,
              safety: s.safety,
              punctuality: s.punctuality,
              comfort: s.comfort,
              overall: s.overall,
              totalReports: s.totalReports,
              lastCalculated: s.lastCalculated
            }
          : null
      };
    });

    console.log(`Returning ${routesWithScores.length} routes out of ${total} total`);
    return res.json({
      success: true,
      data: { routes: routesWithScores, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ success: false, message: 'Error fetching routes', error: error.message });
  }
});

// Rate a route (live rider rating)
app.post('/routes/:routeId/rate', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { routeId } = req.params;
    const { reliability, safety, punctuality, comfort, overall } = req.body || {};

    // Basic validation: at least one score and all provided scores within 0-5
    const provided = { reliability, safety, punctuality, comfort, overall };
    const keys = Object.keys(provided).filter(k => provided[k] !== undefined);
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one score is required' });
    }
    for (const k of keys) {
      const v = Number(provided[k]);
      if (Number.isNaN(v) || v < 0 || v > 5) {
        return res.status(400).json({ success: false, message: `Invalid value for ${k}. Expected 0-5` });
      }
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    // Device fingerprint (IP + User-Agent)
    const fingerprint = `${req.ip || 'unknown'}-${req.get('User-Agent') || 'unknown'}`.slice(0, 150);
    const now = Date.now();
    const windowMs = 2 * 60 * 1000; // 2 minutes
    const maxPerWindow = 2; // allow up to 2 ratings per window per device per route

    // Upsert rate limit doc and decide if allowed
    let rl = await RateLimit.findOne({ routeId, fingerprint });
    if (!rl) {
      rl = await RateLimit.create({ routeId, fingerprint, lastRatedAt: new Date(now), count: 1 });
    } else {
      const since = now - new Date(rl.lastRatedAt).getTime();
      if (since <= windowMs) {
        if ((rl.count || 0) >= maxPerWindow) {
          const retryAfter = Math.ceil((windowMs - since) / 1000);
          return res.status(429).json({ success: false, message: `Too many ratings. Try again in ${retryAfter}s` });
        }
        rl.count += 1;
      } else {
        rl.count = 1;
        rl.lastRatedAt = new Date(now);
      }
      await rl.save();
    }

    let scoreDoc = await Score.findOne({ routeId });
    if (!scoreDoc) {
      // Create a new score document using provided values; default missing subs to provided overall or mid-scale 3
      const r = reliability ?? overall ?? 3;
      const s = safety ?? overall ?? 3;
      const p = punctuality ?? overall ?? 3;
      const c = comfort ?? overall ?? 3;
      const o = overall ?? Math.max(0, Math.min(5, (r + s + p + c) / 4));
      scoreDoc = await Score.create({
        routeId,
        reliability: r,
        safety: s,
        punctuality: p,
        comfort: c,
        overall: o,
        totalReports: 1,
        lastCalculated: new Date()
      });
      return res.status(201).json({ success: true, data: { score: scoreDoc }, message: 'Rating submitted' });
    }

    // Weighted running average update
    const n = scoreDoc.totalReports || 0;
    const nextN = n + 1;
    const avg = (oldV, newV) => {
      if (newV === undefined) return oldV;
      return ((oldV * n) + Number(newV)) / nextN;
    };

    scoreDoc.reliability = avg(scoreDoc.reliability, reliability ?? overall);
    scoreDoc.safety = avg(scoreDoc.safety, safety ?? overall);
    scoreDoc.punctuality = avg(scoreDoc.punctuality, punctuality ?? overall);
    scoreDoc.comfort = avg(scoreDoc.comfort, comfort ?? overall);
    // Recompute overall: if provided overall, average it; else mean of subs
    const newOverall = overall !== undefined 
      ? ((scoreDoc.overall * n) + Number(overall)) / nextN
      : (scoreDoc.reliability + scoreDoc.safety + scoreDoc.punctuality + scoreDoc.comfort) / 4;
    scoreDoc.overall = Math.max(0, Math.min(5, newOverall));
    scoreDoc.totalReports = nextN;
    scoreDoc.lastCalculated = new Date();
    scoreDoc.updatedAt = new Date();

    await scoreDoc.save();

    return res.json({ success: true, data: { score: scoreDoc }, message: 'Rating submitted' });
  } catch (error) {
    console.error('Rate route error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit rating' });
  }
});

// Scores endpoint (database-backed)
app.get('/scores', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [scores, total] = await Promise.all([
      Score.find({}).sort({ lastCalculated: -1 }).skip(skip).limit(limit),
      Score.countDocuments({})
    ]);

    return res.json({ success: true, data: { scores, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (error) {
    console.error('Error fetching scores:', error);
    return res.status(500).json({ success: false, message: 'Error fetching scores' });
  }
});

// Score by route endpoint (database-backed)
app.get('/scores/route/:routeId', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }
    const { routeId } = req.params;
    const score = await Score.findOne({ routeId }).lean();
    
    if (!score) {
      return res.status(404).json({ success: false, message: 'Score not found for this route' });
    }

    return res.json({ success: true, data: { score } });
  } catch (error) {
    console.error('Error fetching route score:', error);
    return res.status(500).json({ success: false, message: 'Error fetching route score' });
  }
});

// Top routes endpoint (database-backed)
app.get('/scores/top/:limit', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }
    const limit = Math.min(Number(req.params.limit) || 10, 50); // Cap at 50
    const scores = await Score.find({}).sort({ overall: -1 }).limit(limit).lean();
    
    return res.json({ success: true, data: { scores } });
  } catch (error) {
    console.error('Error fetching top routes:', error);
    return res.status(500).json({ success: false, message: 'Error fetching top routes' });
  }
});

// Worst routes endpoint (database-backed)
app.get('/scores/worst/:limit', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }
    const limit = Math.min(Number(req.params.limit) || 10, 50); // Cap at 50
    const scores = await Score.find({}).sort({ overall: 1 }).limit(limit).lean();
    
    return res.json({ success: true, data: { scores } });
  } catch (error) {
    console.error('Error fetching worst routes:', error);
    return res.status(500).json({ success: false, message: 'Error fetching worst routes' });
  }
});

// Reports endpoint (database-backed)
app.post('/reports', async (req, res) => {
  try {
    const { routeId, reportType, description, severity, location, isAnonymous, sacco, direction, fare } = req.body;
    if (!routeId || !reportType) {
      return res.status(400).json({ success: false, message: 'Route ID and report type are required' });
    }
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }
    
    // Generate device fingerprint from IP and user agent
    const deviceFingerprint = `${req.ip || 'unknown'}-${req.get('User-Agent') || 'unknown'}`.slice(0, 150);
    
    const report = await Report.create({
      routeId,
      reportType,
      description: description || 'No description provided',
      severity: severity || 'medium',
      location: {
        type: 'Point',
        coordinates: location?.coordinates || [36.8219, -1.2921] // [longitude, latitude]
      },
      status: 'pending',
      isAnonymous: Boolean(isAnonymous),
      // Optional analytics metadata
      sacco: sacco || undefined,
      direction: direction || undefined,
      fare: typeof fare === 'number' ? fare : undefined,
      deviceFingerprint
    });
    return res.status(201).json({ success: true, data: report, message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error creating report:', error);
    return res.status(500).json({ success: false, message: 'Error creating report' });
  }
});

// Analytics endpoint (database-backed)
app.get('/analytics/summary', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }
    const [totalRoutes, totalReports, totalUsers, avg] = await Promise.all([
      Route.countDocuments({}),
      Report.countDocuments({}),
      User.countDocuments({}),
      Score.aggregate([{ $group: { _id: null, avgOverall: { $avg: '$overall' } } }])
    ]);
    return res.json({
      success: true,
      data: {
        totalRoutes,
        totalReports,
        totalUsers,
        averageScore: avg[0]?.avgOverall || 0,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ success: false, message: 'Error fetching analytics' });
  }
});

// Auth middleware and profile endpoint (for frontend current user)
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

const requireRoles = (roles = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const dbUser = await User.findById(req.user.userId).lean();
      if (!dbUser) return res.status(401).json({ success: false, message: 'Unauthorized' });
      if (roles.length > 0 && !roles.includes(dbUser.role)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      req.user.role = dbUser.role;
      return next();
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  };
};

app.get('/auth/profile', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) return res.status(503).json({ success: false, message: 'Database unavailable' });
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ 
      success: true, 
      data: { 
        user: { 
          _id: user._id, 
          email: user.email, 
          displayName: user.displayName, 
          role: user.role,
          requestedRole: user.requestedRole,
          status: user.status,
          organization: user.organization,
          permissions: user.permissions,
          approvedBy: user.approvedBy,
          approvedAt: user.approvedAt,
          rejectionReason: user.rejectionReason,
          savedRoutes: user.savedRoutes,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        } 
      } 
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Authentication endpoints
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // If database is not connected, return error
    if (!isDBConnected) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again later.'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response
    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          requestedRole: user.requestedRole,
          status: user.status,
          organization: user.organization,
          permissions: user.permissions,
          approvedBy: user.approvedBy,
          approvedAt: user.approvedAt,
          rejectionReason: user.rejectionReason,
          savedRoutes: user.savedRoutes,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and display name are required'
      });
    }

    // Validate role and determine approval requirements
    const validRoles = ['user', 'sacco', 'authority', 'moderator', 'admin'];
    const requestedRole = role && validRoles.includes(role) ? role : 'user';
    
    // Determine if role requires approval
    const requiresApproval = ['sacco', 'authority', 'moderator', 'admin'].includes(requestedRole);
    const finalRole = requiresApproval ? 'user' : requestedRole; // Start as 'user' if requires approval
    const userStatus = requiresApproval ? 'pending' : 'active';

    // If database is not connected, return error
    if (!isDBConnected) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again later.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      displayName: displayName.trim(),
      password: hashedPassword,
      role: finalRole,
      requestedRole: requiresApproval ? requestedRole : undefined,
      status: userStatus,
      organization: req.body.organization || undefined,
      savedRoutes: []
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.email,
        role: newUser.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Prepare response message based on approval status
    let message = 'Registration successful';
    if (requiresApproval) {
      message = `Account created successfully. Your request for ${requestedRole} role is pending admin approval. You currently have user access.`;
    }

    // Return success response (don't include password)
    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: newUser._id,
          email: newUser.email,
          displayName: newUser.displayName,
          role: newUser.role,
          requestedRole: newUser.requestedRole,
          status: newUser.status,
          organization: newUser.organization,
          savedRoutes: newUser.savedRoutes
        },
        token
      },
      message: message,
      requiresApproval: requiresApproval,
      pendingRole: requiresApproval ? requestedRole : null
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// User Profile Management
app.put('/users/:userId', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId } = req.params;
    const { displayName, email } = req.body;

    // Validate input
    if (!displayName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Display name and email are required'
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { displayName, email, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user reports
app.get('/users/:userId/reports', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId } = req.params;
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const reports = await Report.find({ userId })
      .populate('routeId', 'name routeNumber operator')
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user favorite routes
app.get('/users/:userId/favorites', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId } = req.params;
    const user = await User.findById(userId).populate('savedRoutes');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { routes: user.savedRoutes || [] }
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add favorite route
app.post('/users/:userId/favorites', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId } = req.params;
    const { routeId } = req.body;

    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: 'Route ID is required'
      });
    }

    // Check if route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Add to user's saved routes
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { savedRoutes: routeId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { success: true },
      message: 'Route added to favorites'
    });

  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove favorite route
app.delete('/users/:userId/favorites/:routeId', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId, routeId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { savedRoutes: routeId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { success: true },
      message: 'Route removed from favorites'
    });

  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user analytics
app.get('/users/:userId/analytics', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId } = req.params;

    // Get user reports
    const reports = await Report.find({ userId });
    const totalReports = reports.length;

    // Reports this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const reportsThisMonth = await Report.countDocuments({
      userId,
      createdAt: { $gte: startOfMonth }
    });

    // Get user's favorite routes count
    const user = await User.findById(userId);
    const favoriteRoutesCount = user ? (user.savedRoutes || []).length : 0;

    // Calculate average rating (mock for now)
    const averageRating = 4.2;

    // Most reported route
    const routeReports = await Report.aggregate([
      { $match: { userId } },
      { $group: { _id: '$routeId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    let mostReportedRoute = null;
    if (routeReports.length > 0) {
      const route = await Route.findById(routeReports[0]._id);
      mostReportedRoute = route ? `${route.routeNumber} - ${route.name}` : null;
    }

    res.json({
      success: true,
      data: {
        totalReports,
        reportsThisMonth,
        favoriteRoutesCount,
        averageRating,
        mostReportedRoute
      }
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dashboard & AI/ML Endpoints
app.get('/dashboard/stats', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    // Get basic stats
    const totalRoutes = await Route.countDocuments({ isActive: true });
    const activeReports = await Report.countDocuments({ 
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
    });
    
    // Calculate average fare from recent reports
    const recentReports = await Report.find({ 
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
    });
    const averageFare = recentReports.length > 0 
      ? recentReports.reduce((sum, report) => sum + (report.fare || 0), 0) / recentReports.length 
      : 50;

    // Calculate safety rating
    const safetyReports = await Report.find({ 
      reportType: 'safety',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    const safetyRating = safetyReports.length > 0 
      ? safetyReports.reduce((sum, report) => {
          const severityScore = report.severity === 'low' ? 5 : report.severity === 'medium' ? 3 : 1;
          return sum + severityScore;
        }, 0) / safetyReports.length 
      : 4.2;

    // Get user count
    const totalUsers = await User.countDocuments();

    res.json({
      success: true,
      data: {
        totalRoutes,
        activeReports,
        averageFare: Math.round(averageFare),
        safetyRating: Math.round(safetyRating * 10) / 10,
        weatherCondition: 'Partly Cloudy',
        temperature: 24,
        humidity: 65,
        windSpeed: 12,
        totalUsers,
        reportsToday: activeReports,
        incidentsToday: await Report.countDocuments({ 
          reportType: 'safety',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
        topPerformingRoute: 'Route 46 - CBD to Westlands',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Weather endpoint with real OpenWeatherMap API integration
app.get('/weather', async (req, res) => {
  try {
    // Get OpenWeatherMap API key from config
    const apiKey = functions.config().openweathermap?.api_key || process.env.OPENWEATHERMAP_API_KEY;
    
    if (!apiKey) {
      console.log('OpenWeatherMap API key not found, using mock data');
      // Fallback to mock data if API key is not configured
      const weatherData = {
        temperature: 24 + Math.floor(Math.random() * 6) - 3, // 21-27°C
        humidity: 60 + Math.floor(Math.random() * 20), // 60-80%
        windSpeed: 8 + Math.floor(Math.random() * 10), // 8-18 km/h
        condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
        description: 'Good conditions for travel (Mock Data)',
        icon: 'partly-cloudy',
        location: 'Nairobi, Kenya',
        timestamp: new Date().toISOString()
      };

      return res.json({
        success: true,
        data: weatherData
      });
    }

    // Nairobi coordinates
    const lat = -1.2921;
    const lon = 36.8219;
    
    // Fetch real weather data from OpenWeatherMap
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json().catch(() => ({}));
      console.error(`OpenWeatherMap API error: ${weatherResponse.status}`, errorData);
      
      if (weatherResponse.status === 401) {
        throw new Error(`OpenWeatherMap API key is invalid or not activated. Please check your API key. Status: ${weatherResponse.status}`);
      }
      throw new Error(`OpenWeatherMap API error: ${weatherResponse.status} - ${errorData.message || 'Unknown error'}`);
    }

    const weatherData = await weatherResponse.json();

    // Transform the data to match our expected format
    const transformedData = {
      temperature: Math.round(weatherData.main.temp),
      humidity: weatherData.main.humidity,
      windSpeed: Math.round(weatherData.wind.speed * 3.6), // Convert m/s to km/h
      condition: weatherData.weather[0].main,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      location: weatherData.name + ', ' + weatherData.sys.country,
      timestamp: new Date().toISOString(),
      feelsLike: Math.round(weatherData.main.feels_like),
      pressure: weatherData.main.pressure,
      visibility: weatherData.visibility ? Math.round(weatherData.visibility / 1000) : null, // Convert to km
      uvIndex: null, // Not available in current weather API
      sunrise: new Date(weatherData.sys.sunrise * 1000).toISOString(),
      sunset: new Date(weatherData.sys.sunset * 1000).toISOString()
    };

    res.set('Cache-Control', 'no-store, max-age=0');
    res.json({
      success: true,
      data: transformedData
    });

  } catch (error) {
    console.error('Weather data error:', error);
    
    // Fallback to mock data on error
    const fallbackData = {
      temperature: 24 + Math.floor(Math.random() * 6) - 3,
      humidity: 60 + Math.floor(Math.random() * 20),
      windSpeed: 8 + Math.floor(Math.random() * 10),
      condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
      description: 'Good conditions for travel (Fallback Data)',
      icon: 'partly-cloudy',
      location: 'Nairobi, Kenya',
      timestamp: new Date().toISOString()
    };

    res.set('Cache-Control', 'no-store, max-age=0');
    res.json({
      success: true,
      data: fallbackData,
      warning: 'Using fallback data due to API error',
      error: error.message
    });
  }
});

// Route insights with AI predictions
app.get('/insights/routes', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const limit = Math.max(1, Math.min(Number(req.query.limit) || 10, 50));
    const days = Math.max(1, Math.min(Number(req.query.days) || 14, 90));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Pick routes by most reports in the period
    const topRouteIdsAgg = await Report.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$routeId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);
    const routeIds = topRouteIdsAgg.map(r => r._id);
    const routes = await Route.find({ _id: { $in: routeIds }, isActive: true });
    const insights = [];

    for (const route of routes) {
      // Get recent reports for this route
      const recentReports = await Report.find({ 
        routeId: route._id,
        createdAt: { $gte: since }
      });

      // Calculate fare insights based on actual report fares; fallback to route fare
      const fares = recentReports.map(r => r.fare).filter(f => typeof f === 'number' && f > 0);
      const avgFare = fares.length > 0 ? fares.reduce((a, b) => a + b, 0) / fares.length : (route.fare || 0);
      const fareVariance = fares.length > 1 ? Math.sqrt(fares.reduce((a, b) => a + Math.pow(b - avgFare, 2), 0) / fares.length) : 0;
      
      const farePrediction = {
        predictedFare: Math.round(avgFare),
        confidence: Math.min(0.95, 0.5 + (fares.length / 10)),
        minFare: Math.round(avgFare - fareVariance),
        maxFare: Math.round(avgFare + fareVariance),
        trend: fares.length > 3 ? (fares[fares.length - 1] > fares[0] ? 'increasing' : 'decreasing') : 'stable',
        factors: ['Reported fares', 'Time of day'],
        lastUpdated: new Date().toISOString()
      };

      // Calculate safety score
      const safetyReports = recentReports.filter(r => r.reportType === 'safety');
      const safetyScore = {
        overallScore: safetyReports.length > 0 
          ? Math.max(1, Math.min(5, 5 - (safetyReports.reduce((sum, r) => sum + (r.severity === 'high' ? 2 : r.severity === 'medium' ? 1 : 0), 0) / Math.max(1, safetyReports.length))))
          : 4.5,
        incidentScore: Math.max(1, Math.min(5, 5 - (safetyReports.length * 0.1))),
        factors: ['Safety reports in period'],
        lastUpdated: new Date().toISOString()
      };

      // Calculate crowd density using crowding reports
      const currentHour = new Date().getHours();
      const isPeakTime = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
      const crowdReports = recentReports.filter(r => r.reportType === 'crowding');
      const crowdLevel = crowdReports.length > 0
        ? (crowdReports.filter(r => r.severity === 'high').length / crowdReports.length) > 0.5 ? 'high'
          : (crowdReports.filter(r => r.severity === 'medium').length / crowdReports.length) > 0.5 ? 'medium'
          : 'low'
        : (isPeakTime ? 'high' : (currentHour >= 10 && currentHour <= 16 ? 'medium' : 'low'));
      
      const crowdDensity = {
        level: crowdLevel,
        percentage: crowdLevel === 'high' ? 85 : crowdLevel === 'medium' ? 60 : 30,
        predictedPeak: isPeakTime ? 'Now' : '7:00 AM - 9:00 AM',
        recommendedTime: crowdLevel === 'high' ? '10:00 AM - 4:00 PM' : 'Now',
        lastUpdated: new Date().toISOString()
      };

      // Estimate travel time from stop count and peak factor (fallback)
      const stopCount = Math.max(1, (route.stops || []).length - 1);
      const baseTime = stopCount * 3; // 3 minutes per segment baseline
      const peakFactor = isPeakTime ? 1.4 : 1.0;
      const travelTime = Math.round(baseTime * peakFactor);

      insights.push({
        routeId: route._id,
        routeName: route.name,
        farePrediction,
        safetyScore,
        crowdDensity,
        travelTime,
        recommendedTime: crowdLevel === 'high' ? '10:00 AM - 4:00 PM' : 'Now',
        alternativeRoutes: [],
        weatherImpact: 'N/A',
        lastUpdated: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: { insights }
    });

  } catch (error) {
    console.error('Route insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Fare prediction for specific route
app.get('/predictions/fare/:routeId', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { routeId } = req.params;
    const { timeOfDay } = req.query;

    // Get route
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    // Get historical fare data
    const recentReports = await Report.find({ 
      routeId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const fares = recentReports.map(r => r.fare).filter(f => f > 0);
    const avgFare = fares.length > 0 ? fares.reduce((a, b) => a + b, 0) / fares.length : route.fare;
    
    // Apply time-based multiplier
    const currentHour = new Date().getHours();
    let timeMultiplier = 1.0;
    if (timeOfDay === 'morning' || (currentHour >= 7 && currentHour <= 9)) {
      timeMultiplier = 1.2; // Peak morning
    } else if (timeOfDay === 'evening' || (currentHour >= 17 && currentHour <= 19)) {
      timeMultiplier = 1.15; // Peak evening
    } else if (timeOfDay === 'night' || currentHour >= 22 || currentHour <= 5) {
      timeMultiplier = 1.3; // Night premium
    }

    const predictedFare = Math.round(avgFare * timeMultiplier);
    const variance = fares.length > 1 ? Math.sqrt(fares.reduce((a, b) => a + Math.pow(b - avgFare, 2), 0) / fares.length) : 5;

    res.json({
      success: true,
      data: {
        predictedFare,
        confidence: Math.min(0.95, 0.6 + (fares.length / 20)),
        minFare: Math.round(predictedFare - variance),
        maxFare: Math.round(predictedFare + variance),
        trend: fares.length > 3 ? (fares[fares.length - 1] > fares[0] ? 'increasing' : 'decreasing') : 'stable',
        factors: ['Historical data', 'Time of day', 'Weather conditions', 'Peak hours'],
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Fare prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Safety score for specific route
app.get('/predictions/safety/:routeId', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { routeId } = req.params;

    // Get safety-related reports
    const safetyReports = await Report.find({ 
      routeId,
      reportType: 'safety',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Calculate safety scores
    const incidentScore = safetyReports.length > 0 
      ? Math.max(1, 5 - (safetyReports.length * 0.2))
      : 4.5;

    const severityScore = safetyReports.length > 0
      ? safetyReports.reduce((sum, r) => {
          const severity = r.severity === 'low' ? 1 : r.severity === 'medium' ? 2 : 3;
          return sum + severity;
        }, 0) / safetyReports.length
      : 1;

    const overallScore = Math.max(1, Math.min(5, 5 - (severityScore * 0.5)));

    res.json({
      success: true,
      data: {
        overallScore: Math.round(overallScore * 10) / 10,
        reliabilityScore: 4.0 + Math.random() * 0.8,
        incidentScore: Math.round(incidentScore * 10) / 10,
        driverScore: 4.0 + Math.random() * 0.6,
        vehicleScore: 3.8 + Math.random() * 0.8,
        factors: ['Incident reports', 'User feedback', 'Route history', 'Time patterns'],
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Safety score error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Crowd density prediction
app.get('/predictions/crowd/:routeId', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { routeId } = req.params;
    const { timeOfDay } = req.query;

    const currentHour = new Date().getHours();
    const isPeakTime = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
    
    let level = 'low';
    let percentage = 30;
    let recommendedTime = 'Now';

    if (isPeakTime || timeOfDay === 'morning' || timeOfDay === 'evening') {
      level = 'high';
      percentage = 80 + Math.floor(Math.random() * 20);
      recommendedTime = '10:00 AM - 4:00 PM';
    } else if (currentHour >= 10 && currentHour <= 16) {
      level = 'medium';
      percentage = 50 + Math.floor(Math.random() * 30);
      recommendedTime = 'Now';
    } else {
      level = 'low';
      percentage = 20 + Math.floor(Math.random() * 30);
      recommendedTime = 'Now';
    }

    res.json({
      success: true,
      data: {
        level,
        percentage,
        predictedPeak: isPeakTime ? 'Now' : '7:00 AM - 9:00 AM',
        recommendedTime,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Crowd density error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== ANALYTICS ENDPOINTS ====================

// Route efficiency scoring (prefers real Score docs; falls back to Reports)
app.get('/analytics/efficiency/:routeId', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { routeId } = req.params;
    const route = await Route.findById(routeId);
    
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    // Prefer Score doc
    const score = await Score.findOne({ routeId }).lean();
    let reliabilityScore = 0, safetyScore = 0, punctualityScore = 0, comfortScore = 0;
    if (score) {
      const toPct = (v) => Math.max(0, Math.min(100, (Number(v) || 0) * 20));
      reliabilityScore = toPct(score.reliability);
      safetyScore = toPct(score.safety);
      punctualityScore = toPct(score.punctuality);
      comfortScore = toPct(score.comfort);
    } else {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const reports = await Report.find({ routeId, createdAt: { $gte: thirtyDaysAgo } });
      const count = reports.length || 1;
      const onTimeReports = reports.filter(r => r.reportType === 'reliability' && r.severity === 'low').length;
      reliabilityScore = Math.round((onTimeReports / count) * 100);
      const safetyIncidents = reports.filter(r => r.reportType === 'safety');
      const safetyPenalty = safetyIncidents.reduce((sum, r) => sum + (r.severity === 'high' ? 30 : r.severity === 'medium' ? 15 : 5), 0);
      safetyScore = Math.max(0, 100 - Math.round(safetyPenalty / count));
      const punctualityIssues = reports.filter(r => r.reportType === 'delay');
      const punctualityPenalty = Math.min(100, punctualityIssues.length * 10);
      punctualityScore = Math.max(0, 100 - punctualityPenalty);
      const comfortReports = reports.filter(r => r.reportType === 'comfort');
      const comfortPenalty = comfortReports.reduce((sum, r) => sum + (r.severity === 'high' ? 25 : r.severity === 'medium' ? 12 : 5), 0);
      comfortScore = Math.max(0, 100 - Math.round(comfortPenalty / count));
    }

    const avgFare = route.fare || 50;
    const costScore = Math.max(0, Math.min(100, 100 - Math.max(0, avgFare - 30) * 2));
    const operatingHours = route.operatingHours ? (parseInt(route.operatingHours.end.split(':')[0]) - parseInt(route.operatingHours.start.split(':')[0])) : 12;
    const frequencyScore = Math.max(0, Math.min(100, operatingHours * 2));

    const weights = { reliability: 0.25, safety: 0.25, comfort: 0.15, cost: 0.10, frequency: 0.05, punctuality: 0.20 };
    const efficiencyScore =
      (reliabilityScore * weights.reliability) +
      (safetyScore * weights.safety) +
      (comfortScore * weights.comfort) +
      (costScore * weights.cost) +
      (frequencyScore * weights.frequency) +
      (punctualityScore * weights.punctuality);

    const recommendations = [];
    if (reliabilityScore < 70) recommendations.push('Improve on-time performance through better scheduling');
    if (safetyScore < 80) recommendations.push('Address safety concerns and improve driver training');
    if (comfortScore < 70) recommendations.push('Upgrade vehicles to improve passenger comfort');
    if (costScore < 60) recommendations.push('Review fare structure for affordability');
    if (frequencyScore < 50) recommendations.push('Increase service frequency during peak hours');

    res.json({
      success: true,
      data: {
        routeId,
        routeName: route.name,
        efficiencyScore: Math.round(efficiencyScore),
        factors: {
          reliability: Math.round(reliabilityScore),
          safety: Math.round(safetyScore),
          comfort: Math.round(comfortScore),
          cost: Math.round(costScore),
          frequency: Math.round(frequencyScore),
          punctuality: Math.round(punctualityScore)
        },
        recommendations,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Route efficiency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate route efficiency'
    });
  }
});

// Travel time prediction
app.post('/analytics/travel-time/predict', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { routeId, fromStop, toStop, timeOfDay } = req.body;
    
    if (!routeId || !fromStop || !toStop) {
      return res.status(400).json({
        success: false,
        message: 'Route ID, from stop, and to stop are required'
      });
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    // Calculate base travel time (simplified)
    const fromIndex = route.stops.findIndex(s => s.name === fromStop);
    const toIndex = route.stops.findIndex(s => s.name === toStop);
    const stopCount = toIndex - fromIndex;
    const baseTime = Math.max(5, stopCount * 3);

    // Apply time-of-day multiplier
    let timeMultiplier = 1.0;
    if (timeOfDay) {
      const hour = parseInt(timeOfDay.split(':')[0]);
      if (hour >= 7 && hour <= 9) timeMultiplier = 1.3; // Morning rush
      if (hour >= 17 && hour <= 19) timeMultiplier = 1.4; // Evening rush
      if (hour >= 22 || hour <= 5) timeMultiplier = 0.8; // Night time
    }

    const predictedTime = Math.round(baseTime * timeMultiplier);
    const confidence = 75; // Default confidence

    res.json({
      success: true,
      data: {
        routeId,
        fromStop,
        toStop,
        predictedTime,
        confidence,
        factors: {
          timeOfDay: timeMultiplier,
          dayOfWeek: 1.0,
          weather: 1.1,
          traffic: timeMultiplier,
          historical: 1.0
        },
        alternativeTimes: {
          optimistic: Math.round(predictedTime * 0.8),
          realistic: predictedTime,
          pessimistic: Math.round(predictedTime * 1.3)
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Travel time prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict travel time'
    });
  }
});

// Alternative routes
app.post('/analytics/routes/alternatives', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { fromStop, toStop, maxTime, maxCost } = req.body;
    
    if (!fromStop || !toStop) {
      return res.status(400).json({
        success: false,
        message: 'From stop and to stop are required'
      });
    }

    // Find routes that serve both stops
    const routes = await Route.find({
      'stops.name': { $in: [fromStop, toStop] },
      isActive: true
    });

    const alternatives = [];

    for (const route of routes) {
      const fromIndex = route.stops.findIndex(s => s.name === fromStop);
      const toIndex = route.stops.findIndex(s => s.name === toStop);

      if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) continue;

      const travelTime = Math.max(5, (toIndex - fromIndex) * 3);
      const cost = route.fare || 50;

      if (maxTime && travelTime > maxTime) continue;
      if (maxCost && cost > maxCost) continue;

      // Calculate efficiency score (simplified)
      const efficiency = 70 + Math.random() * 20; // Mock efficiency

      const reasons = [];
      if (efficiency > 80) reasons.push('Highly efficient route');
      if (travelTime < 20) reasons.push('Fast travel time');
      if (cost < 40) reasons.push('Affordable fare');

      alternatives.push({
        routeId: route._id.toString(),
        routeName: route.name,
        totalTime: travelTime,
        totalCost: cost,
        efficiency: Math.round(efficiency),
        reasons,
        stops: route.stops.slice(fromIndex, toIndex + 1).map(s => s.name)
      });
    }

    // Sort by efficiency
    alternatives.sort((a, b) => b.efficiency - a.efficiency);

    res.json({
      success: true,
      data: {
        alternatives,
        count: alternatives.length
      }
    });

  } catch (error) {
    console.error('Alternative routes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find alternative routes'
    });
  }
});

// Trend analysis
app.get('/analytics/trends/:routeId', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { routeId } = req.params;
    const { period = 'weekly' } = req.query;
    
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Period must be daily, weekly, or monthly'
      });
    }

    const now = new Date();
    let startDate;
    switch (period) {
      case 'daily': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case 'weekly': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'monthly': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    }

    const previousStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));

    const currentReports = await Report.find({
      routeId: routeId,
      createdAt: { $gte: startDate, $lt: now }
    });

    const previousReports = await Report.find({
      routeId: routeId,
      createdAt: { $gte: previousStart, $lt: startDate }
    });

    const currentRidership = currentReports.length;
    const previousRidership = previousReports.length;
    const ridershipChange = previousRidership > 0 
      ? ((currentRidership - previousRidership) / previousRidership) * 100 
      : 0;

    const currentSafety = currentReports.filter(r => r.reportType === 'safety').length;
    const previousSafety = previousReports.filter(r => r.reportType === 'safety').length;
    const safetyChange = previousSafety > 0 
      ? ((currentSafety - previousSafety) / previousSafety) * 100 
      : 0;

    const insights = [];
    if (ridershipChange > 10) insights.push('Ridership is increasing significantly');
    else if (ridershipChange < -10) insights.push('Ridership is declining, consider promotional activities');
    
    if (safetyChange < -10) insights.push('Safety incidents have decreased');
    else if (safetyChange > 10) insights.push('Safety concerns are increasing');

    res.json({
      success: true,
      data: {
        routeId,
        period,
        trends: {
          ridership: {
            current: currentRidership,
            previous: previousRidership,
            change: Math.round(ridershipChange * 100) / 100,
            trend: ridershipChange > 5 ? 'increasing' : ridershipChange < -5 ? 'decreasing' : 'stable'
          },
          efficiency: {
            current: 75,
            previous: 70,
            change: 7.14,
            trend: 'improving'
          },
          safety: {
            current: currentSafety,
            previous: previousSafety,
            change: Math.round(safetyChange * 100) / 100,
            trend: safetyChange < -10 ? 'safer' : safetyChange > 10 ? 'riskier' : 'stable'
          },
          cost: {
            current: 50,
            previous: 50,
            change: 0,
            trend: 'stable'
          }
        },
        insights,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Trend analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze trends'
    });
  }
});

// Demand forecasting
app.post('/analytics/demand/forecast', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { routeId, timeSlot } = req.body;
    
    if (!routeId || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Route ID and time slot are required'
      });
    }

    // Get historical data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const reports = await Report.find({
      routeId: routeId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Calculate predicted demand (simplified)
    const historicalDemand = Math.min(100, reports.length * 2);
    const predictedDemand = Math.round(historicalDemand * 1.1); // 10% increase
    const confidence = Math.min(95, 60 + (reports.length * 1.5));

    const recommendations = [];
    if (predictedDemand > 80) recommendations.push('Consider increasing frequency during this time');
    else if (predictedDemand < 30) recommendations.push('Low demand period, consider reducing frequency');

    res.json({
      success: true,
      data: {
        routeId,
        timeSlot,
        predictedDemand,
        confidence,
        factors: {
          historical: historicalDemand,
          weather: 1.0,
          events: 1.0,
          seasonality: 1.1
        },
        recommendations,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Demand forecasting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to forecast demand'
    });
  }
});

// User recommendations
app.get('/analytics/recommendations/:userId', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId } = req.params;
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 10, 50));
    
    // Build recommendations from top Score docs
    const scores = await Score.find({}).sort({ overall: -1 }).limit(limit).lean();
    const routeIds = scores.map(s => s.routeId);
    const routes = await Route.find({ _id: { $in: routeIds }, isActive: true }).lean();
    const recs = scores.map((s) => {
      const r = routes.find(rt => String(rt._id) === String(s.routeId));
      const reason = s.overall >= 4.5 ? 'Top-rated route overall' : s.safety >= 4.2 ? 'High safety rating' : 'Good performance';
      const type = s.overall >= 4.5 ? 'efficiency' : (s.safety >= 4.2 ? 'safety' : 'convenience');
      const score100 = Math.round(Math.min(100, Math.max(0, s.overall * 20)));
      return {
        routeId: String(s.routeId),
        routeName: r ? r.name : `Route ${String(s.routeId)}`,
        reason,
        score: score100,
        type
      };
    });

    res.json({
      success: true,
      data: {
        userId,
        recommendations: recs,
        preferences: { efficiency: 0.35, safety: 0.3, cost: 0.2, convenience: 0.15 },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('User recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations'
    });
  }
});

// ==================== STAKEHOLDER APIS ====================

// SACCO Dashboard APIs
app.get('/sacco/dashboard', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    // Active routes
    const routes = await Route.find({ isActive: true }).lean();
    const routeIds = routes.map(r => r._id);
    const scores = await Score.find({ routeId: { $in: routeIds } }).lean();
    const scoreMap = new Map(scores.map(s => [String(s.routeId), s]));

    // Route performance derived from existing data only
    const routePerformance = routes.map(route => {
      const s = scoreMap.get(String(route._id));
      const efficiencyScore = s ? Math.round(Math.min(100, Math.max(0, (s.overall || 0) * 20))) : null;
      const onTimePercentage = s ? Math.round(Math.min(100, Math.max(0, (s.punctuality || 0) * 20))) : null;
      const safetyScore = s ? Math.round(Math.min(100, Math.max(0, (s.safety || 0) * 20))) : null;
      return {
        routeId: route._id,
        routeName: route.name,
        routeNumber: route.routeNumber,
        efficiencyScore,
        onTimePercentage,
        safetyScore,
        fare: route.fare || null,
        operatingHours: route.operatingHours || null
      };
    });

    // Estimate revenue per route for last 7 days based on unique devices * fare
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deviceAgg = await Report.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { routeId: '$routeId', device: '$deviceFingerprint' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.routeId', uniqueDevices: { $sum: 1 } } }
    ]);
    const uniqueDevicesByRoute = new Map(deviceAgg.map(d => [String(d._id), d.uniqueDevices]));

    const routePerformanceWithRevenue = routePerformance.map(rp => {
      const uniques = uniqueDevicesByRoute.get(String(rp.routeId)) || 0;
      const fare = routes.find(rt => String(rt._id) === String(rp.routeId))?.fare || 0;
      const revenue7d = Math.round(uniques * fare);
      return { ...rp, revenue7d };
    });

    // Drivers are not tracked yet – return empty list. Client should handle gracefully.
    const driverPerformance = [];

    // Customer feedback from recent reports (use description and type)
    const recentReports = await Report.find({ createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const routeById = new Map(routes.map(r => [String(r._id), r]));
    const customerFeedback = recentReports.map(r => ({
      id: String(r._id),
      routeId: String(r.routeId),
      routeName: routeById.get(String(r.routeId))?.name || 'Unknown Route',
      category: r.reportType,
      comment: r.description || '',
      severity: r.severity,
      createdAt: r.createdAt
    }));

    // Fleet status is not modeled; provide route-level aggregates only
    const fleetStatus = {
      totalRoutes: routes.length,
      activeRoutes: routes.length,
      maintenanceDue: 0,
      utilizationRate: null
    };

    res.json({
      success: true,
      data: { routePerformance: routePerformanceWithRevenue, driverPerformance, customerFeedback, fleetStatus }
    });

  } catch (error) {
    console.error('SACCO dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to load SACCO dashboard data' });
  }
});

// Authority Dashboard APIs
app.get('/authority/dashboard', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    // Base data
    const routes = await Route.find({ isActive: true }).lean();
    const routeIds = routes.map(r => r._id);
    const scores = await Score.find({ routeId: { $in: routeIds } }).lean();
    const scoreMap = new Map(scores.map(s => [String(s.routeId), s]));

    // Compliance-like summary per route based on available data only
    const complianceData = routes.map((r) => {
      const s = scoreMap.get(String(r._id));
      const safetyScore = s ? Math.round(Math.min(100, Math.max(0, (s.safety || 0) * 20))) : null;
      return {
        routeId: String(r._id),
        routeName: r.name,
        safetyScore,
        licenseStatus: 'unknown',
        status: safetyScore == null ? 'unknown' : (safetyScore >= 85 ? 'compliant' : safetyScore >= 70 ? 'warning' : 'attention'),
        lastInspection: null,
        violations: null
      };
    });

    // Safety incidents from Reports
    const thirtyDays = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const safetyReports = await Report.find({ reportType: 'safety', createdAt: { $gte: thirtyDays } })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const routeById = new Map(routes.map(r => [String(r._id), r]));
    const safetyIncidents = safetyReports.map((rep) => ({
      id: String(rep._id),
      routeId: String(rep.routeId),
      routeName: routeById.get(String(rep.routeId))?.name || 'Unknown Route',
      type: 'safety',
      severity: rep.severity,
      description: rep.description || '',
      location: rep.location,
      reportedAt: rep.createdAt,
      status: rep.status
    }));

    // System metrics from live counts
    const [totalUsers, activeReports, totalRoutes] = await Promise.all([
      User.countDocuments({}),
      Report.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Route.countDocuments({ isActive: true })
    ]);
    const avgOverall = scores.length > 0 ? (scores.reduce((a, s) => a + (Number(s.overall) || 0), 0) / scores.length) : 0;
    const systemMetrics = {
      totalUsers,
      activeReports,
      totalRoutes,
      averageScore: Math.round(avgOverall * 10) / 10,
      lastUpdated: new Date().toISOString()
    };

    // No audit log model yet
    const auditLogs = [];

    res.json({ success: true, data: { complianceData, safetyIncidents, systemMetrics, auditLogs } });

  } catch (error) {
    console.error('Authority dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to load authority dashboard data' });
  }
});

// ==================== ADMIN MANAGEMENT ENDPOINTS ====================

// Get all users for admin management
app.get('/admin/users', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Approve user role
app.post('/admin/users/:userId/approve', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.requestedRole) {
      return res.status(400).json({ success: false, message: 'No role request to approve' });
    }

    // Update user role and status
    user.role = user.requestedRole;
    user.status = 'active';
    user.requestedRole = undefined;
    user.approvedBy = req.user.userId;
    user.approvedAt = new Date();
    user.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'User role approved successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
          organization: user.organization,
          approvedAt: user.approvedAt
        }
      }
    });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve user role'
    });
  }
});

// Reject user role
app.post('/admin/users/:userId/reject', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user status
    user.status = 'rejected';
    user.rejectionReason = reason;
    user.requestedRole = undefined;
    user.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'User role request rejected',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
          rejectionReason: user.rejectionReason
        }
      }
    });

  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject user role'
    });
  }
});

// Update user role (admin only)
app.put('/admin/users/:userId/role', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { userId } = req.params;
    const { role, organization } = req.body;

    const validRoles = ['user', 'sacco', 'authority', 'moderator', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user role
    user.role = role;
    user.status = 'active';
    user.organization = organization || user.organization;
    user.approvedBy = req.user.userId;
    user.approvedAt = new Date();
    user.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
          organization: user.organization,
          approvedAt: user.approvedAt
        }
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

// Update a route (admin only) - supports updating stops and basic fields
app.put('/routes/:routeId', authMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { routeId } = req.params;
    const update = {};

    if (Array.isArray(req.body?.stops)) {
      const sanitizedStops = req.body.stops
        .filter(s => s && typeof s.name === 'string')
        .map(s => {
          const coords = Array.isArray(s.coordinates) ? s.coordinates : [];
          const lng = Number(coords[0]);
          const lat = Number(coords[1]);
          return { name: s.name.trim(), coordinates: [isNaN(lng) ? 0 : lng, isNaN(lat) ? 0 : lat] };
        });
      update.stops = sanitizedStops;
    }

    if (typeof req.body?.name === 'string') update.name = req.body.name.trim();
    if (typeof req.body?.description === 'string') update.description = req.body.description.trim();
    if (typeof req.body?.fare === 'number') update.fare = req.body.fare;
    if (req.body?.operatingHours && req.body.operatingHours.start && req.body.operatingHours.end) {
      update.operatingHours = { start: String(req.body.operatingHours.start), end: String(req.body.operatingHours.end) };
    }
    if (typeof req.body?.status === 'string') update.status = req.body.status;

    update.updatedAt = new Date();

    const updated = await Route.findByIdAndUpdate(routeId, update, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Route not found' });
    return res.json({ success: true, data: updated, message: 'Route updated' });
  } catch (error) {
    console.error('Update route error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update route' });
  }
});

// Admin: create user
app.post('/admin/users', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) return res.status(503).json({ success: false, message: 'Database unavailable' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });

    const { email, displayName, password, role = 'user', organization } = req.body || {};
    if (!email || !displayName || !password) {
      return res.status(400).json({ success: false, message: 'email, displayName and password are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, message: 'User with this email already exists' });

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const validRoles = ['user', 'sacco', 'authority', 'moderator', 'admin'];
    const finalRole = validRoles.includes(role) ? role : 'user';

    const created = await User.create({
      email: email.toLowerCase(),
      displayName: displayName.trim(),
      password: hashedPassword,
      role: finalRole,
      status: 'active',
      organization: organization || undefined,
      savedRoutes: []
    });

    return res.status(201).json({ success: true, data: { user: { _id: created._id, email: created.email, displayName: created.displayName, role: created.role, status: created.status, organization: created.organization, createdAt: created.createdAt } }, message: 'User created' });
  } catch (error) {
    console.error('Admin create user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// Admin: update user details
app.put('/admin/users/:userId', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) return res.status(503).json({ success: false, message: 'Database unavailable' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    const { userId } = req.params;
    const { displayName, email, role, status, organization } = req.body || {};

    const update = {};
    if (displayName) update.displayName = displayName;
    if (email) update.email = email.toLowerCase();
    if (organization !== undefined) update.organization = organization;
    if (status && ['active','pending','suspended','rejected'].includes(status)) update.status = status;
    if (role && ['user','sacco','authority','moderator','admin'].includes(role)) update.role = role;
    update.updatedAt = new Date();

    const updated = await User.findByIdAndUpdate(userId, update, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: { user: updated }, message: 'User updated' });
  } catch (error) {
    console.error('Admin update user error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Data export endpoints
app.get('/export/compliance', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { format = 'csv' } = req.query;
    const routes = await Route.find({ isActive: true }).lean();
    const routeIds = routes.map(r => r._id);
    const scores = await Score.find({ routeId: { $in: routeIds } }).lean();
    const scoreMap = new Map(scores.map(s => [String(s.routeId), s]));

    const rows = routes.map(r => {
      const s = scoreMap.get(String(r._id));
      const safetyScore = s ? Math.round(Math.min(100, Math.max(0, (s.safety || 0) * 20))) : '';
      const status = safetyScore === '' ? 'unknown' : (safetyScore >= 85 ? 'compliant' : safetyScore >= 70 ? 'warning' : 'attention');
      return {
        routeId: String(r._id),
        routeName: r.name,
        routeNumber: r.routeNumber || '',
        safetyScore,
        status
      };
    });

    const headers = Object.keys(rows[0] || { routeId: '', routeName: '', safetyScore: '', status: '' });
    const csv = [headers.join(',')]
      .concat(rows.map(row => headers.map(h => {
        const v = row[h] ?? '';
        const s = String(v).replace(/"/g, '""');
        const needsQuotes = /[",\n\r]/.test(s);
        return needsQuotes ? `"${s}"` : s;
      }).join(',')))
      .join('\n');

    const filename = `compliance-${Date.now()}.${format === 'xls' ? 'xls' : 'csv'}`;
    const contentType = format === 'xls' ? 'application/vnd.ms-excel' : 'text/csv; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(csv);

  } catch (error) {
    console.error('Export compliance error:', error);
    res.status(500).json({ success: false, message: 'Failed to export compliance data' });
  }
});

app.get('/export/incidents', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { days = 30, format = 'csv' } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const routes = await Route.find({ isActive: true }).lean();
    const routeById = new Map(routes.map(r => [String(r._id), r]));
    const incidents = await Report.find({ reportType: 'safety', createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(1000).lean();

    const rows = incidents.map(i => ({
      id: String(i._id),
      routeName: routeById.get(String(i.routeId))?.name || '',
      severity: i.severity,
      description: i.description || '',
      longitude: Array.isArray(i.location?.coordinates) ? i.location.coordinates[0] : '',
      latitude: Array.isArray(i.location?.coordinates) ? i.location.coordinates[1] : '',
      status: i.status,
      createdAt: new Date(i.createdAt).toISOString()
    }));

    const headers = Object.keys(rows[0] || { id: '', routeName: '', severity: '', createdAt: '' });
    const csv = [headers.join(',')]
      .concat(rows.map(row => headers.map(h => {
        const v = row[h] ?? '';
        const s = String(v).replace(/"/g, '""');
        const needsQuotes = /[",\n\r]/.test(s);
        return needsQuotes ? `"${s}"` : s;
      }).join(',')))
      .join('\n');

    const filename = `incidents-${Date.now()}.${format === 'xls' ? 'xls' : 'csv'}`;
    const contentType = format === 'xls' ? 'application/vnd.ms-excel' : 'text/csv; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(csv);

  } catch (error) {
    console.error('Export incidents error:', error);
    res.status(500).json({ success: false, message: 'Failed to export incidents data' });
  }
});

// System analytics export (one-row CSV/XLS)
app.get('/export/system', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { format = 'csv' } = req.query;
    const [totalUsers, activeReports, totalRoutes] = await Promise.all([
      User.countDocuments({}),
      Report.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Route.countDocuments({ isActive: true })
    ]);
    const scores = await Score.find({}).lean();
    const avgOverall = scores.length > 0 ? (scores.reduce((a, s) => a + (Number(s.overall) || 0), 0) / scores.length) : 0;

    const row = {
      totalUsers,
      activeReports,
      totalRoutes,
      averageScore: Math.round(avgOverall * 10) / 10,
      exportedAt: new Date().toISOString()
    };
    const headers = Object.keys(row);
    const csv = [headers.join(',')].concat([headers.map(h => String(row[h]).replace(/"/g, '""')).join(',')]).join('\n');

    const filename = `system-analytics-${Date.now()}.${format === 'xls' ? 'xls' : 'csv'}`;
    const contentType = format === 'xls' ? 'application/vnd.ms-excel' : 'text/csv; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(csv);

  } catch (error) {
    console.error('Export system error:', error);
    res.status(500).json({ success: false, message: 'Failed to export system analytics' });
  }
});

// Reports export as CSV (works for .csv or .xls filename)
app.get('/export/reports', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { days = 30, format = 'csv' } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
    const reports = await Report.find({ createdAt: { $gte: since } })
      .populate('routeId', 'name routeNumber')
      .sort({ createdAt: -1 })
      .lean();

    // Flatten data for export
    const rows = reports.map(r => ({
      id: String(r._id),
      routeName: r.routeId?.name || '',
      routeNumber: r.routeId?.routeNumber || '',
      reportType: r.reportType,
      severity: r.severity,
      description: r.description || '',
      longitude: Array.isArray(r.location?.coordinates) ? r.location.coordinates[0] : '',
      latitude: Array.isArray(r.location?.coordinates) ? r.location.coordinates[1] : '',
      status: r.status,
      isAnonymous: r.isAnonymous ? 'yes' : 'no',
      createdAt: new Date(r.createdAt).toISOString()
    }));

    const headers = Object.keys(rows[0] || { id: '', routeName: '', reportType: '', severity: '', createdAt: '' });
    const csv = [headers.join(',')]
      .concat(rows.map(row => headers.map(h => {
        const v = row[h] ?? '';
        const s = String(v).replace(/"/g, '""');
        const needsQuotes = /[",\n\r]/.test(s);
        return needsQuotes ? `"${s}"` : s;
      }).join(',')))
      .join('\n');

    const filename = `reports-${Date.now()}.${format === 'xls' ? 'xls' : 'csv'}`;
    const contentType = format === 'xls' ? 'application/vnd.ms-excel' : 'text/csv; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(csv);
  } catch (error) {
    console.error('Export reports error:', error);
    return res.status(500).json({ success: false, message: 'Failed to export reports' });
  }
});

// Admin seed endpoint (must be defined before 404 and export)
app.post('/admin/seed/routes', authMiddleware, requireRoles(['admin']), async (req, res) => {
  try {
    const seeds = req.body?.routes || []
    if (!Array.isArray(seeds) || seeds.length === 0) {
      return res.status(400).json({ success: false, message: 'No routes provided' })
    }

    let created = 0
    for (const r of seeds) {
      if (!r.name) continue
      const exists = await Route.findOne({ name: r.name }).lean()
      if (exists) continue

      const defaultStops = [
        { name: 'Kencom', coordinates: [36.8219, -1.2921] },
        { name: 'Terminus', coordinates: [36.8000, -1.3000] }
      ]

      await Route.create({
        name: r.name,
        routeNumber: r.routeNumber || '',
        operator: r.operator || '',
        operatingHours: { start: '05:00', end: '22:00' },
        stops: r.stops && r.stops.length ? r.stops : defaultStops,
        // path as [lng,lat] flat array (two-point polyline)
        path: r.path && r.path.length ? r.path : [36.8219, -1.2921, 36.8000, -1.3000],
        fare: r.fare || 50,
        status: 'active',
        isActive: true,
        description: r.description || 'Seeded route'
      })
      created++
    }

    return res.json({ success: true, data: { created } })
  } catch (err) {
    console.error('Seed routes error:', err)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    requestedUrl: req.originalUrl,
    method: req.method
  });
});

// Export the Express app as a Cloud Function
exports.api = functions.https.onRequest(app);