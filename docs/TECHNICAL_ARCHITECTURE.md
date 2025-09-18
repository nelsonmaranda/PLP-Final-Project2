# Technical Architecture

## 🏗️ System Overview

The Smart Matatu System is built as a responsive web application using modern web technologies, designed to work seamlessly across all device types and screen sizes.

## 🎯 Architecture Principles

1. **Mobile-First**: Responsive design starting from mobile devices
2. **Progressive Enhancement**: Core functionality works everywhere
3. **Performance**: Fast loading and smooth interactions
4. **Scalability**: Handle growth from pilot to city-wide deployment
5. **Security**: Protect user data and prevent abuse
6. **Accessibility**: Inclusive design for all users

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Devices                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Mobile    │  │   Tablet    │  │  Desktop    │        │
│  │  (320px+)   │  │  (768px+)   │  │ (1024px+)   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WSS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Firebase Hosting                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              CDN & Edge Caching                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Firebase Cloud Functions                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Gateway & Auth                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Database Queries
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                MongoDB Atlas                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Document Database                       │   │
│  │  • Users • Routes • Reports • Scores                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Frontend Architecture

### Technology Stack
- **React 18**: Component-based UI library
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Mapbox GL JS**: Interactive maps
- **PWA**: Progressive Web App capabilities

### Component Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI elements
│   ├── forms/           # Form components
│   ├── maps/            # Map-related components
│   └── layout/          # Layout components
├── screens/             # Page components
│   ├── Home.jsx
│   ├── MapView.jsx
│   ├── ReportForm.jsx
│   ├── Login.jsx
│   └── Admin.jsx
├── hooks/               # Custom React hooks
├── services/            # API and external services
├── utils/               # Utility functions
├── contexts/            # React contexts
└── styles/              # Global styles
```

### Responsive Design Strategy
```css
/* Mobile First Breakpoints */
@media (min-width: 320px) { /* Mobile */ }
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Large Desktop */ }
```

### State Management
- **React Context**: Global state (user, language, theme)
- **useReducer**: Complex state logic
- **Local Storage**: User preferences and offline data
- **Service Worker**: Background sync and caching

## ⚙️ Backend Architecture

### Technology Stack
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **TypeScript**: Type-safe development
- **MongoDB**: Document database
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication tokens
- **Firebase Cloud Functions**: Serverless deployment

### API Structure
```
src/
├── controllers/         # Request handlers
├── models/             # Database models
├── routes/             # API endpoints
├── middleware/         # Custom middleware
├── services/           # Business logic
├── utils/              # Utility functions
└── config/             # Configuration
```

### Database Schema
```javascript
// User Model
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  displayName: String,
  role: String, // 'user', 'moderator', 'admin'
  savedRoutes: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}

// Route Model
{
  _id: ObjectId,
  name: String,
  description: String,
  path: GeoJSON LineString,
  stops: [GeoJSON Point],
  sacco: String,
  createdAt: Date,
  updatedAt: Date
}

// Report Model
{
  _id: ObjectId,
  userId: ObjectId,
  routeId: ObjectId,
  fare: Number,
  waitTime: Number,
  crowding: String,
  incidentType: String,
  location: GeoJSON Point,
  timestamp: Date,
  createdAt: Date
}

// Score Model
{
  _id: ObjectId,
  routeId: ObjectId,
  timeBucket: String, // 'morning', 'afternoon', 'evening'
  reliabilityScore: Number,
  safetyScore: Number,
  lastUpdated: Date
}
```

## 🔐 Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **bcrypt**: Password hashing
- **Role-based Access**: User, Moderator, Admin roles
- **Rate Limiting**: Prevent API abuse
- **CORS**: Cross-origin resource sharing

### Data Protection
- **HTTPS**: Encrypted communication
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Mongoose ODM
- **XSS Protection**: Content Security Policy
- **CSRF Protection**: SameSite cookies

### Privacy Considerations
- **Data Minimization**: Collect only necessary data
- **User Consent**: Clear privacy policy
- **Data Retention**: Automatic cleanup of old data
- **Anonymization**: Remove PII from analytics

## 📊 Performance Architecture

### Frontend Optimization
- **Code Splitting**: Route-based and component-based
- **Lazy Loading**: Images and components
- **Caching**: Service Worker and HTTP caching
- **Compression**: Gzip and Brotli
- **CDN**: Global content delivery

### Backend Optimization
- **Database Indexing**: Optimized queries
- **Caching**: Redis for frequently accessed data
- **Connection Pooling**: Efficient database connections
- **Compression**: Response compression
- **Monitoring**: Performance metrics

### Mobile Performance
- **Progressive Loading**: Critical content first
- **Offline Support**: Service Worker caching
- **Touch Optimization**: 60fps interactions
- **Battery Efficiency**: Optimized animations

## 🚀 Deployment Architecture

### Firebase Hosting (Frontend)
```json
{
  "hosting": {
    "public": "frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Firebase Cloud Functions (Backend)
```javascript
// functions/index.js
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true }));

// API routes
app.use('/api', require('./routes'));

exports.api = functions.https.onRequest(app);
```

### MongoDB Atlas (Database)
- **Cluster**: Shared cluster for development
- **Replica Set**: High availability
- **Backups**: Automated daily backups
- **Monitoring**: Performance and usage metrics

## 🔄 Data Flow Architecture

### User Journey Flow
```
1. User opens app → Service Worker loads cached content
2. User authenticates → JWT token stored locally
3. User submits report → API validates and stores data
4. System processes data → Updates scores via cron job
5. User views map → Real-time data displayed
6. User receives notifications → Push notifications sent
```

### Real-time Updates
- **WebSocket**: Real-time map updates
- **Server-Sent Events**: Live notifications
- **Polling**: Fallback for older browsers
- **Service Worker**: Background sync

## 📱 PWA Architecture

### Service Worker
```javascript
// sw.js
const CACHE_NAME = 'smart-matatu-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

### Manifest
```json
{
  "name": "Smart Matatu",
  "short_name": "MatatuMap",
  "description": "Nairobi's matatu reliability and safety map",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🔍 Monitoring & Analytics

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS
- **Real User Monitoring**: User experience metrics
- **Error Tracking**: JavaScript and API errors
- **Uptime Monitoring**: Service availability

### Business Analytics
- **User Engagement**: DAU, MAU, session duration
- **Feature Usage**: Most used features
- **Geographic Data**: Usage by location
- **Device Analytics**: Usage by device type

## 🧪 Testing Architecture

### Frontend Testing
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Component integration
- **E2E Tests**: Playwright for user journeys
- **Visual Regression**: Screenshot testing

### Backend Testing
- **Unit Tests**: Jest for business logic
- **Integration Tests**: API endpoint testing
- **Load Testing**: Performance under load
- **Security Testing**: Vulnerability scanning

---

**Last Updated**: Week 1
**Next Review**: Week 3
**Status**: ✅ Complete
