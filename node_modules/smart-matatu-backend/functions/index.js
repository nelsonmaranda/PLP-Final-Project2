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
    const { routeId, reportType, description, severity, location, isAnonymous } = req.body;
    if (!routeId || !reportType) {
      return res.status(400).json({ success: false, message: 'Route ID and report type are required' });
    }
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }
    
    // Generate device fingerprint from IP and user agent
    const deviceFingerprint = `${req.ip || 'unknown'}-${req.get('User-Agent') || 'unknown'}`.slice(0, 100);
    
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

// Weather endpoint (mock for now, can integrate with OpenWeatherMap API)
app.get('/weather', async (req, res) => {
  try {
    // Mock weather data for Nairobi
    const weatherData = {
      temperature: 24 + Math.floor(Math.random() * 6) - 3, // 21-27°C
      humidity: 60 + Math.floor(Math.random() * 20), // 60-80%
      windSpeed: 8 + Math.floor(Math.random() * 10), // 8-18 km/h
      condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
      description: 'Good conditions for travel',
      icon: 'partly-cloudy',
      location: 'Nairobi, Kenya',
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: weatherData
    });

  } catch (error) {
    console.error('Weather data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Route insights with AI predictions
app.get('/insights/routes', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    // Get top 5 routes with most reports
    const routes = await Route.find({ isActive: true }).limit(5);
    const insights = [];

    for (const route of routes) {
      // Get recent reports for this route
      const recentReports = await Report.find({ 
        routeId: route._id,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      // Calculate fare prediction (simple algorithm)
      const fares = recentReports.map(r => r.fare).filter(f => f > 0);
      const avgFare = fares.length > 0 ? fares.reduce((a, b) => a + b, 0) / fares.length : route.fare;
      const fareVariance = fares.length > 1 ? Math.sqrt(fares.reduce((a, b) => a + Math.pow(b - avgFare, 2), 0) / fares.length) : 0;
      
      const farePrediction = {
        predictedFare: Math.round(avgFare),
        confidence: Math.min(0.9, 0.5 + (fares.length / 10)),
        minFare: Math.round(avgFare - fareVariance),
        maxFare: Math.round(avgFare + fareVariance),
        trend: fares.length > 3 ? (fares[fares.length - 1] > fares[0] ? 'increasing' : 'decreasing') : 'stable',
        factors: ['Historical data', 'Time of day', 'Weather conditions'],
        lastUpdated: new Date().toISOString()
      };

      // Calculate safety score
      const safetyReports = recentReports.filter(r => r.reportType === 'safety');
      const safetyScore = {
        overallScore: safetyReports.length > 0 
          ? safetyReports.reduce((sum, r) => {
              const severityScore = r.severity === 'low' ? 5 : r.severity === 'medium' ? 3 : 1;
              return sum + severityScore;
            }, 0) / safetyReports.length 
          : 4.2,
        reliabilityScore: 4.0 + Math.random() * 0.8,
        incidentScore: 4.5 - (safetyReports.length * 0.1),
        driverScore: 4.0 + Math.random() * 0.6,
        vehicleScore: 3.8 + Math.random() * 0.8,
        factors: ['Incident reports', 'User feedback', 'Route history'],
        lastUpdated: new Date().toISOString()
      };

      // Calculate crowd density
      const currentHour = new Date().getHours();
      const isPeakTime = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
      const crowdLevel = isPeakTime ? 'high' : currentHour >= 10 && currentHour <= 16 ? 'medium' : 'low';
      
      const crowdDensity = {
        level: crowdLevel,
        percentage: isPeakTime ? 80 + Math.floor(Math.random() * 20) : 30 + Math.floor(Math.random() * 40),
        predictedPeak: isPeakTime ? 'Now' : '7:00 AM - 9:00 AM',
        recommendedTime: isPeakTime ? '10:00 AM - 4:00 PM' : 'Now',
        lastUpdated: new Date().toISOString()
      };

      // Calculate travel time (mock)
      const baseTime = 25 + Math.floor(Math.random() * 20);
      const weatherFactor = Math.random() > 0.7 ? 1.2 : 1.0;
      const peakFactor = isPeakTime ? 1.5 : 1.0;
      const travelTime = Math.round(baseTime * weatherFactor * peakFactor);

      insights.push({
        routeId: route._id,
        routeName: route.name,
        farePrediction,
        safetyScore,
        crowdDensity,
        travelTime,
        recommendedTime: isPeakTime ? '10:00 AM - 4:00 PM' : 'Now',
        alternativeRoutes: [],
        weatherImpact: 'Minimal impact on travel time',
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

// Route efficiency scoring
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

    // Get recent reports and scores
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const reports = await Report.find({
      routeId: routeId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Calculate efficiency factors
    const onTimeReports = reports.filter(r => r.reportType === 'reliability' && r.severity === 'low');
    const reliabilityScore = reports.length > 0 ? (onTimeReports.length / reports.length) * 100 : 50;

    const safetyReports = reports.filter(r => r.reportType === 'safety');
    const safetyScore = safetyReports.length > 0
      ? 100 - (safetyReports.reduce((sum, r) => sum + (r.severity === 'high' ? 30 : r.severity === 'medium' ? 15 : 5), 0) / safetyReports.length)
      : 80;

    const comfortReports = reports.filter(r => r.reportType === 'comfort');
    const comfortScore = comfortReports.length > 0
      ? comfortReports.reduce((sum, r) => sum + (r.severity === 'low' ? 90 : r.severity === 'medium' ? 70 : 50), 0) / comfortReports.length
      : 70;

    const avgFare = route.fare || 50;
    const costScore = Math.max(0, 100 - (avgFare - 30) * 2);

    const operatingHours = route.operatingHours ? 
      (parseInt(route.operatingHours.end.split(':')[0]) - parseInt(route.operatingHours.start.split(':')[0])) : 12;
    const frequencyScore = Math.min(100, operatingHours * 2);

    // Calculate overall efficiency score
    const weights = { reliability: 0.25, safety: 0.25, comfort: 0.15, cost: 0.10, frequency: 0.05, speed: 0.20 };
    const efficiencyScore = 
      (reliabilityScore * weights.reliability) +
      (safetyScore * weights.safety) +
      (comfortScore * weights.comfort) +
      (costScore * weights.cost) +
      (frequencyScore * weights.frequency) +
      (70 * weights.speed); // Default speed score

    const recommendations = [];
    if (reliabilityScore < 70) recommendations.push('Improve on-time performance through better scheduling');
    if (safetyScore < 80) recommendations.push('Address safety concerns and improve driver training');
    if (comfortScore < 70) recommendations.push('Upgrade vehicles and improve passenger comfort');
    if (costScore < 60) recommendations.push('Review fare structure for better value proposition');
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
          speed: 70
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
    
    // Get user's historical data
    const userReports = await Report.find({ userId: userId });
    
    // Get all active routes
    const routes = await Route.find({ isActive: true });
    
    const recommendations = [];
    
    for (const route of routes.slice(0, 10)) { // Limit to first 10 routes for performance
      const efficiency = 70 + Math.random() * 20; // Mock efficiency
      const score = efficiency + Math.random() * 10;
      
      if (score > 60) {
        recommendations.push({
          routeId: route._id.toString(),
          routeName: route.name,
          reason: efficiency > 85 ? 'High efficiency rating' : 'Good overall performance',
          score: Math.round(score),
          type: efficiency > 80 ? 'efficiency' : 'safety'
        });
      }
    }
    
    // Sort by score and take top 5
    const topRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        userId,
        recommendations: topRecommendations,
        preferences: {
          efficiency: 0.3,
          safety: 0.3,
          cost: 0.2,
          convenience: 0.2
        },
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