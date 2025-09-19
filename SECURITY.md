# Security Guidelines for Smart Matatu Project

## 🚨 **CRITICAL: Never Commit Credentials**

### **What NOT to commit:**
- ❌ Real MongoDB connection strings with passwords
- ❌ API keys and secrets
- ❌ JWT secrets
- ❌ Firebase service account keys
- ❌ Any file containing actual credentials

### **What TO commit:**
- ✅ Example files with placeholder values
- ✅ Documentation with generic examples
- ✅ Template files with `your-username`, `your-password`, etc.

## 🔐 **Environment Variables**

### **For Development:**
Create a `.env` file (NOT committed to git):
```env
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/smart-matatu
JWT_SECRET=your-super-secret-jwt-key-here
```

### **For Production:**
Use Firebase Functions config or environment variables:
```bash
firebase functions:config:set mongodb.uri="your-actual-connection-string"
```

## 🛡️ **Security Best Practices**

### **1. Database Security**
- Use strong passwords for MongoDB Atlas
- Enable IP whitelisting in production
- Use MongoDB Atlas built-in security features
- Rotate credentials regularly

### **2. API Security**
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Use JWT tokens for authentication
- Implement CORS properly

### **3. Code Security**
- Never hardcode secrets in source code
- Use environment variables for configuration
- Keep dependencies updated
- Use security scanning tools

## 🔍 **GitHub Security Alerts**

If you see security alerts in GitHub:

1. **Immediately check** if real credentials were exposed
2. **Rotate** any exposed credentials
3. **Remove** sensitive files from git history if needed
4. **Update** .gitignore to prevent future exposure

## 📝 **File Naming Conventions**

### **Safe to commit:**
- `ENV_EXAMPLE.txt` - Contains placeholder values
- `production.env.example` - Template file
- `config.example.json` - Example configuration

### **Never commit:**
- `.env` - Contains real credentials
- `production.env` - Contains real credentials
- `secrets.json` - Contains sensitive data
- Any file with actual passwords or keys

## 🚀 **Deployment Security**

### **Firebase Functions:**
```bash
# Set production secrets
firebase functions:config:set mongodb.uri="your-connection-string"
firebase functions:config:set jwt.secret="your-jwt-secret"

# Deploy
firebase deploy --only functions
```

### **Environment Variables:**
```bash
# Set in your deployment platform
export MONGODB_URI="your-connection-string"
export JWT_SECRET="your-jwt-secret"
```

## 🔄 **Credential Rotation**

If credentials are exposed:
1. **Immediately** change the password in MongoDB Atlas
2. **Update** Firebase Functions config
3. **Redeploy** the application
4. **Monitor** for unauthorized access

## 📞 **Emergency Response**

If you suspect a security breach:
1. **Immediately** change all passwords
2. **Revoke** any exposed API keys
3. **Check** access logs
4. **Update** all credentials
5. **Redeploy** with new credentials

---

**Remember: Security is everyone's responsibility!**
