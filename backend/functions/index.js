const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Create Express app
const app = express();

// Trust proxy for Firebase Functions
app.set('trust proxy', true);

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

// Routes endpoint
app.get('/routes', (req, res) => {
  const mockRoutes = [
    {
      _id: '1',
      name: 'Route 42 - Thika Road',
      operator: 'KBS',
      routeNumber: '42',
      path: [[-1.2921, 36.8219], [-1.3000, 36.8000]],
      stops: [
        { name: 'CBD', coordinates: [-1.2921, 36.8219] },
        { name: 'Thika Road', coordinates: [-1.3000, 36.8000] }
      ],
      fare: 50,
      operatingHours: { start: '05:00', end: '22:00' },
      isActive: true,
      score: {
        reliability: 4.1,
        safety: 4.2,
        punctuality: 4.0,
        comfort: 3.8,
        overall: 4.0,
        totalReports: 25,
        lastCalculated: new Date().toISOString()
      }
    },
    {
      _id: '2',
      name: 'Route 34 - Ngong Road',
      operator: 'Citi Hoppa',
      routeNumber: '34',
      path: [[-1.2921, 36.8219], [-1.3100, 36.7500]],
      stops: [
        { name: 'CBD', coordinates: [-1.2921, 36.8219] },
        { name: 'Ngong Road', coordinates: [-1.3100, 36.7500] }
      ],
      fare: 45,
      operatingHours: { start: '05:30', end: '21:30' },
      isActive: true,
      score: {
        reliability: 3.5,
        safety: 3.8,
        punctuality: 3.2,
        comfort: 3.5,
        overall: 3.5,
        totalReports: 18,
        lastCalculated: new Date().toISOString()
      }
    }
  ];
  
  res.json({
    success: true,
    data: { 
      routes: mockRoutes, 
      pagination: { 
        page: 1, 
        limit: 10, 
        total: 2, 
        totalPages: 1 
      } 
    },
    message: 'Routes retrieved successfully'
  });
});

// Scores endpoint
app.get('/scores', (req, res) => {
  const mockScores = [
    {
      _id: '1',
      routeId: '1',
      reliability: 4.1,
      safety: 4.2,
      punctuality: 4.0,
      comfort: 3.8,
      overall: 4.0,
      totalReports: 25,
      lastCalculated: new Date().toISOString()
    },
    {
      _id: '2',
      routeId: '2',
      reliability: 3.5,
      safety: 3.8,
      punctuality: 3.2,
      comfort: 3.5,
      overall: 3.5,
      totalReports: 18,
      lastCalculated: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: { 
      scores: mockScores, 
      pagination: { 
        page: 1, 
        limit: 10, 
        total: 2, 
        totalPages: 1 
      } 
    },
    message: 'Scores retrieved successfully'
  });
});

// Reports endpoint
app.post('/reports', (req, res) => {
  const { routeId, reportType, description, severity, location, isAnonymous } = req.body;
  
  if (!routeId || !reportType) {
    return res.status(400).json({
      success: false,
      message: 'Route ID and report type are required'
    });
  }
  
  const mockReport = {
    _id: Date.now().toString(),
    routeId,
    reportType,
    description: description || '',
    severity: severity || 'medium',
    location: location || { type: 'Point', coordinates: [-1.2921, 36.8219] },
    status: 'pending',
    isAnonymous: isAnonymous || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: mockReport,
    message: 'Report submitted successfully'
  });
});

// Analytics endpoint
app.get('/analytics/summary', (req, res) => {
  const mockAnalytics = {
    totalRoutes: 2,
    totalReports: 43,
    totalUsers: 15,
    averageScore: 3.75,
    topRoutes: [
      { routeId: '1', name: 'Route 42 - Thika Road', score: 4.0 },
      { routeId: '2', name: 'Route 34 - Ngong Road', score: 3.5 }
    ],
    reportTypes: {
      delay: 15,
      breakdown: 8,
      safety: 12,
      crowding: 5,
      other: 3
    },
    lastUpdated: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: mockAnalytics,
    message: 'Analytics retrieved successfully'
  });
});

// Authentication endpoints
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  res.json({
    success: true,
    data: {
      user: {
        _id: '1',
        email,
        displayName: 'Test User',
        role: 'user'
      },
      token: 'mock-jwt-token'
    },
    message: 'Login successful'
  });
});

app.post('/auth/register', (req, res) => {
  const { email, password, displayName } = req.body;
  
  if (!email || !password || !displayName) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and display name are required'
    });
  }
  
  res.status(201).json({
    success: true,
    data: {
      user: {
        _id: Date.now().toString(),
        email,
        displayName,
        role: 'user'
      },
      token: 'mock-jwt-token'
    },
    message: 'Registration successful'
  });
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