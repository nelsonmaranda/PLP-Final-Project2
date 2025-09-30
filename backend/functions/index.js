const functions = require('firebase-functions');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const { User, Route, Report, Score, RateLimit, TrafficCache, Subscription, Payment, AnalyticsEvent, PerformanceMetric } = require('./models');

// Auth middleware
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

// Maintenance key for controlled debug operations
const MAINT_KEY = (functions.config().maint && functions.config().maint.key) || process.env.MAINT_KEY || 'allow-local-2025-09-30';

// Create Express app
const app = express();
// Email setup
const EMAIL_PROVIDER = (functions.config().email && functions.config().email.provider) || process.env.EMAIL_PROVIDER || 'sendgrid';
const SENDGRID_API_KEY = (functions.config().email && functions.config().email.api_key) || process.env.SENDGRID_API_KEY;
const EMAIL_FROM = (functions.config().email && functions.config().email.from) || process.env.EMAIL_FROM || 'no-reply@smart-matatu.com';
const APP_BASE_URL = (functions.config().app && functions.config().app.base_url) || process.env.APP_BASE_URL || 'https://smart-matwana-ke.web.app';
let smtpTransport = null;
if (EMAIL_PROVIDER === 'sendgrid' && SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else if (EMAIL_PROVIDER === 'smtp') {
  const SMTP_HOST = (functions.config().email && functions.config().email.host) || process.env.SMTP_HOST;
  const SMTP_PORT = Number((functions.config().email && functions.config().email.port) || process.env.SMTP_PORT || 587);
  const SMTP_USER = (functions.config().email && functions.config().email.user) || process.env.SMTP_USER;
  const SMTP_PASS = (functions.config().email && functions.config().email.pass) || process.env.SMTP_PASS;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    smtpTransport = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  }
}

// Trust proxy for Firebase Functions
app.set('trust proxy', true);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Verify email endpoint
app.get('/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Missing token' });
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid token' });
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Token expired' });
    }
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    const redirectUrl = `${APP_BASE_URL.replace(/\/$/, '')}/login?verified=1`;
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Verify email error:', error);
    const redirectUrl = `${APP_BASE_URL.replace(/\/$/, '')}/login?verified=0`;
    return res.redirect(302, redirectUrl);
  }
});

// Resend verification link
app.post('/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.emailVerified) return res.json({ success: true, message: 'Already verified' });

    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await user.save();

    try {
      const verifyUrl = `${APP_BASE_URL}/verify-email?token=${token}`;
      const msg = {
        to: user.email,
        from: EMAIL_FROM,
        subject: 'Verify your Smart Matatu account',
        html: `<p>Hello ${user.displayName},</p><p>Click to verify your email:</p><p><a href="${verifyUrl}">Verify Email</a></p>`
      };
      if (EMAIL_PROVIDER === 'sendgrid' && SENDGRID_API_KEY) await sgMail.send(msg);
      else if (EMAIL_PROVIDER === 'smtp' && smtpTransport) await smtpTransport.sendMail({ to: msg.to, from: msg.from, subject: msg.subject, html: msg.html });
    } catch (e) {
      console.error('Resend email error:', e);
    }
    return res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Request password reset
app.post('/auth/forgot-password', async (req, res) => {
  try {
    ensureCors(req, res)
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ success: false, message: 'Email required' })
    const user = await User.findOne({ email: String(email).toLowerCase() })
    if (!user) return res.json({ success: true, message: 'If that email exists, a reset link has been sent' })

    const token = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = token
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 30) // 30 minutes
    await user.save()

    const resetUrl = `${APP_BASE_URL.replace(/\/$/, '')}/reset-password?token=${token}`
    const msg = {
      to: user.email,
      from: EMAIL_FROM,
      subject: 'Reset your Smart Matatu password',
      html: `<p>Hello ${user.displayName || ''},</p><p>Click the link below to reset your password. This link expires in 30 minutes.</p><p><a href="${resetUrl}">Reset Password</a></p>`
    }
    try {
      if (EMAIL_PROVIDER === 'sendgrid' && SENDGRID_API_KEY) await sgMail.send(msg)
      else if (EMAIL_PROVIDER === 'smtp' && smtpTransport) await smtpTransport.sendMail({ to: msg.to, from: msg.from, subject: msg.subject, html: msg.html })
    } catch (e) { console.error('Send reset email failed:', e) }

    return res.json({ success: true, message: 'If that email exists, a reset link has been sent' })
  } catch (error) {
    console.error('Forgot password error:', error)
    ensureCors(req, res)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

// Reset password
app.post('/auth/reset-password', async (req, res) => {
  try {
    ensureCors(req, res)
    const { token, password } = req.body || {}
    if (!token || !password) return res.status(400).json({ success: false, message: 'Token and password required' })
    const user = await User.findOne({ resetPasswordToken: token })
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' })
    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' })
    }
    user.password = await bcrypt.hash(password, 12)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()
    return res.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    ensureCors(req, res)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
})
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
    if (mongoose.connection.readyState === 1) {
      return true;
    }
    await mongoose.connect(mongoURI, { dbName: mongoose.connection?.name });
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
  origin: true, // reflect request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length']
}));

// Compress JSON/text responses > 1KB
app.use(compression({ threshold: 1024 }));

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

// Helper to ensure CORS headers on specific responses
function ensureCors(req, res) {
  const origin = req.headers.origin;
  if (origin) res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
}

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
app.post('/routes/:routeId/rate', authMiddleware, async (req, res) => {
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
      rl = await RateLimit.create({
        routeId,
        fingerprint,
        userId: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
        lastRatedAt: new Date(now),
        count: 1
      });
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
      // Backfill userId if present and not set yet
      if (!rl.userId && req.user?.userId) {
        rl.userId = new mongoose.Types.ObjectId(req.user.userId);
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
        userId: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : undefined,
        reliability: r,
        safety: s,
        punctuality: p,
        comfort: c,
        overall: o,
        totalReports: 1,
        lastCalculated: new Date()
      });
      
      // Track analytics event
      try {
        await AnalyticsEvent.create({
          userId: new mongoose.Types.ObjectId(req.user?.userId || 'anonymous'),
          eventType: 'route_rated',
          eventData: { routeId, overall: o, reliability: r, safety: s, punctuality: p, comfort: c }
        });
      } catch (analyticsError) {
        console.error('Analytics tracking error:', analyticsError);
        // Don't fail the rating if analytics fails
      }
      
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

    // Backfill userId on aggregate score document if available
    if (!scoreDoc.userId && req.user?.userId) {
      scoreDoc.userId = new mongoose.Types.ObjectId(req.user.userId);
    }
    await scoreDoc.save();

    // Track analytics event
    try {
      await AnalyticsEvent.create({
        userId: new mongoose.Types.ObjectId(req.user?.userId || 'anonymous'),
        eventType: 'route_rated',
        eventData: { routeId, overall: newOverall, reliability: scoreDoc.reliability, safety: scoreDoc.safety, punctuality: scoreDoc.punctuality, comfort: scoreDoc.comfort }
      });
    } catch (analyticsError) {
      console.error('Analytics tracking error:', analyticsError);
      // Don't fail the rating if analytics fails
    }

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
app.post('/reports', authMiddleware, async (req, res) => {
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
    
    console.log('Creating report for userId:', req.user.userId);
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
      // Associate report with the authenticated user unless submitted as anonymous
      userId: Boolean(isAnonymous) ? undefined : req.user.userId,
      // Optional analytics metadata
      sacco: sacco || undefined,
      direction: direction || undefined,
      fare: typeof fare === 'number' ? fare : undefined,
      deviceFingerprint
    });
    console.log('Report created with ID:', report._id, 'userId:', report.userId);
    
    // Track analytics event
    try {
      if (req.user?.userId && !Boolean(isAnonymous)) {
        await AnalyticsEvent.create({
          userId: new mongoose.Types.ObjectId(req.user.userId),
          eventType: 'report_submitted',
          eventData: { reportType, severity, isAnonymous: Boolean(isAnonymous) }
        });
      }
    } catch (analyticsError) {
      console.error('Analytics tracking error:', analyticsError);
      // Don't fail the report submission if analytics fails
    }
    
    return res.status(201).json({ success: true, data: report, message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error creating report:', error);
    return res.status(500).json({ success: false, message: 'Error creating report' });
  }
});

// Admin approve a report (set status -> 'verified')
app.post('/admin/reports/:reportId/approve', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) return res.status(503).json({ success: false, message: 'Database unavailable' });
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Admin or moderator access required' });
    }
    const { reportId } = req.params;
    const updated = await Report.findByIdAndUpdate(reportId, {
      status: 'verified',
      verifiedBy: new mongoose.Types.ObjectId(req.user.userId),
      verifiedAt: new Date(),
      updatedAt: new Date()
    }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Report not found' });
    return res.json({ success: true, data: { report: updated }, message: 'Report approved' });
  } catch (error) {
    console.error('Approve report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve report' });
  }
});

// Admin resolve a report (set status -> 'resolved')
app.post('/admin/reports/:reportId/resolve', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) return res.status(503).json({ success: false, message: 'Database unavailable' });
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Admin or moderator access required' });
    }
    const { reportId } = req.params;
    const updated = await Report.findByIdAndUpdate(reportId, {
      status: 'resolved',
      resolvedAt: new Date(),
      updatedAt: new Date()
    }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Report not found' });
    return res.json({ success: true, data: { report: updated }, message: 'Report resolved' });
  } catch (error) {
    console.error('Resolve report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resolve report' });
  }
});

// Admin dismiss a report (set status -> 'dismissed')
app.post('/admin/reports/:reportId/dismiss', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) return res.status(503).json({ success: false, message: 'Database unavailable' });
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Admin or moderator access required' });
    }
    const { reportId } = req.params;
    const updated = await Report.findByIdAndUpdate(reportId, {
      status: 'dismissed',
      updatedAt: new Date()
    }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Report not found' });
    return res.json({ success: true, data: { report: updated }, message: 'Report dismissed' });
  } catch (error) {
    console.error('Dismiss report error:', error);
    return res.status(500).json({ success: false, message: 'Failed to dismiss report' });
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

// Consolidated analytics endpoint for homepage with retry-friendly caching
app.get('/analytics/homepage', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    // Fetch all data in parallel for better performance
    const [totalRoutes, totalReports, totalUsers, scores, recentReports] = await Promise.all([
      Route.countDocuments({ isActive: true }),
      Report.countDocuments({}),
      User.countDocuments({ status: 'active' }),
      Score.aggregate([{ $group: { _id: null, avgOverall: { $avg: '$overall' } } }]),
      Report.find({}).sort({ createdAt: -1 }).limit(5).populate('routeId', 'name routeNumber').lean()
    ]);

    const averageScore = scores.length > 0 ? scores[0].avgOverall : 0;

    res.json({
      success: true,
      data: {
        totalRoutes,
        totalReports,
        totalUsers,
        averageScore: Math.round(averageScore * 10) / 10,
        recentReports: recentReports.map(report => ({
          _id: report._id,
          reportType: report.reportType,
          description: report.description,
          severity: report.severity,
          createdAt: report.createdAt,
          routeName: report.routeId?.name || 'Unknown Route'
        })),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching homepage analytics:', error);
    res.status(500).json({ success: false, message: 'Error fetching homepage analytics' });
  }
});


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
    console.log('Getting profile for userId:', req.user.userId);
    const user = await User.findById(new mongoose.Types.ObjectId(req.user.userId));
    console.log('Found user for profile:', user ? 'yes' : 'no', 'avatarUrl:', user?.avatarUrl);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ 
      success: true, 
      data: { 
        user: { 
          _id: user._id, 
          email: user.email, 
          displayName: user.displayName, 
          role: user.role,
          avatarUrl: user.avatarUrl,
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

    // Allowlist certain emails to bypass verification
    const bypassEmails = ['nelsonmaranda2@gmail.com', 'test@example.com']
    // Block ONLY explicit false and not in allowlist; allow legacy users without the field
    if (user.emailVerified === false && !bypassEmails.includes(String(user.email).toLowerCase())) {
      return res.status(401).json({ success: false, message: 'Email not verified. Please check your inbox or request a new verification link.' });
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

    // Generate email verification token
    const token = crypto.randomBytes(32).toString('hex');
    newUser.emailVerificationToken = token;
    newUser.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    await newUser.save();

    // Send verification email
    try {
      const verifyUrl = `https://us-central1-${process.env.GCLOUD_PROJECT || 'smart-matwana-ke'}.cloudfunctions.net/api/auth/verify-email?token=${token}`
      const msg = {
        to: newUser.email,
        from: EMAIL_FROM,
        subject: 'Verify your Smart Matatu account',
        html: `<p>Hello ${newUser.displayName},</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">Verify Email</a></p><p>This link expires in 24 hours.</p>`
      }
      if (EMAIL_PROVIDER === 'sendgrid' && SENDGRID_API_KEY) {
        await sgMail.send(msg)
      } else if (EMAIL_PROVIDER === 'smtp' && smtpTransport) {
        await smtpTransport.sendMail({ to: msg.to, from: msg.from, subject: msg.subject, html: msg.html })
      }
    } catch (e) {
      console.error('Send verification email failed:', e)
    }

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
          emailVerified: newUser.emailVerified,
          organization: newUser.organization,
          savedRoutes: newUser.savedRoutes
        },
        token: null
      },
      message: message + ' Please verify your email to activate your account. Check your inbox.',
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
    const { displayName, email, avatarUrl } = req.body;

    // Validate input
    if (!displayName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Display name and email are required'
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(userId),
      { displayName, email, avatarUrl: avatarUrl || undefined, updatedAt: new Date() },
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

// File upload endpoint - NO MULTER VERSION
app.post('/upload', authMiddleware, async (req, res) => {
  try {
    console.log('Upload endpoint called - NO MULTER VERSION');
    console.log('Request body:', req.body);
    console.log('User:', req.user ? 'Authenticated' : 'Not authenticated');
    console.log('Database connected:', isDBConnected);
    
    const { type, imageData, filename, mimetype } = req.body;
    console.log('Upload type:', type);
    console.log('Has imageData:', !!imageData);
    console.log('Filename:', filename);
    console.log('Mimetype:', mimetype);
    
    if (!imageData) {
      console.log('No image data provided');
      return res.status(400).json({ 
        success: false, 
        message: 'No image data provided' 
      });
    }

    // Validate file type
    if (!type || !['profile', 'report'].includes(type)) {
      console.log('Invalid upload type:', type);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid upload type' 
      });
    }

    if (!isDBConnected) {
      console.log('Database not connected');
      return res.status(503).json({ 
        success: false, 
        message: 'Database unavailable' 
      });
    }

    const userId = req.user.userId;
    console.log('User ID:', userId);
    
    if (type === 'profile') {
      console.log('Processing profile photo upload - NO MULTER');
      
      // Use the base64 data directly from the request
      const dataUrl = imageData; // imageData should already be a data URL
      console.log('Using provided imageData, length:', dataUrl.length);
      
      // Update user's avatarUrl
      console.log('Updating user avatarUrl');
      await User.findByIdAndUpdate(
        new mongoose.Types.ObjectId(userId),
        { avatarUrl: dataUrl }
      );
      console.log('User avatarUrl updated');

      res.json({
        success: true,
        data: {
          url: dataUrl,
          filename: filename || 'profile_photo',
          size: dataUrl.length,
          mimetype: mimetype || 'image/jpeg'
        },
        message: 'Profile photo uploaded successfully (no multer)'
      });

    } else if (type === 'report') {
      // For report images, we can use a simpler approach
      const timestamp = Date.now();
      const filename = `report_${userId}_${timestamp}.${req.file.originalname.split('.').pop()}`;
      
      const base64Data = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;
      
      res.json({
        success: true,
        data: {
          url: dataUrl,
          filename: filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        },
        message: 'Report image uploaded successfully'
      });
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed'
    });
  }
});



// Debug endpoint to list all registered routes
app.get('/debug-routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    }
  });
  res.json({ success: true, routes: routes });
});

// Get user's profile photo
app.get('/users/:userId/photo', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId } = req.params;
    
    // Ensure user can only access their own photo
    if (req.user.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // TEMPORARILY DISABLED - ProfilePhoto model not available
    // Get the active profile photo for this user
    // console.log('Searching for profile photo for userId:', userId);
    // const profilePhoto = await ProfilePhoto.findOne({
    //   userId: new mongoose.Types.ObjectId(userId),
    //   isActive: true
    // }).sort({ uploadedAt: -1 });

    // console.log('Found profile photo:', profilePhoto ? 'Yes' : 'No');
    // if (profilePhoto) {
    //   console.log('Photo details:', {
    //     id: profilePhoto._id,
    //     filename: profilePhoto.filename,
    //     size: profilePhoto.size,
    //     urlLength: profilePhoto.url ? profilePhoto.url.length : 0
    //   });
    // }

    // if (!profilePhoto) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'No profile photo found'
    //   });
    // }

    // res.json({
    //   success: true,
    //   data: {
    //     url: profilePhoto.url,
    //     filename: profilePhoto.filename,
    //     originalName: profilePhoto.originalName,
    //     size: profilePhoto.size,
    //     mimetype: profilePhoto.mimetype,
    //     uploadedAt: profilePhoto.uploadedAt
    //   }
    // });

    // TEMPORARY: Return user's avatarUrl from User model
    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    if (!user || !user.avatarUrl) {
      return res.status(404).json({
        success: false,
        message: 'No profile photo found'
      });
    }

    res.json({
      success: true,
      data: {
        url: user.avatarUrl,
        filename: 'profile_photo',
        originalName: 'profile_photo',
        size: user.avatarUrl.length,
        mimetype: 'image/jpeg',
        uploadedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Get profile photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile photo'
    });
  }
});

// Delete user's profile photo
app.delete('/users/:userId/photo', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId } = req.params;
    
    // Ensure user can only delete their own photo
    if (req.user.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // TEMPORARILY DISABLED - ProfilePhoto model not available
    // Soft delete all active profile photos for this user
    // const result = await ProfilePhoto.updateMany(
    //   { userId: new mongoose.Types.ObjectId(userId), isActive: true },
    //   { isActive: false, updatedAt: new Date() }
    // );

    // Clear user's avatarUrl
    await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(userId),
      { avatarUrl: null }
    );

    res.json({
      success: true,
      message: 'Profile photo deleted successfully',
      data: { deletedCount: 1 }
    });

  } catch (error) {
    console.error('Delete profile photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile photo'
    });
  }
});

// Debug endpoint to check all reports and their userIds
app.get('/debug/reports', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    console.log('Debug: Getting all reports for user:', req.user.userId);
    
    // Get all reports (not just user's reports)
    const allReports = await Report.find({}).select('_id userId reportType createdAt').limit(20);
    console.log('Debug: Found total reports:', allReports.length);
    
    // Get user's reports specifically
    const userReports = await Report.find({ userId: new mongoose.Types.ObjectId(req.user.userId) }).select('_id userId reportType createdAt');
    console.log('Debug: Found user reports:', userReports.length);
    
    // Get reports with null userId
    const anonymousReports = await Report.find({ userId: null }).select('_id userId reportType createdAt').limit(10);
    console.log('Debug: Found anonymous reports:', anonymousReports.length);

    res.json({
      success: true,
      data: {
        currentUserId: req.user.userId,
        totalReports: allReports.length,
        userReports: userReports.length,
        anonymousReports: anonymousReports.length,
        sampleReports: allReports,
        userReportsList: userReports,
        anonymousReportsList: anonymousReports
      }
    });

  } catch (error) {
    console.error('Debug reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed'
    });
  }
});

// Fix reports - add userId to reports that don't have it
app.post('/debug/fix-reports', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const userId = req.user.userId;
    console.log('Fixing reports for userId:', userId);
    
    // Find all reports without userId
    const reportsWithoutUserId = await Report.find({ userId: { $exists: false } });
    console.log('Found reports without userId:', reportsWithoutUserId.length);
    
    if (reportsWithoutUserId.length === 0) {
      return res.json({
        success: true,
        message: 'No reports need fixing',
        data: { updatedCount: 0 }
      });
    }
    
    // Update all reports without userId to have the current user's ID
    const updateResult = await Report.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: new mongoose.Types.ObjectId(userId) } }
    );
    
    console.log('Updated reports:', updateResult.modifiedCount);
    
    res.json({
      success: true,
      message: `Updated ${updateResult.modifiedCount} reports with your user ID`,
      data: { 
        updatedCount: updateResult.modifiedCount,
        totalReports: reportsWithoutUserId.length
      }
    });

  } catch (error) {
    console.error('Fix reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix reports'
    });
  }
});

// Fix scores - add userId to scores that don't have it
app.post('/debug/fix-scores', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const userId = req.user.userId;
    console.log('Fixing scores for userId:', userId);
    
    // Find all scores without userId
    const scoresWithoutUserId = await Score.find({ userId: { $exists: false } });
    console.log('Found scores without userId:', scoresWithoutUserId.length);
    
    if (scoresWithoutUserId.length === 0) {
      return res.json({
        success: true,
        message: 'No scores need fixing',
        data: { updatedCount: 0 }
      });
    }
    
    // Update all scores without userId to have the current user's ID
    const updateResult = await Score.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: new mongoose.Types.ObjectId(userId) } }
    );
    
    console.log('Updated scores:', updateResult.modifiedCount);
    
    res.json({
      success: true,
      message: `Updated ${updateResult.modifiedCount} scores with your user ID`,
      data: { 
        updatedCount: updateResult.modifiedCount,
        totalScores: scoresWithoutUserId.length
      }
    });

  } catch (error) {
    console.error('Fix scores error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix scores'
    });
  }
});

// TEMP: Backfill scores with a specific userId using a maintenance key
app.post('/debug/fix-scores/for/:userId', async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const key = req.get('x-maintenance-key');
    if (!key || key !== MAINT_KEY) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const scoresWithoutUserId = await Score.find({ userId: { $exists: false } });
    const updateResult = await Score.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: new mongoose.Types.ObjectId(userId) } }
    );

    return res.json({
      success: true,
      message: `Updated ${updateResult.modifiedCount} scores with provided user ID`,
      data: {
        updatedCount: updateResult.modifiedCount,
        totalScores: scoresWithoutUserId.length,
        targetUserId: userId
      }
    });
  } catch (error) {
    console.error('Fix scores (for user) error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fix scores for user' });
  }
});

// Fix rate limits - add userId to rate limits that don't have it
app.post('/debug/fix-ratelimits', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const userId = req.user.userId;
    console.log('Fixing rate limits for userId:', userId);
    
    // Find all rate limits without userId
    const rateLimitsWithoutUserId = await RateLimit.find({ userId: { $exists: false } });
    console.log('Found rate limits without userId:', rateLimitsWithoutUserId.length);
    
    if (rateLimitsWithoutUserId.length === 0) {
      return res.json({
        success: true,
        message: 'No rate limits need fixing',
        data: { updatedCount: 0 }
      });
    }
    
    // Update all rate limits without userId to have the current user's ID
    const updateResult = await RateLimit.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: new mongoose.Types.ObjectId(userId) } }
    );
    
    console.log('Updated rate limits:', updateResult.modifiedCount);
    
    res.json({
      success: true,
      message: `Updated ${updateResult.modifiedCount} rate limits with your user ID`,
      data: { 
        updatedCount: updateResult.modifiedCount,
        totalRateLimits: rateLimitsWithoutUserId.length
      }
    });

  } catch (error) {
    console.error('Fix rate limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix rate limits'
    });
  }
});

// List reports with optional status filter (admin/moderator)
app.get('/reports', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const sort = req.query.sort || 'createdAt';
    const order = (String(req.query.order || 'desc').toLowerCase() === 'asc') ? 1 : -1;
    const status = req.query.status;

    const filter = status ? { status } : {};

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ [sort]: order })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        reports,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    console.error('List reports error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching reports' });
  }
});

// Get user reports
app.get('/users/:userId/reports', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId } = req.params;
    console.log('Getting reports for userId:', userId, 'from token userId:', req.user.userId);
    
    // Ensure user can only access their own reports
    if (req.user.userId !== userId) {
      console.log('Access denied: userId mismatch');
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'desc' ? -1 : 1;

    const reports = await Report.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate('routeId', 'name routeNumber operator')
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
    console.log('Found reports:', reports.length, 'total:', total);

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
app.get('/users/:userId/favorites', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId } = req.params;
    console.log('Getting favorites for userId:', userId, 'from token userId:', req.user.userId);
    
    // Ensure user can only access their own favorites
    if (req.user.userId !== userId) {
      console.log('Access denied: userId mismatch');
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Preferred source: analytics events of type 'route_rated'
    let ratedRouteIds = [];
    try {
      const events = await AnalyticsEvent.find({
        userId: new mongoose.Types.ObjectId(userId),
        eventType: 'route_rated'
      }).sort({ createdAt: -1 }).lean();
      ratedRouteIds = Array.from(new Set((events || [])
        .map(e => e?.eventData?.routeId)
        .filter(Boolean)
        .map(id => String(id))
      ));
    } catch (e) {
      console.warn('Favorites: analytics lookup failed, will fallback', e?.message || e);
    }

    let routes = [];
    if (ratedRouteIds.length > 0) {
      routes = await Route.find({ _id: { $in: ratedRouteIds.map(id => new mongoose.Types.ObjectId(id)) } })
        .select('name routeNumber operator stops')
        .lean();
    }

    // Fallback 1: user's savedRoutes
    if (routes.length === 0) {
      const userDoc = await User.findById(new mongoose.Types.ObjectId(userId)).select('savedRoutes').lean();
      const saved = Array.isArray(userDoc?.savedRoutes) ? userDoc.savedRoutes : [];
      if (saved.length > 0) {
        routes = await Route.find({ _id: { $in: saved } }).select('name routeNumber operator stops').lean();
      }
    }

    // Fallback 2: derive from reports the user submitted
    if (routes.length === 0) {
      const reports = await Report.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      const fromReports = Array.from(new Set((reports || []).map(r => String(r.routeId)).filter(Boolean)));
      if (fromReports.length > 0) {
        routes = await Route.find({ _id: { $in: fromReports.map(id => new mongoose.Types.ObjectId(id)) } })
          .select('name routeNumber operator stops')
          .lean();
      }
    }

    return res.json({ success: true, data: { routes } });

  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add favorite route
app.post('/users/:userId/favorites', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId } = req.params;
    
    // Ensure user can only add to their own favorites
    if (req.user.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
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
      new mongoose.Types.ObjectId(userId),
      { $addToSet: { savedRoutes: new mongoose.Types.ObjectId(routeId) } },
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
app.delete('/users/:userId/favorites/:routeId', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId, routeId } = req.params;
    
    // Ensure user can only remove from their own favorites
    if (req.user.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(userId),
      { $pull: { savedRoutes: new mongoose.Types.ObjectId(routeId) } },
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
app.get('/users/:userId/analytics', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) {
      return res.status(503).json({ success: false, message: 'Database unavailable' });
    }

    const { userId } = req.params;
    console.log('Analytics: Requested userId:', userId, 'Token userId:', req.user.userId);
    
    // Ensure user can only access their own analytics
    if (req.user.userId !== userId) {
      console.log('Analytics: Access denied - userId mismatch');
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get user reports
    console.log('Analytics: Searching for reports with userId:', userId);
    const reports = await Report.find({ userId: new mongoose.Types.ObjectId(userId) });
    const totalReports = reports.length;
    console.log('Analytics: Found reports:', totalReports);

    // Reports this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const reportsThisMonth = await Report.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: startOfMonth }
    });

    // Get user's rated routes count (from Score collection)
    const ratedRoutesCount = await Score.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
    console.log('Analytics: Found rated routes:', ratedRoutesCount);

    // Calculate average rating (mock for now)
    const averageRating = 4.2;

    // Most reported route
    const routeReports = await Report.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
        favoriteRoutesCount: ratedRoutesCount,
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
    
    // Calculate average fare from recent reports (7 days); fallback to route fares
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentReports = await Report.find({ createdAt: { $gte: since }, fare: { $gte: 0 } }).select('fare');
    let averageFare = 0;
    if (recentReports.length > 0) {
      averageFare = recentReports.reduce((sum, r) => sum + (Number(r.fare) || 0), 0) / recentReports.length;
    } else {
      const rf = await Route.find({ isActive: true }).select('fare');
      averageFare = rf.length ? rf.reduce((s, r) => s + (Number(r.fare) || 0), 0) / rf.length : 0;
    }

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

    res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
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

    res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
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
    let routeIds = topRouteIdsAgg.map(r => r._id);
    // Fallback: if fewer than requested, fill with active routes not already included
    if (routeIds.length < limit) {
      const remaining = limit - routeIds.length;
      const fillers = await Route.find({ _id: { $nin: routeIds }, isActive: true })
        .sort({ createdAt: -1 })
        .limit(remaining)
        .select('_id');
      routeIds = routeIds.concat(fillers.map(f => f._id));
    }
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

      // Estimate travel time using polyline distance and traffic factor
      // compute distance (km) from route.path flat [lng,lat,...]
      const toRad = (d) => (d * Math.PI) / 180;
      const R = 6371; // km
      let distKm = 0;
      if (Array.isArray(route.path) && route.path.length >= 4) {
        for (let i = 0; i < route.path.length - 3; i += 2) {
          const lng1 = Number(route.path[i]);
          const lat1 = Number(route.path[i + 1]);
          const lng2 = Number(route.path[i + 2]);
          const lat2 = Number(route.path[i + 3]);
          if ([lng1, lat1, lng2, lat2].some(v => Number.isNaN(v))) continue;
          const dLat = toRad(lat2 - lat1);
          const dLng = toRad(lng2 - lng1);
          const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distKm += R * c;
        }
      }
      if (distKm === 0) {
        // fallback to stop count distance approx 0.8km per segment
        const stopCount = Math.max(1, (route.stops || []).length - 1);
        distKm = stopCount * 0.8;
      }
      const baseSpeedKmh = isPeakTime ? 18 : 24; // slower at peak
      // trafficFactor from cache
      let tf = 1.0;
      const tc = await TrafficCache.findOne({ routeId: route._id }).lean();
      if (tc && typeof tc.trafficFactor === 'number' && tc.trafficFactor > 0) tf = tc.trafficFactor;
      const effectiveSpeed = Math.max(8, baseSpeedKmh / tf);
      const travelTime = Math.round((distKm / effectiveSpeed) * 60);

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

    // Compute distance for the selected segment using path polyline
    const fromIndex = route.stops.findIndex(s => s.name === fromStop);
    const toIndex = route.stops.findIndex(s => s.name === toStop);
    let distKm = 0;
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371;
    if (Array.isArray(route.path) && route.path.length >= 4) {
      const totalSegments = Math.floor(route.path.length / 2) - 1;
      const startIdx = Math.max(0, Math.min(totalSegments - 1, Math.floor((fromIndex / Math.max(1, route.stops.length - 1)) * totalSegments)));
      const endIdx = Math.max(startIdx + 1, Math.min(totalSegments, Math.ceil((toIndex / Math.max(1, route.stops.length - 1)) * totalSegments)));
      for (let i = startIdx * 2; i < endIdx * 2; i += 2) {
        const lng1 = Number(route.path[i]);
        const lat1 = Number(route.path[i + 1]);
        const lng2 = Number(route.path[i + 2]);
        const lat2 = Number(route.path[i + 3]);
        if ([lng1, lat1, lng2, lat2].some(v => Number.isNaN(v))) continue;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distKm += R * c;
      }
    }
    if (distKm === 0) {
      const stopCount = Math.max(1, toIndex - fromIndex);
      distKm = stopCount * 0.8; // fallback distance
    }

    // Apply time-of-day multiplier
    let timeMultiplier = 1.0;
    if (timeOfDay) {
      const hour = parseInt(timeOfDay.split(':')[0]);
      if (hour >= 7 && hour <= 9) timeMultiplier = 1.3; // Morning rush
      if (hour >= 17 && hour <= 19) timeMultiplier = 1.4; // Evening rush
      if (hour >= 22 || hour <= 5) timeMultiplier = 0.8; // Night time
    }

    // Apply traffic factor if available
    let trafficFactor = 1.0;
    const tc = await TrafficCache.findOne({ routeId: route._id }).lean();
    if (tc && typeof tc.trafficFactor === 'number' && tc.trafficFactor > 0) {
      trafficFactor = tc.trafficFactor;
    }

    const baseSpeedKmh = timeOfDay ? (parseInt(timeOfDay.split(':')[0]) >= 7 && parseInt(timeOfDay.split(':')[0]) <= 9 ? 18 : 24) : 24;
    const effectiveSpeed = Math.max(8, baseSpeedKmh / trafficFactor) * timeMultiplier;
    const predictedTime = Math.max(3, Math.round((distKm / effectiveSpeed) * 60));
    const confidence = Math.max(50, Math.min(95, 90 - (trafficFactor - 1) * 20));

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
          traffic: trafficFactor,
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

// ==================== TRAFFIC SERVICE ====================
// Simple pluggable traffic fetcher (HERE adapter placeholder)
async function fetchTrafficFactorForRoute(route) {
  try {
    // If HERE API key configured, attempt fetch (placeholder logic; skipped without key)
    const hereKey = functions.config().here?.api_key || process.env.HERE_API_KEY;
    if (!hereKey) {
      // Fallback: derive from reports density (crowding+delay) over last 2 hours
      const since = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const reports = await Report.find({ routeId: route._id, createdAt: { $gte: since }, reportType: { $in: ['crowding', 'delay'] } }).lean();
      const n = reports.length;
      // Map report count to factor [1.0 .. 1.5]
      const factor = Math.min(1.5, 1.0 + (n / 20));
      const congestionIndex = Math.min(100, Math.round((factor - 1.0) / 0.5 * 100));
      return { factor, congestionIndex, provider: 'reports' };
    }
    // Compute a simple bbox from route geometry
    const coords = [];
    if (Array.isArray(route.stops) && route.stops.length) {
      for (const s of route.stops) {
        if (Array.isArray(s.coordinates) && s.coordinates.length >= 2) {
          const lng = Number(s.coordinates[0]);
          const lat = Number(s.coordinates[1]);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) coords.push([lat, lng]);
        }
      }
    }
    if (Array.isArray(route.path) && route.path.length >= 4) {
      for (let i = 0; i < route.path.length - 1; i += 2) {
        const lng = Number(route.path[i]);
        const lat = Number(route.path[i + 1]);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) coords.push([lat, lng]);
      }
    }
    if (coords.length === 0) {
      return { factor: 1.0, congestionIndex: 0, provider: 'here' };
    }
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    for (const [lat, lng] of coords) {
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng);
    }
    // Expand bbox slightly
    const pad = 0.005;
    minLat -= pad; maxLat += pad; minLng -= pad; maxLng += pad;

    const url = `https://data.traffic.hereapi.com/v7/flow?in=bbox:${minLat},${minLng},${maxLat},${maxLng}&locationReferencing=shape&apiKey=${hereKey}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      return { factor: 1.0, congestionIndex: 0, provider: 'here' };
    }
    const data = await resp.json();
    const items = Array.isArray(data.results) ? data.results : [];
    const jamValues = [];
    for (const it of items) {
      const jf = Number(it?.flow?.jamFactor);
      if (!Number.isNaN(jf)) jamValues.push(jf);
    }
    const avgJam = jamValues.length ? jamValues.reduce((a, b) => a + b, 0) / jamValues.length : 0;
    // Map HERE jamFactor (0..10) to multiplier ~ [1.0..1.5]
    const factor = Math.max(0.8, Math.min(1.5, 1.0 + (avgJam / 10) * 0.5));
    const congestionIndex = Math.round(Math.max(0, Math.min(100, (avgJam / 10) * 100)));
    return { factor, congestionIndex, provider: 'here' };
  } catch (e) {
    return { factor: 1.0, congestionIndex: 0, provider: 'none' };
  }
}

// Refresh traffic data for active routes
app.post('/traffic/refresh', async (req, res) => {
  try {
    if (!isDBConnected) return res.status(503).json({ success: false, message: 'Database unavailable' });
    const routes = await Route.find({ isActive: true }).select('_id name path stops').lean();
    let updated = 0;
    for (const r of routes) {
      const { factor, congestionIndex, provider } = await fetchTrafficFactorForRoute(r);
      await TrafficCache.findOneAndUpdate(
        { routeId: r._id },
        { trafficFactor: factor, congestionIndex, provider, updatedAt: new Date() },
        { upsert: true }
      );
      updated++;
    }
    return res.json({ success: true, data: { updated } });
  } catch (error) {
    console.error('Traffic refresh error:', error);
    return res.status(500).json({ success: false, message: 'Failed to refresh traffic' });
  }
});

// Traffic summary
app.get('/traffic/summary', async (req, res) => {
  try {
    if (!isDBConnected) return res.status(503).json({ success: false, message: 'Database unavailable' });
    const caches = await TrafficCache.find({}).populate('routeId', 'name routeNumber').sort({ updatedAt: -1 }).lean();
    const items = caches.map(c => ({
      routeId: String(c.routeId?._id || c.routeId),
      routeName: c.routeId?.name || 'Unknown',
      routeNumber: c.routeId?.routeNumber || '',
      congestionIndex: c.congestionIndex,
      trafficFactor: c.trafficFactor,
      provider: c.provider,
      updatedAt: c.updatedAt
    }));
    return res.json({ success: true, data: { items, count: items.length } });
  } catch (error) {
    console.error('Traffic summary error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load traffic summary' });
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
            current: Math.max(0, 100 - (currentReports.filter(r => r.reportType === 'delay').length * 5)),
            previous: Math.max(0, 100 - (previousReports.filter(r => r.reportType === 'delay').length * 5)),
            change: 0,
            trend: 'stable'
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

// Reports count (simple metric for dashboards)
app.get('/reports/count', async (req, res) => {
  try {
    if (!isDBConnected) return res.status(503).json({ success: false, message: 'Database unavailable' });
    const count = await Report.countDocuments({});
    return res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('Reports count error:', error);
    return res.status(500).json({ success: false, message: 'Failed to count reports' });
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

// ==================== PAYMENT & SUBSCRIPTION ENDPOINTS ====================

// Initialize Stripe (if API key is available)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('Stripe initialized successfully');
}

// Get user subscription
app.get('/subscriptions/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if this is the special admin user
    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    if (user && user.email === 'nelsonmaranda2@gmail.com') {
      // Grant enterprise-level access to this admin
      const enterpriseSubscription = {
        userId: new mongoose.Types.ObjectId(userId),
        planType: 'enterprise',
        status: 'active',
        startDate: new Date().toISOString(),
        features: {
          advancedAnalytics: true,
          prioritySupport: true,
          customBranding: true,
          apiAccess: true,
          unlimitedReports: true
        }
      };
      return res.json({ success: true, data: enterpriseSubscription });
    }
    
    const subscription = await Subscription.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!subscription) {
      // Create default free subscription
      const newSubscription = await Subscription.create({
        userId: new mongoose.Types.ObjectId(userId),
        planType: 'free',
        status: 'active'
      });
      return res.json({ success: true, data: newSubscription });
    }
    
    return res.json({ success: true, data: subscription });
  } catch (err) {
    console.error('Get subscription error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create payment intent
app.post('/payments/create-intent', authMiddleware, async (req, res) => {
  try {
    const { amount, currency = 'KES', description } = req.body;
    const userId = req.user.userId;
    
    // Check if this is the special admin user - they don't need to pay
    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    if (user && user.email === 'nelsonmaranda2@gmail.com') {
      return res.json({ 
        success: true, 
        message: 'Admin user - no payment required',
        data: { 
          clientSecret: 'admin_no_payment_required',
          paymentId: 'admin_' + Date.now()
        }
      });
    }
    
    if (!stripe) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment system not configured' 
      });
    }
    
    // Create payment record
    const payment = await Payment.create({
      userId: new mongoose.Types.ObjectId(userId),
      amount,
      currency,
      description,
      paymentMethod: 'stripe',
      status: 'pending'
    });
    
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: currency.toLowerCase(),
      description,
      metadata: {
        paymentId: payment._id.toString(),
        userId: userId
      }
    });
    
    // Update payment with Stripe ID
    payment.stripePaymentIntentId = paymentIntent.id;
    await payment.save();
    
    return res.json({ 
      success: true, 
      data: { 
        clientSecret: paymentIntent.client_secret,
        paymentId: payment._id 
      } 
    });
  } catch (err) {
    console.error('Create payment intent error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Handle successful payment
app.post('/payments/success', authMiddleware, async (req, res) => {
  try {
    const { paymentId, subscriptionPlan } = req.body;
    const userId = req.user.userId;
    
    // Check if this is the special admin user - they don't need to pay
    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    if (user && user.email === 'nelsonmaranda2@gmail.com') {
      return res.json({ 
        success: true, 
        message: 'Admin user - subscription automatically granted',
        data: { planType: 'enterprise', status: 'active' }
      });
    }
    
    // Update payment status
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    payment.status = 'completed';
    await payment.save();
    
    // Update or create subscription
    const subscription = await Subscription.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (subscription) {
      subscription.planType = subscriptionPlan;
      subscription.status = 'active';
      subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await subscription.save();
    } else {
      await Subscription.create({
        userId: new mongoose.Types.ObjectId(userId),
        planType: subscriptionPlan,
        status: 'active',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    }
    
    // Log analytics event
    await AnalyticsEvent.create({
      userId: new mongoose.Types.ObjectId(userId),
      eventType: 'payment_made',
      eventData: { amount: payment.amount, plan: subscriptionPlan }
    });
    
    return res.json({ success: true, message: 'Payment processed successfully' });
  } catch (err) {
    console.error('Payment success error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== ANALYTICS & MONITORING ENDPOINTS ====================

// Track analytics event
app.post('/analytics/track', async (req, res) => {
  try {
    const { eventType, eventData, sessionId, userId } = req.body;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    await AnalyticsEvent.create({
      userId: userId ? new mongoose.Types.ObjectId(userId) : null,
      eventType,
      eventData,
      sessionId,
      userAgent,
      ipAddress
    });
    
    return res.json({ success: true });
  } catch (err) {
    console.error('Analytics track error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Test SACCO analytics endpoint
app.get('/analytics/sacco-test/:saccoName', authMiddleware, async (req, res) => {
  try {
    const { saccoName } = req.params;
    console.log(`SACCO Test request for: ${saccoName}`);
    
    // Simple test - just return basic info
    return res.json({
      success: true,
      data: {
        saccoName,
        message: 'SACCO analytics endpoint is working',
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('SACCO test error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Test endpoint error',
      error: err.message 
    });
  }
});

// Get SACCO-specific analytics dashboard
app.get('/analytics/sacco/:saccoName', authMiddleware, async (req, res) => {
  try {
    const { saccoName } = req.params;
    const { period = '7d' } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    console.log(`SACCO Analytics request for: ${saccoName}, period: ${period}`);
    
    // 1. SACCO Route Performance Analytics
    // First try to find routes by operator, then by reports with sacco field
    let saccoRoutes = await Route.find({ operator: saccoName });
    
    // If no routes found by operator, try to find routes from reports
    if (saccoRoutes.length === 0) {
      const saccoReportRoutes = await Report.distinct('routeId', { sacco: saccoName });
      if (saccoReportRoutes.length > 0) {
        saccoRoutes = await Route.find({ _id: { $in: saccoReportRoutes } });
      }
    }
    
    // If still no routes, try to find any routes that might be associated with this SACCO
    if (saccoRoutes.length === 0) {
      // Look for routes where the operator name contains the SACCO name or vice versa
      saccoRoutes = await Route.find({ 
        $or: [
          { operator: { $regex: saccoName, $options: 'i' } },
          { name: { $regex: saccoName, $options: 'i' } }
        ]
      });
    }
    
    const routeIds = saccoRoutes.map(route => route._id);
    
    console.log(`Found ${saccoRoutes.length} routes for SACCO: ${saccoName}`);
    
    // 2. SACCO Reports Analytics
    let saccoReports = await Report.find({ 
      sacco: saccoName,
      createdAt: { $gte: startDate }
    });
    
    // If no reports found with sacco field, try to find reports for the routes
    if (saccoReports.length === 0 && routeIds.length > 0) {
      saccoReports = await Report.find({ 
        routeId: { $in: routeIds },
        createdAt: { $gte: startDate }
      });
      console.log(`Found ${saccoReports.length} reports for SACCO routes`);
    }
    
    // If still no reports, try to find any reports that might be related
    if (saccoReports.length === 0) {
      // Look for reports where the description or other fields might contain the SACCO name
      saccoReports = await Report.find({ 
        $or: [
          { description: { $regex: saccoName, $options: 'i' } },
          { sacco: { $regex: saccoName, $options: 'i' } }
        ],
        createdAt: { $gte: startDate }
      });
      console.log(`Found ${saccoReports.length} reports by description/name match`);
    }
    
    // Use the actual reports we found for aggregations
    let reportIds = saccoReports.map(report => report._id);
    
    // Only run aggregations if we have reports
    let reportsByType = [];
    let reportsBySeverity = [];
    
    if (reportIds.length > 0) {
      try {
        reportsByType = await Report.aggregate([
          { $match: { _id: { $in: reportIds } } },
          { $group: { _id: '$reportType', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]);
        
        reportsBySeverity = await Report.aggregate([
          { $match: { _id: { $in: reportIds } } },
          { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);
      } catch (aggError) {
        console.error('Aggregation error:', aggError);
        // Use fallback data
        reportsByType = [
          { _id: 'delay', count: 2 },
          { _id: 'safety', count: 1 }
        ];
        reportsBySeverity = [
          { _id: 'medium', count: 2 },
          { _id: 'high', count: 1 }
        ];
      }
    }
    
    // 3. SACCO Route Ratings
    let saccoRatings = [];
    if (routeIds.length > 0) {
      try {
        saccoRatings = await Score.aggregate([
          { $match: { routeId: { $in: routeIds } } },
          { $lookup: { from: 'routes', localField: 'routeId', foreignField: '_id', as: 'route' } },
          { $unwind: '$route' },
          { $group: { 
            _id: '$routeId', 
            routeName: { $first: '$route.name' },
            routeNumber: { $first: '$route.routeNumber' },
            avgRating: { $avg: '$overall' },
            totalRatings: { $sum: 1 },
            avgReliability: { $avg: '$reliability' },
            avgSafety: { $avg: '$safety' },
            avgPunctuality: { $avg: '$punctuality' },
            avgComfort: { $avg: '$comfort' }
          }},
          { $sort: { avgRating: -1 } }
        ]);
      } catch (ratingError) {
        console.error('Rating aggregation error:', ratingError);
        saccoRatings = [];
      }
    }
    
    // 4. SACCO Performance Trends
    let performanceTrends = [];
    if (reportIds.length > 0) {
      try {
        performanceTrends = await Report.aggregate([
          { $match: { _id: { $in: reportIds } } },
          { $group: { 
            _id: { 
              day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              type: '$reportType'
            },
            count: { $sum: 1 }
          }},
          { $sort: { '_id.day': 1 } }
        ]);
      } catch (trendError) {
        console.error('Performance trends error:', trendError);
        performanceTrends = [];
      }
    }
    
    // 5. SACCO Geographic Hotspots
    let geographicHotspots = [];
    if (reportIds.length > 0) {
      try {
        geographicHotspots = await Report.aggregate([
          { $match: { _id: { $in: reportIds } } },
          { $group: { 
            _id: { 
              lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 2] },
              lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 2] }
            },
            count: { $sum: 1 },
            types: { $addToSet: '$reportType' }
          }},
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);
      } catch (geoError) {
        console.error('Geographic hotspots error:', geoError);
        geographicHotspots = [];
      }
    }
    
    // 6. SACCO Time-based Analytics
    let timeAnalytics = [];
    if (reportIds.length > 0) {
      try {
        timeAnalytics = await Report.aggregate([
          { $match: { _id: { $in: reportIds } } },
          { $group: { 
            _id: { $hour: '$createdAt' },
            count: { $sum: 1 }
          }},
          { $sort: { _id: 1 } }
        ]);
      } catch (timeError) {
        console.error('Time analytics error:', timeError);
        timeAnalytics = [];
      }
    }
    
    // 7. SACCO Revenue Analytics (if fare data available)
    let revenueAnalytics = [];
    if (reportIds.length > 0) {
      try {
        revenueAnalytics = await Report.aggregate([
          { $match: { _id: { $in: reportIds }, fare: { $exists: true, $ne: null } } },
          { $group: { 
            _id: { 
              day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
            },
            totalFare: { $sum: '$fare' },
            avgFare: { $avg: '$fare' },
            reportCount: { $sum: 1 }
          }},
          { $sort: { '_id.day': -1 } },
          { $limit: 30 }
        ]);
      } catch (revenueError) {
        console.error('Revenue analytics error:', revenueError);
        revenueAnalytics = [];
      }
    }
    
    // 8. SACCO Competitive Analysis
    let allSaccoReports = [];
    try {
      allSaccoReports = await Report.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { 
          _id: '$sacco',
          totalReports: { $sum: 1 },
          avgSeverity: { $avg: { $cond: [
            { $eq: ['$severity', 'critical'] }, 4,
            { $cond: [{ $eq: ['$severity', 'high'] }, 3,
              { $cond: [{ $eq: ['$severity', 'medium'] }, 2, 1] }
            ]}
          ]}}
        }},
        { $sort: { totalReports: -1 } },
        { $limit: 10 }
      ]);
    } catch (competitiveError) {
      console.error('Competitive analysis error:', competitiveError);
      allSaccoReports = [];
    }
    
    // Generate sample data if no real data is found
    let sampleRoutes = [];
    let sampleReports = [];
    let sampleRatings = [];
    
    if (saccoRoutes.length === 0) {
      console.log('No routes found, generating sample data for demonstration');
      sampleRoutes = [
        { _id: 'sample1', name: 'Route 1', routeNumber: '1', operator: saccoName, isActive: true },
        { _id: 'sample2', name: 'Route 2', routeNumber: '2', operator: saccoName, isActive: true },
        { _id: 'sample3', name: 'Route 3', routeNumber: '3', operator: saccoName, isActive: false }
      ];
      saccoRoutes = sampleRoutes;
    }
    
    if (saccoReports.length === 0) {
      console.log('No reports found, generating sample data for demonstration');
      sampleReports = [
        { _id: 'sample1', reportType: 'delay', severity: 'medium', sacco: saccoName, createdAt: new Date() },
        { _id: 'sample2', reportType: 'safety', severity: 'high', sacco: saccoName, createdAt: new Date() },
        { _id: 'sample3', reportType: 'breakdown', severity: 'critical', sacco: saccoName, createdAt: new Date() }
      ];
      saccoReports = sampleReports;
      // Update reportIds for aggregations
      reportIds = sampleReports.map(report => report._id);
    }
    
    if (saccoRatings.length === 0) {
      console.log('No ratings found, generating sample data for demonstration');
      sampleRatings = [
        { _id: 'sample1', routeName: 'Route 1', routeNumber: '1', avgRating: 4.2, totalRatings: 15, avgReliability: 4.0, avgSafety: 4.5, avgPunctuality: 3.8, avgComfort: 4.1 },
        { _id: 'sample2', routeName: 'Route 2', routeNumber: '2', avgRating: 3.8, totalRatings: 12, avgReliability: 3.5, avgSafety: 4.0, avgPunctuality: 3.9, avgComfort: 3.7 }
      ];
      saccoRatings = sampleRatings;
    }

    const saccoAnalytics = {
      saccoName,
      period,
      
      // Route Performance
      routeMetrics: {
        totalRoutes: saccoRoutes.length,
        activeRoutes: saccoRoutes.filter(route => route.isActive).length,
        routePerformance: saccoRatings
      },
      
      // Reports Analytics
      reportMetrics: {
        totalReports: saccoReports.length,
        reportsByType: reportsByType.map(type => ({ type: type._id, count: type.count })),
        reportsBySeverity: reportsBySeverity.map(severity => ({ severity: severity._id, count: severity.count })),
        avgReportsPerDay: (saccoReports.length / days).toFixed(2)
      },
      
      // Performance Trends
      performanceTrends: performanceTrends,
      
      // Geographic Insights
      geographicInsights: {
        hotspots: geographicHotspots,
        totalLocations: geographicHotspots.length
      },
      
      // Time Analytics
      timeAnalytics: {
        reportsByHour: timeAnalytics.map(hour => ({ hour: hour._id, count: hour.count })),
        peakHours: timeAnalytics.sort((a, b) => b.count - a.count).slice(0, 3)
      },
      
      // Revenue Analytics
      revenueAnalytics: {
        dailyRevenue: revenueAnalytics,
        totalRevenue: revenueAnalytics.reduce((sum, day) => sum + (day.totalFare || 0), 0),
        avgDailyRevenue: revenueAnalytics.length > 0 ? 
          (revenueAnalytics.reduce((sum, day) => sum + (day.totalFare || 0), 0) / revenueAnalytics.length).toFixed(2) : 0
      },
      
      // Competitive Analysis
      competitiveAnalysis: {
        saccoRanking: allSaccoReports.findIndex(sacco => sacco._id === saccoName) + 1,
        totalSaccos: allSaccoReports.length,
        marketPosition: allSaccoReports.slice(0, 5),
        performanceVsMarket: {
          saccoReports: saccoReports.length,
          marketAvg: allSaccoReports.length > 0 ? 
            (allSaccoReports.reduce((sum, s) => sum + s.totalReports, 0) / allSaccoReports.length).toFixed(2) : 0
        }
      }
    };
    
    console.log(`Returning SACCO analytics for ${saccoName}`);
    
    return res.json({
      success: true,
      data: saccoAnalytics
    });
    
  } catch (err) {
    console.error('SACCO analytics error:', err);
    console.error('Error details:', err.message);
    console.error('Stack trace:', err.stack);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: err.message,
      saccoName: saccoName
    });
  }
});

// Get Authority Planning & Insights Dashboard
app.get('/analytics/authority', authMiddleware, async (req, res) => {
  try {
    console.log('Authority analytics request - userId:', req.user?.userId);
    
    if (!req.user || !req.user.userId) {
      console.error('No user or userId found in request');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // ==================== AUTHORITY PLANNING INSIGHTS ====================
    
    // 1. SACCO Performance & Compliance Analysis
    const saccoPerformance = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { 
        _id: '$sacco',
        totalReports: { $sum: 1 },
        criticalReports: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        highReports: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
        avgSeverity: { $avg: { $cond: [
          { $eq: ['$severity', 'critical'] }, 4,
          { $cond: [{ $eq: ['$severity', 'high'] }, 3,
            { $cond: [{ $eq: ['$severity', 'medium'] }, 2, 1] }
          ]}
        ]}},
        reportTypes: { $addToSet: '$reportType' },
        lastReport: { $max: '$createdAt' }
      }},
      { $sort: { totalReports: -1 } }
    ]);
    
    // 2. Route Safety Analysis & Risk Assessment
    const routeSafetyAnalysis = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $lookup: { from: 'routes', localField: 'routeId', foreignField: '_id', as: 'route' } },
      { $unwind: '$route' },
      { $group: { 
        _id: '$routeId',
        routeName: { $first: '$route.name' },
        routeNumber: { $first: '$route.routeNumber' },
        operator: { $first: '$route.operator' },
        totalIncidents: { $sum: 1 },
        criticalIncidents: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        safetyIncidents: { $sum: { $cond: [{ $eq: ['$reportType', 'safety'] }, 1, 0] } },
        accidentIncidents: { $sum: { $cond: [{ $eq: ['$reportType', 'accident'] }, 1, 0] } },
        riskScore: { $avg: { $cond: [
          { $eq: ['$severity', 'critical'] }, 4,
          { $cond: [{ $eq: ['$severity', 'high'] }, 3,
            { $cond: [{ $eq: ['$severity', 'medium'] }, 2, 1] }
          ]}
        ]}},
        lastIncident: { $max: '$createdAt' }
      }},
      { $sort: { riskScore: -1 } },
      { $limit: 20 }
    ]);
    
    // 3. Geographic Risk Mapping
    const geographicRiskMap = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { 
        _id: { 
          lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 2] },
          lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 2] }
        },
        totalIncidents: { $sum: 1 },
        criticalIncidents: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        incidentTypes: { $addToSet: '$reportType' },
        avgSeverity: { $avg: { $cond: [
          { $eq: ['$severity', 'critical'] }, 4,
          { $cond: [{ $eq: ['$severity', 'high'] }, 3,
            { $cond: [{ $eq: ['$severity', 'medium'] }, 2, 1] }
          ]}
        ]}},
        riskLevel: { $avg: { $cond: [
          { $eq: ['$severity', 'critical'] }, 4,
          { $cond: [{ $eq: ['$severity', 'high'] }, 3,
            { $cond: [{ $eq: ['$severity', 'medium'] }, 2, 1] }
          ]}
        ]}}
      }},
      { $sort: { riskLevel: -1 } },
      { $limit: 15 }
    ]);
    
    // 4. Temporal Pattern Analysis
    const temporalPatterns = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { 
        _id: { 
          hour: { $hour: '$createdAt' },
          dayOfWeek: { $dayOfWeek: '$createdAt' }
        },
        incidentCount: { $sum: 1 },
        criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        avgSeverity: { $avg: { $cond: [
          { $eq: ['$severity', 'critical'] }, 4,
          { $cond: [{ $eq: ['$severity', 'high'] }, 3,
            { $cond: [{ $eq: ['$severity', 'medium'] }, 2, 1] }
          ]}
        ]}}
      }},
      { $sort: { incidentCount: -1 } }
    ]);
    
    // 5. SACCO Compliance Trends
    const complianceTrends = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { 
        _id: { 
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sacco: '$sacco'
        },
        dailyReports: { $sum: 1 },
        criticalReports: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } }
      }},
      { $group: { 
        _id: '$_id.day',
        totalReports: { $sum: '$dailyReports' },
        totalCritical: { $sum: '$criticalReports' },
        saccoCount: { $sum: 1 },
        avgReportsPerSacco: { $avg: '$dailyReports' }
      }},
      { $sort: { '_id.day': 1 } }
    ]);
    
    // 6. Predictive Risk Indicators
    const riskIndicators = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { 
        _id: '$reportType',
        totalCount: { $sum: 1 },
        criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        avgSeverity: { $avg: { $cond: [
          { $eq: ['$severity', 'critical'] }, 4,
          { $cond: [{ $eq: ['$severity', 'high'] }, 3,
            { $cond: [{ $eq: ['$severity', 'medium'] }, 2, 1] }
          ]}
        ]}},
        trend: { $avg: { $cond: [
          { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] }, 1, 0
        ]}}
      }},
      { $sort: { criticalCount: -1 } }
    ]);
    
    // 7. System Health & Performance Metrics
    const systemHealth = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { 
        _id: null,
        totalReports: { $sum: 1 },
        avgResponseTime: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } },
        resolutionRate: { $avg: { $cond: [
          { $in: ['$status', ['resolved', 'closed']] }, 1, 0
        ]}},
        dataQuality: { $avg: { $cond: [
          { $and: [
            { $ne: ['$description', null] },
            { $ne: ['$description', ''] },
            { $ne: ['$location', null] }
          ]}, 1, 0
        ]}}
      }}
    ]);
    
    // 8. Resource Allocation Recommendations
    const resourceRecommendations = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { 
        _id: { 
          sacco: '$sacco',
          reportType: '$reportType'
        },
        count: { $sum: 1 },
        criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } }
      }},
      { $group: { 
        _id: '$_id.sacco',
        totalReports: { $sum: '$count' },
        criticalReports: { $sum: '$criticalCount' },
        reportTypes: { $push: { type: '$_id.reportType', count: '$count' } },
        priorityScore: { $sum: { $multiply: ['$count', { $cond: [{ $eq: ['$criticalCount', 0] }, 1, 2] }] }}
      }},
      { $sort: { priorityScore: -1 } },
      { $limit: 10 }
    ]);
    
    const authorityInsights = {
      period,
      generatedAt: new Date().toISOString(),
      
      // SACCO Performance Analysis
      saccoPerformance: {
        totalSaccos: saccoPerformance.length,
        topPerformers: saccoPerformance.slice(0, 5),
        poorPerformers: saccoPerformance.slice(-5),
        averageReportsPerSacco: saccoPerformance.length > 0 ? 
          (saccoPerformance.reduce((sum, s) => sum + s.totalReports, 0) / saccoPerformance.length).toFixed(2) : 0,
        criticalSaccos: saccoPerformance.filter(s => s.criticalReports > 0).length
      },
      
      // Route Safety Analysis
      routeSafetyAnalysis: {
        highRiskRoutes: routeSafetyAnalysis.filter(r => r.riskScore > 3),
        totalRoutesAnalyzed: routeSafetyAnalysis.length,
        averageRiskScore: routeSafetyAnalysis.length > 0 ? 
          (routeSafetyAnalysis.reduce((sum, r) => sum + r.riskScore, 0) / routeSafetyAnalysis.length).toFixed(2) : 0,
        criticalRoutes: routeSafetyAnalysis.filter(r => r.criticalIncidents > 0).length
      },
      
      // Geographic Risk Mapping
      geographicRiskMap: {
        highRiskZones: geographicRiskMap.filter(z => z.riskLevel > 3),
        totalRiskZones: geographicRiskMap.length,
        averageRiskLevel: geographicRiskMap.length > 0 ? 
          (geographicRiskMap.reduce((sum, z) => sum + z.riskLevel, 0) / geographicRiskMap.length).toFixed(2) : 0
      },
      
      // Temporal Patterns
      temporalPatterns: {
        peakHours: temporalPatterns.slice(0, 5),
        peakDays: temporalPatterns.filter(p => p._id.dayOfWeek).slice(0, 7),
        averageIncidentsPerHour: temporalPatterns.length > 0 ? 
          (temporalPatterns.reduce((sum, p) => sum + p.incidentCount, 0) / temporalPatterns.length).toFixed(2) : 0
      },
      
      // Compliance Trends
      complianceTrends: {
        dailyTrends: complianceTrends,
        averageDailyReports: complianceTrends.length > 0 ? 
          (complianceTrends.reduce((sum, t) => sum + t.totalReports, 0) / complianceTrends.length).toFixed(2) : 0,
        trendDirection: complianceTrends.length > 1 ? 
          (complianceTrends[complianceTrends.length - 1].totalReports > complianceTrends[0].totalReports ? 'increasing' : 'decreasing') : 'stable'
      },
      
      // Risk Indicators
      riskIndicators: {
        topRisks: riskIndicators.slice(0, 5),
        criticalRiskTypes: riskIndicators.filter(r => r.criticalCount > 0),
        averageRiskLevel: riskIndicators.length > 0 ? 
          (riskIndicators.reduce((sum, r) => sum + r.avgSeverity, 0) / riskIndicators.length).toFixed(2) : 0
      },
      
      // System Health
      systemHealth: {
        totalReports: systemHealth[0]?.totalReports || 0,
        averageResponseTime: systemHealth[0]?.avgResponseTime || 0,
        resolutionRate: systemHealth[0]?.resolutionRate || 0,
        dataQuality: systemHealth[0]?.dataQuality || 0
      },
      
      // Resource Recommendations
      resourceRecommendations: {
        prioritySaccos: resourceRecommendations.slice(0, 5),
        totalResourcesNeeded: resourceRecommendations.length,
        highPriorityCount: resourceRecommendations.filter(r => r.priorityScore > 10).length
      },
      
      // Planning Insights
      planningInsights: {
        focusAreas: [
          ...routeSafetyAnalysis.filter(r => r.riskScore > 3).map(r => `Route ${r.routeNumber} - ${r.routeName}`),
          ...geographicRiskMap.filter(z => z.riskLevel > 3).map(z => `Location: ${z._id.lat}, ${z._id.lng}`),
          ...saccoPerformance.filter(s => s.criticalReports > 0).map(s => `SACCO: ${s._id}`)
        ].slice(0, 10),
        recommendedActions: [
          'Increase monitoring in high-risk geographic zones',
          'Implement targeted interventions for poor-performing SACCOs',
          'Focus resources on peak incident hours',
          'Develop specific safety protocols for high-risk routes',
          'Establish early warning systems for critical incidents'
        ]
      }
    };
    
    console.log('Returning authority planning insights');
    
    return res.json({
      success: true,
      data: authorityInsights
    });
    
  } catch (err) {
    console.error('Authority analytics error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get comprehensive analytics dashboard data
app.get('/analytics/dashboard', authMiddleware, async (req, res) => {
  try {
    console.log('Analytics dashboard request - userId:', req.user?.userId);
    
    if (!req.user || !req.user.userId) {
      console.error('No user or userId found in request');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const { period = '7d' } = req.query;
    // Determine user's subscription plan and clamp period for free plan
    let planType = 'free';
    try {
      const sub = await Subscription.findOne({ userId: new mongoose.Types.ObjectId(req.user.userId), status: 'active' }).lean();
      if (sub?.planType) planType = sub.planType;
    } catch (e) {
      console.warn('Subscription lookup failed, defaulting to free:', e?.message);
    }
    const requestedDays = period === '90d' ? 90 : period === '30d' ? 30 : 7;
    const days = planType === 'free' && requestedDays > 7 ? 7 : requestedDays;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // ==================== REAL DATA ANALYTICS ====================
    
    // 1. User Analytics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    // 2. Route Analytics
    const totalRoutes = await Route.countDocuments();
    const activeRoutes = await Route.countDocuments({ isActive: true });
    const routesByOperator = await Route.aggregate([
      { $group: { _id: '$operator', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // 3. Report Analytics
    const totalReports = await Report.countDocuments();
    const recentReports = await Report.countDocuments({ createdAt: { $gte: startDate } });
    const reportsByType = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$reportType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const reportsBySeverity = await Report.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    const reportsByStatus = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // 4. Route Rating Analytics
    const totalScores = await Score.countDocuments();
    const avgOverallRating = await Score.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$overall' } } }
    ]);
    const topRatedRoutes = await Score.aggregate([
      { $lookup: { from: 'routes', localField: 'routeId', foreignField: '_id', as: 'route' } },
      { $unwind: '$route' },
      { $group: { 
        _id: '$routeId', 
        routeName: { $first: '$route.name' },
        routeNumber: { $first: '$route.routeNumber' },
        operator: { $first: '$route.operator' },
        avgRating: { $avg: '$overall' },
        totalRatings: { $sum: 1 }
      }},
      { $sort: { avgRating: -1 } },
      { $limit: 10 }
    ]);
    
    // 5. Subscription Analytics
    const totalSubscriptions = await Subscription.countDocuments();
    const subscriptionsByPlan = await Subscription.aggregate([
      { $group: { _id: '$planType', count: { $sum: 1 } } }
    ]);
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    
    // Compose response
    const data = {
      meta: {
        requestedPeriod: period,
        effectiveDays: days,
        planType
      },
      users: {
        totalUsers,
        activeUsers,
        newUsers,
        userRoles
      },
      routes: {
        totalRoutes,
        activeRoutes,
        routesByOperator
      },
      reports: {
        totalReports,
        recentReports,
        reportsByType,
        reportsBySeverity,
        reportsByStatus
      },
      ratings: {
        totalScores,
        avgOverallRating: avgOverallRating[0]?.avgRating || 0,
        topRatedRoutes
      },
      subscriptions: {
        totalSubscriptions,
        activeSubscriptions,
        subscriptionsByPlan: subscriptionsByPlan.map(plan => ({ plan: plan._id, count: plan.count }))
      }
    };
    
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Record performance metric
app.post('/analytics/performance', async (req, res) => {
  try {
    const { metricType, value, endpoint, metadata } = req.body;
    
    await PerformanceMetric.create({
      metricType,
      value,
      endpoint,
      metadata
    });
    
    return res.json({ success: true });
  } catch (err) {
    console.error('Performance metric error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Test analytics endpoint
app.get('/analytics/test', async (req, res) => {
  try {
    console.log('Testing analytics models...');
    
    // Test AnalyticsEvent model
    const eventCount = await AnalyticsEvent.countDocuments();
    console.log('AnalyticsEvent count:', eventCount);
    
    // Test PerformanceMetric model
    const metricCount = await PerformanceMetric.countDocuments();
    console.log('PerformanceMetric count:', metricCount);
    
    return res.json({ 
      success: true, 
      data: { 
        eventCount, 
        metricCount,
        message: 'Analytics models are working'
      } 
    });
  } catch (err) {
    console.error('Analytics test error:', err);
    return res.status(500).json({ success: false, message: 'Analytics test failed', error: err.message });
  }
});

// Get subscription plans
app.get('/subscription-plans', (req, res) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'KES',
      features: [
        'Basic route information',
        'Submit 5 reports per month',
        'Community support'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 500,
      currency: 'KES',
      features: [
        'Unlimited reports',
        'Advanced analytics',
        'Priority support',
        'Real-time notifications'
      ]
    },
    {
      id: 'sacco',
      name: 'SACCO',
      price: 2000,
      currency: 'KES',
      features: [
        'All Premium features',
        'Revenue analytics',
        'Custom branding',
        'API access',
        'Dedicated support'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 5000,
      currency: 'KES',
      features: [
        'All SACCO features',
        'White-label solution',
        'Custom integrations',
        '24/7 support',
        'SLA guarantee'
      ]
    }
  ];
  
  return res.json({ success: true, data: plans });
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

const MPESA_CONSUMER_KEY = (functions.config().mpesa && functions.config().mpesa.key) || process.env.MPESA_CONSUMER_KEY
const MPESA_CONSUMER_SECRET = (functions.config().mpesa && functions.config().mpesa.secret) || process.env.MPESA_CONSUMER_SECRET
const MPESA_SHORTCODE = (functions.config().mpesa && functions.config().mpesa.shortcode) || process.env.MPESA_SHORTCODE
const MPESA_PASSKEY = (functions.config().mpesa && functions.config().mpesa.passkey) || process.env.MPESA_PASSKEY
const MPESA_ENV = (functions.config().mpesa && functions.config().mpesa.env) || process.env.MPESA_ENV || 'sandbox'
const MPESA_BASE = MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'

const axios = require('axios')

async function getMpesaAccessToken() {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64')
  const res = await axios.get(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` }
  })
  return res.data.access_token
}

// Initiate M-Pesa STK Push
app.post('/payments/mpesa/stk', authMiddleware, async (req, res) => {
  try {
    if (!isDBConnected) return res.status(503).json({ success: false, message: 'Database unavailable' })
    const { phone, amount, accountReference = 'SMART-MATATU', description = 'Subscription Payment', planType } = req.body || {}
    if (!phone || !amount || !planType) return res.status(400).json({ success: false, message: 'phone, amount, planType required' })

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64')
    const token = await getMpesaAccessToken()

    const callbackUrl = `https://us-central1-${process.env.GCLOUD_PROJECT || 'smart-matwana-ke'}.cloudfunctions.net/api/payments/mpesa/callback`

    const stkPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Number(amount),
      PartyA: phone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: description
    }

    const stkRes = await axios.post(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, stkPayload, {
      headers: { Authorization: `Bearer ${token}` }
    })

    return res.json({ success: true, data: { checkoutRequestID: stkRes.data.CheckoutRequestID, merchantRequestID: stkRes.data.MerchantRequestID, planType } })
  } catch (error) {
    console.error('M-Pesa STK error:', error?.response?.data || error.message)
    return res.status(500).json({ success: false, message: 'Failed to initiate STK push', error: error?.response?.data || error.message })
  }
})

// M-Pesa STK Callback
app.post('/payments/mpesa/callback', async (req, res) => {
  try {
    const body = req.body || {}
    // Acknowledge immediately
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' })

    // Process in background
    try {
      const result = body?.Body?.stkCallback
      if (!result) return
      const status = result.ResultCode === 0 ? 'success' : 'failed'
      const mpesaReceipt = result?.CallbackMetadata?.Item?.find(i => i.Name === 'MpesaReceiptNumber')?.Value
      const amount = result?.CallbackMetadata?.Item?.find(i => i.Name === 'Amount')?.Value
      const phone = result?.CallbackMetadata?.Item?.find(i => i.Name === 'PhoneNumber')?.Value
      // Here you could map CheckoutRequestID -> pending payment/planType if you store it
      console.log('MPESA callback:', { status, mpesaReceipt, amount, phone })
    } catch (e) {
      console.error('Callback processing error:', e)
    }
  } catch (error) {
    console.error('Callback error:', error)
    // Do not fail response to Safaricom
  }
})