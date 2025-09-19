# Week 5: Authentication & User Management

## Overview
Week 5 focused on implementing comprehensive authentication, role-based access control, user management, and enhanced API functionality with proper security measures.

## Completed Tasks

### 1. JWT Authentication System
- **Token-based Auth**: Implemented JWT for secure user authentication
- **Password Hashing**: Added bcrypt for secure password storage
- **Token Management**: Access and refresh token handling
- **Session Management**: Secure user session handling

### 2. Role-Based Access Control (RBAC)
- **User Roles**: Implemented admin, moderator, and user roles
- **Permission System**: Role-based API access control
- **Route Protection**: Protected routes based on user roles
- **Middleware Guards**: Authentication and authorization middleware

### 3. User Management System
- **User Registration**: Complete user signup process
- **User Profiles**: User profile management and updates
- **Saved Routes**: User-specific route bookmarking
- **Account Management**: Password updates and account settings

### 4. Enhanced API Endpoints
- **CRUD Operations**: Full CRUD for routes with role-based access
- **Admin Functions**: Admin-only route management
- **Moderator Tools**: Moderator-specific functionality
- **Analytics API**: Basic analytics and reporting endpoints

## Technical Implementation

### Backend Authentication
```javascript
// JWT Authentication middleware
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Password hashing
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// JWT token generation
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```

### Role-Based Access Control
```javascript
// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Usage examples
router.get('/admin/routes', authenticateToken, authorize('admin'), getAdminRoutes);
router.post('/moderator/approve', authenticateToken, authorize('moderator', 'admin'), approveReport);
```

### Frontend Authentication
```typescript
// Authentication context
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: SignupFormData) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({
  children,
  requiredRole
}) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};
```

## Key Features Delivered

### 1. User Authentication
- **Secure Login**: Email/password authentication with JWT
- **User Registration**: Complete signup process with validation
- **Password Security**: Bcrypt hashing with salt rounds
- **Token Management**: Automatic token refresh and validation

### 2. Role-Based Access
- **Admin Role**: Full system access and management
- **Moderator Role**: Content moderation and approval
- **User Role**: Basic functionality and reporting
- **Permission Checks**: API-level permission validation

### 3. User Management
- **Profile Management**: User profile updates and settings
- **Saved Routes**: Bookmark favorite routes
- **Account Security**: Password change functionality
- **Session Handling**: Secure session management

### 4. Enhanced API Security
- **Protected Endpoints**: Authentication required for sensitive operations
- **Role Validation**: Server-side role checking
- **Input Validation**: Enhanced validation for all user inputs
- **Error Handling**: Comprehensive error responses

## API Endpoints Added

### Authentication Endpoints
- **POST /api/auth/login**: User login
- **POST /api/auth/register**: User registration
- **POST /api/auth/logout**: User logout
- **GET /api/auth/me**: Get current user
- **PUT /api/auth/profile**: Update user profile

### Protected Route Management
- **GET /api/routes**: Get all routes (public)
- **POST /api/routes**: Create route (admin only)
- **PUT /api/routes/:id**: Update route (admin/moderator)
- **DELETE /api/routes/:id**: Delete route (admin only)

### User-Specific Endpoints
- **GET /api/users/saved-routes**: Get user's saved routes
- **POST /api/users/saved-routes**: Save a route
- **DELETE /api/users/saved-routes/:id**: Remove saved route

### Analytics Endpoints
- **GET /api/analytics/overview**: System overview (admin)
- **GET /api/analytics/routes**: Route analytics (admin/moderator)
- **GET /api/analytics/reports**: Report analytics (admin/moderator)

## Database Schema Updates

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password: String, // hashed
  displayName: String,
  role: String, // 'admin', 'moderator', 'user'
  savedRoutes: [ObjectId],
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Enhanced Routes Collection
```javascript
{
  _id: ObjectId,
  name: String,
  operator: String,
  routeNumber: String,
  path: [[Number, Number]], // GeoJSON LineString
  stops: [{
    name: String,
    coordinates: [Number, Number]
  }],
  fare: Number,
  operatingHours: {
    start: String,
    end: String
  },
  isActive: Boolean,
  createdBy: ObjectId, // User ID
  approvedBy: ObjectId, // Moderator/Admin ID
  createdAt: Date,
  updatedAt: Date
}
```

## Security Implementation

### Password Security
- **Bcrypt Hashing**: 12 salt rounds for password hashing
- **Password Validation**: Strong password requirements
- **Secure Storage**: Passwords never stored in plain text
- **Password Reset**: Secure password reset functionality

### JWT Security
- **Secret Key**: Environment-based JWT secret
- **Token Expiration**: 24-hour token lifetime
- **Refresh Tokens**: Automatic token refresh mechanism
- **Secure Headers**: Proper authorization header handling

### API Security
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Proper CORS settings

## Frontend Security Features

### Authentication Flow
- **Automatic Redirects**: Redirect to login for protected routes
- **Token Storage**: Secure token storage in memory
- **Session Persistence**: Remember user session across browser refreshes
- **Logout Handling**: Proper cleanup on logout

### Role-Based UI
- **Conditional Rendering**: Show/hide features based on user role
- **Admin Dashboard**: Admin-only management interface
- **Moderator Tools**: Moderator-specific functionality
- **User Interface**: Role-appropriate user interface

## Testing Coverage

### Authentication Tests
- Login/logout functionality
- Registration process
- Token validation
- Password hashing verification

### Authorization Tests
- Role-based access control
- Protected route access
- Permission validation
- Unauthorized access handling

### User Management Tests
- Profile updates
- Saved routes functionality
- Account management
- Session handling

## Performance Optimizations

### Backend Optimizations
- **Database Indexing**: Optimized queries with proper indexes
- **JWT Caching**: Token validation caching
- **Query Optimization**: Efficient database queries
- **Memory Management**: Proper memory usage for user sessions

### Frontend Optimizations
- **Lazy Loading**: Lazy load protected components
- **Token Caching**: Efficient token storage and retrieval
- **State Management**: Optimized authentication state
- **Bundle Splitting**: Code splitting for authentication features

## Error Handling

### Authentication Errors
- **Invalid Credentials**: Clear error messages for login failures
- **Token Expired**: Automatic redirect to login
- **Permission Denied**: Appropriate error messages
- **Network Errors**: Graceful handling of API failures

### User Experience
- **Loading States**: Loading indicators during authentication
- **Error Messages**: User-friendly error messages
- **Success Feedback**: Confirmation messages for actions
- **Form Validation**: Real-time form validation

## Monitoring & Logging

### Authentication Logging
- **Login Attempts**: Track successful and failed logins
- **Token Usage**: Monitor token generation and validation
- **Security Events**: Log suspicious authentication activities
- **User Activity**: Track user actions and access patterns

### Performance Monitoring
- **Authentication Latency**: Monitor login/logout performance
- **Token Validation**: Track token validation performance
- **Database Queries**: Monitor user-related database performance
- **API Response Times**: Track protected endpoint performance

## Next Steps (Week 6)
- Security audit and hardening
- Performance optimization
- Accessibility improvements
- Error handling enhancements
- PWA implementation

## Files Modified
- `backend/middleware/auth.js`
- `backend/middleware/authorization.js`
- `backend/routes/auth.js`
- `backend/routes/users.js`
- `backend/routes/routes.js`
- `backend/models/User.js`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/components/ProtectedRoute.tsx`
- `frontend/src/screens/Login.tsx`
- `frontend/src/screens/Signup.tsx`
- `frontend/src/services/api.ts`

## Dependencies Added
- `jsonwebtoken`: JWT token handling
- `bcryptjs`: Password hashing
- `zod`: Schema validation
- `express-validator`: Input validation middleware
