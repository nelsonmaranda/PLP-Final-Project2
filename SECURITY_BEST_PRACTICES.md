# Security Best Practices for Smart Matatu

## 🚨 CRITICAL SECURITY FIXES APPLIED

### Issues Found and Fixed:
1. **Hardcoded MongoDB credentials** in `backend/functions/index.js` - REMOVED
2. **Hardcoded JWT secret** in `backend/functions/index.js` - REMOVED

### Current Status: ✅ SECURE
- All sensitive credentials removed from source code
- Environment variables properly configured
- No .env files in repository
- Proper .gitignore configuration

## 🔒 Security Guidelines

### 1. Environment Variables
**NEVER** commit real credentials to version control. Always use:

```javascript
// ✅ CORRECT - Use environment variables
const mongoURI = functions.config().mongodb?.uri || process.env.MONGODB_URI;
const JWT_SECRET = functions.config().jwt?.secret || process.env.JWT_SECRET;

// ❌ WRONG - Never hardcode credentials
const mongoURI = 'mongodb+srv://user:password@cluster.mongodb.net/db';
const JWT_SECRET = 'my-secret-key';
```

### 2. Firebase Configuration
Set secrets using Firebase CLI:

```bash
# Set MongoDB URI
firebase functions:config:set mongodb.uri="mongodb+srv://username:password@cluster.mongodb.net/db"

# Set JWT Secret
firebase functions:config:set jwt.secret="your-super-secure-jwt-secret-here"
```

### 3. Local Development
Create `.env.local` (not tracked by git):

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/db
JWT_SECRET=your-local-jwt-secret
```

### 4. Production Deployment
- Use Firebase Functions config for production secrets
- Never store credentials in code
- Use strong, unique passwords
- Rotate secrets regularly

## 🛡️ Security Checklist

### Before Committing:
- [ ] No hardcoded credentials in source code
- [ ] All secrets use environment variables
- [ ] .env files are in .gitignore
- [ ] No API keys in code
- [ ] No database passwords in code
- [ ] No JWT secrets in code

### Before Deployment:
- [ ] Firebase config set with real credentials
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Error messages don't leak sensitive info

## 🔍 How to Check for Exposed Credentials

### Search for potential issues:
```bash
# Search for MongoDB connection strings
grep -r "mongodb://" . --exclude-dir=node_modules

# Search for JWT secrets
grep -r "JWT_SECRET.*=" . --exclude-dir=node_modules

# Search for API keys
grep -r "api[_-]?key" . --exclude-dir=node_modules -i

# Search for passwords
grep -r "password.*=" . --exclude-dir=node_modules -i
```

## 🚨 If Credentials Are Exposed

### Immediate Actions:
1. **Rotate all exposed credentials immediately**
2. **Remove credentials from code**
3. **Force push to remove from git history**
4. **Update all environment variables**
5. **Notify team members**

### Git History Cleanup:
```bash
# Remove file from git history
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch path/to/file' --prune-empty --tag-name-filter cat -- --all

# Force push to update remote
git push origin --force --all
```

## 📋 Environment Variables Reference

### Required for Backend:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `CORS_ORIGIN` - Allowed CORS origins
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

### Firebase Functions Config:
```bash
firebase functions:config:set \
  mongodb.uri="mongodb+srv://..." \
  jwt.secret="your-secret" \
  cors.origin="https://your-domain.com"
```

## 🔐 Additional Security Measures

### 1. Input Validation
- Use Zod schemas for all API inputs
- Sanitize user inputs
- Validate file uploads

### 2. Authentication
- Use strong JWT secrets (32+ characters)
- Implement proper token expiration
- Use HTTPS only

### 3. Database Security
- Use MongoDB Atlas with proper access controls
- Enable IP whitelisting
- Use strong database passwords
- Enable audit logging

### 4. API Security
- Implement rate limiting
- Use CORS properly
- Validate all inputs
- Handle errors securely

## 📞 Security Contact

If you discover a security vulnerability:
1. **DO NOT** create a public issue
2. Email: security@smart-matatu.ke
3. Include: Description, steps to reproduce, potential impact

## ✅ Security Status

- [x] Hardcoded credentials removed
- [x] Environment variables configured
- [x] .gitignore properly set
- [x] No .env files in repository
- [x] Firebase config ready
- [x] Security documentation created

**Last Updated:** $(date)
**Status:** SECURE ✅
