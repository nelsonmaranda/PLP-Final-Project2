const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Route, Report, Score } = require('./models');

// Create Express app
const app = express();

// Trust proxy for Firebase Functions
app.set('trust proxy', true);

// JWT Secret (in production, use environment variable)
const JWT_SECRET = functions.config().jwt?.secret || 'your-super-secret-jwt-key-fallback';

// Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    const mongoURI = functions.config().mongodb?.uri;
    if (!mongoURI) {
      console.log('No MongoDB URI found in Firebase config, using mock data');
      return false;
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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

// Routes endpoint (database-backed)
app.get('/routes', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
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

    return res.json({
      success: true,
      data: { routes: routesWithScores, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return res.status(500).json({ success: false, message: 'Error fetching routes' });
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

// Reports endpoint (database-backed)
app.post('/reports', async (req, res) => {
  try {
    const { routeId, reportType, description, severity, location, isAnonymous } = req.body;
    if (!routeId || !reportType) {
      return res.status(400).json({ success: false, message: 'Route ID and report type are required' });
    }
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }
    const report = await Report.create({
      routeId,
      reportType,
      description: description || '',
      severity: severity || 'medium',
      location: location || { type: 'Point', coordinates: [-1.2921, 36.8219] },
      status: 'pending',
      isAnonymous: Boolean(isAnonymous)
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

app.get('/auth/profile', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) return res.status(503).json({ success: false, message: 'Database unavailable' });
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: { user: { _id: user._id, email: user.email, displayName: user.displayName, role: user.role, savedRoutes: user.savedRoutes } } });
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
          savedRoutes: user.savedRoutes
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
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and display name are required'
      });
    }

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
      role: 'user',
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

    // Return success response (don't include password)
    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: newUser._id,
          email: newUser.email,
          displayName: newUser.displayName,
          role: newUser.role,
          savedRoutes: newUser.savedRoutes
        },
        token
      },
      message: 'Registration successful'
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