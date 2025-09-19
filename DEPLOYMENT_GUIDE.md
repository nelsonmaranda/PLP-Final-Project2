# Smart Matatu Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Node.js 18+** installed

3. **MongoDB Atlas** account for production database

4. **Firebase Project** created at [Firebase Console](https://console.firebase.google.com/)

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `smart-matatu-app`
4. Enable Google Analytics (optional)
5. Create project

### 1.2 Enable Required Services
1. **Firebase Hosting**: Go to Hosting → Get Started
2. **Firebase Functions**: Go to Functions → Get Started
3. **Firebase Authentication**: Go to Authentication → Get Started → Sign-in method → Enable Email/Password

### 1.3 Get Firebase Configuration
1. Go to Project Settings → General
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app
4. Register app with name: `smart-matatu-web`
5. Copy the Firebase configuration object

## Step 2: Environment Configuration

### 2.1 Backend Environment Variables
Create `backend/.env` with:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-matatu?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGIN=https://smart-matatu-app.web.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2.2 Frontend Environment Variables
Create `frontend/.env.production` with:
```env
VITE_API_BASE_URL=https://us-central1-smart-matatu-app.cloudfunctions.net/api
VITE_APP_NAME=Smart Matatu
VITE_APP_VERSION=1.0.0
```

## Step 3: Database Setup

### 3.1 MongoDB Atlas Configuration
1. Create a new cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Choose a cloud provider and region
3. Create database user with read/write permissions
4. Whitelist IP addresses (0.0.0.0/0 for Cloud Functions)
5. Get connection string and update `MONGODB_URI` in backend/.env

### 3.2 Database Collections
The following collections will be created automatically:
- `users` - User accounts and profiles
- `routes` - Matatu routes and stops
- `reports` - User reports and feedback
- `scores` - Route reliability and safety scores

## Step 4: Build and Deploy

### 4.1 Build Frontend
```bash
cd frontend
npm install
npm run build
```

### 4.2 Build Backend
```bash
cd backend
npm install
npm run build
```

### 4.3 Deploy to Firebase
```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Deploy everything
firebase deploy
```

## Step 5: Post-Deployment Configuration

### 5.1 Set Environment Variables in Firebase Functions
```bash
firebase functions:config:set mongodb.uri="your-mongodb-connection-string"
firebase functions:config:set jwt.secret="your-jwt-secret"
firebase functions:config:set cors.origin="https://smart-matatu-app.web.app"
```

### 5.2 Redeploy Functions with Environment Variables
```bash
firebase deploy --only functions
```

## Step 6: Testing Deployment

### 6.1 Test Frontend
1. Visit your deployed URL: `https://smart-matatu-app.web.app`
2. Test all major features:
   - Home page loads
   - Map view displays routes
   - Report form submission
   - User registration/login
   - Navigation between pages

### 6.2 Test Backend API
```bash
# Test health endpoint
curl https://us-central1-smart-matatu-app.cloudfunctions.net/api/health

# Test routes endpoint
curl https://us-central1-smart-matatu-app.cloudfunctions.net/api/routes
```

## Step 7: Production Monitoring

### 7.1 Firebase Console Monitoring
- **Hosting**: Monitor traffic and performance
- **Functions**: Monitor execution times and errors
- **Authentication**: Monitor user sign-ups and logins

### 7.2 MongoDB Atlas Monitoring
- Monitor database performance
- Set up alerts for high usage
- Monitor connection counts

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CORS_ORIGIN includes your deployed domain
   - Check Firebase Functions CORS configuration

2. **Database Connection Issues**
   - Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
   - Check connection string format
   - Ensure database user has proper permissions

3. **Authentication Issues**
   - Verify Firebase Authentication is enabled
   - Check JWT secret configuration
   - Ensure proper CORS settings

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript compilation errors

### Debug Commands
```bash
# Check Firebase project
firebase projects:list

# Check deployment status
firebase hosting:channel:list

# View function logs
firebase functions:log

# Test functions locally
firebase emulators:start
```

## Security Checklist

- [ ] Environment variables are properly set
- [ ] CORS is configured for production domain only
- [ ] Rate limiting is enabled
- [ ] Input validation is working
- [ ] Authentication is properly configured
- [ ] Database access is restricted
- [ ] HTTPS is enforced
- [ ] Security headers are set

## Performance Optimization

- [ ] Frontend assets are minified and compressed
- [ ] Images are optimized
- [ ] API responses are cached where appropriate
- [ ] Database queries are optimized
- [ ] CDN is configured for static assets

## Backup Strategy

1. **Database Backups**: MongoDB Atlas automatic backups
2. **Code Backups**: Git repository with GitHub
3. **Configuration Backups**: Document all environment variables
4. **Deployment History**: Firebase keeps deployment history

## Maintenance

### Regular Tasks
- Monitor error logs weekly
- Update dependencies monthly
- Review security settings quarterly
- Backup database before major updates

### Scaling Considerations
- Monitor Firebase Functions usage limits
- Consider upgrading MongoDB Atlas cluster if needed
- Implement caching for frequently accessed data
- Monitor and optimize API response times
