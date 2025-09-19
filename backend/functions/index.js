const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://smart-matwana-ke.web.app',
    'https://smart-matwana-ke.firebaseapp.com'
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: 'production',
    version: '1.0.0'
  });
});

// Mock routes endpoint for frontend
app.get('/api/routes', (req, res) => {
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
    data: mockRoutes,
    message: 'Routes retrieved successfully'
  });
});

// Mock scores endpoint
app.get('/api/scores', (req, res) => {
  const mockScores = [
    {
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
    data: mockScores,
    message: 'Scores retrieved successfully'
  });
});

// Mock reports endpoint
app.post('/api/reports', (req, res) => {
  const { routeId, reportType, description, severity } = req.body;
  
  // Basic validation
  if (!routeId || !reportType) {
    return res.status(400).json({
      success: false,
      message: 'Route ID and report type are required'
    });
  }
  
  // Mock successful report creation
  const mockReport = {
    _id: Date.now().toString(),
    routeId,
    reportType,
    description: description || '',
    severity: severity || 'medium',
    status: 'pending',
    isAnonymous: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: mockReport,
    message: 'Report submitted successfully'
  });
});

// Mock authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  // Mock successful login
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

app.post('/api/auth/register', (req, res) => {
  const { email, password, displayName } = req.body;
  
  if (!email || !password || !displayName) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and display name are required'
    });
  }
  
  // Mock successful registration
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Export the Express app as a Cloud Function
exports.api = functions.https.onRequest(app);