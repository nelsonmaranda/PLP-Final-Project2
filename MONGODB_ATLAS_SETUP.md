# MongoDB Atlas Setup Guide for Smart Matatu

## 🗄️ **Step-by-Step MongoDB Atlas Configuration**

### **Step 1: Create MongoDB Atlas Account**

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" or "Sign Up"
3. Fill in your details and verify your email
4. Choose "M0 Sandbox" (Free tier) - perfect for development

### **Step 2: Create a New Cluster**

1. **Click "Build a Database"**
2. **Choose "M0 Sandbox"** (Free tier)
3. **Select Cloud Provider**: AWS, Google Cloud, or Azure
4. **Choose Region**: Select closest to your users (e.g., `us-east-1`)
5. **Cluster Name**: `smart-matwana-cluster`
6. **Click "Create Cluster"** (takes 3-5 minutes)

### **Step 3: Set Up Database Access**

#### **Create Database User:**
1. Go to **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. **Username**: `smart-matwana-user`
5. **Password**: Generate a secure password (save it!)
6. **Database User Privileges**: "Read and write to any database"
7. Click **"Add User"**

#### **Set Up Network Access:**
1. Go to **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Choose **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### **Step 4: Get Connection String**

1. Go to **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver
5. **Copy the connection string** - it will look like:
   ```
   mongodb+srv://<DB_USERNAME>:<DB_PASSWORD>@<CLUSTER_NAME>.<RANDOM_ID>.mongodb.net/smart-matatu-ke?retryWrites=true&w=majority
   ```
   
   ⚠️ **SECURITY NOTE**: Replace `<DB_USERNAME>`, `<DB_PASSWORD>`, `<CLUSTER_NAME>`, and `<RANDOM_ID>` with your actual MongoDB Atlas credentials. Never commit real credentials to version control.

### **Step 5: Configure Firebase Functions**

#### **Option A: Using Firebase Config (Recommended)**

1. **Set the MongoDB URI in Firebase:**
   ```bash
   firebase functions:config:set mongodb.uri="mongodb+srv://<DB_USERNAME>:<DB_PASSWORD>@<CLUSTER_NAME>.<RANDOM_ID>.mongodb.net/smart-matatu-ke?retryWrites=true&w=majority"
   ```

2. **Deploy the updated functions:**
   ```bash
   firebase deploy --only functions
   ```

#### **Option B: Using Environment Variables**

1. **Update the production.env file** with your actual connection string:
   ```env
   MONGODB_URI=mongodb+srv://<DB_USERNAME>:<DB_PASSWORD>@<CLUSTER_NAME>.<RANDOM_ID>.mongodb.net/smart-matatu-ke?retryWrites=true&w=majority
   ```

2. **Deploy the functions:**
   ```bash
   firebase deploy --only functions
   ```

### **Step 6: Verify Database Connection**

1. **Check Firebase Functions logs:**
   ```bash
   firebase functions:log
   ```

2. **Look for**: "MongoDB Atlas connected successfully"

3. **Test the API endpoints** to ensure data is being stored

### **Step 7: Create Initial Data (Optional)**

You can add some initial data to your database:

1. **Go to "Database"** in MongoDB Atlas
2. **Click "Browse Collections"**
3. **Create a database** named `smart-matwana-ke`
4. **Add collections** as needed:
   - `routes` - for matatu routes
   - `reports` - for user reports
   - `scores` - for route scores
   - `users` - for user accounts

## 🔧 **Database Schema**

Your application will automatically create these collections:

### **Routes Collection**
```json
{
  "_id": "ObjectId",
  "name": "Route 42 - Thika Road",
  "operator": "KBS",
  "routeNumber": "42",
  "path": [[-1.2921, 36.8219], [-1.3000, 36.8000]],
  "stops": [
    {"name": "CBD", "coordinates": [-1.2921, 36.8219]},
    {"name": "Thika Road", "coordinates": [-1.3000, 36.8000]}
  ],
  "fare": 50,
  "operatingHours": {"start": "05:00", "end": "22:00"},
  "isActive": true,
  "description": "Main route connecting CBD to Thika",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Reports Collection**
```json
{
  "_id": "ObjectId",
  "routeId": "ObjectId",
  "userId": "ObjectId",
  "reportType": "delay",
  "description": "Bus was 15 minutes late",
  "severity": "medium",
  "location": {
    "type": "Point",
    "coordinates": [-1.2921, 36.8219]
  },
  "status": "pending",
  "isAnonymous": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### **Scores Collection**
```json
{
  "_id": "ObjectId",
  "routeId": "ObjectId",
  "reliability": 4.1,
  "safety": 4.2,
  "punctuality": 4.0,
  "comfort": 3.8,
  "overall": 4.0,
  "totalReports": 25,
  "lastCalculated": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

## 🚨 **Security Best Practices**

1. **Use strong passwords** for database users
2. **Restrict IP access** to only necessary IPs in production
3. **Enable MongoDB Atlas security features**:
   - Database encryption at rest
   - Network encryption in transit
   - Regular security updates

## 📊 **Monitoring and Maintenance**

1. **Monitor database performance** in MongoDB Atlas dashboard
2. **Set up alerts** for unusual activity
3. **Regular backups** (automatic with Atlas)
4. **Monitor storage usage** (free tier has 512MB limit)

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **Connection timeout**: Check network access settings
2. **Authentication failed**: Verify username/password
3. **Database not found**: Ensure database name is correct
4. **Collection not found**: Collections are created automatically

### **Debug Commands:**

```bash
# Check Firebase Functions logs
firebase functions:log

# Test MongoDB connection locally
node -e "const mongoose = require('mongoose'); mongoose.connect('YOUR_URI').then(() => console.log('Connected')).catch(console.error);"
```

## 📈 **Scaling Considerations**

- **Free Tier**: 512MB storage, shared RAM
- **M2/M5 Tiers**: For production with more storage and dedicated resources
- **Sharding**: For very large datasets
- **Read Replicas**: For high-read workloads

---

**Next Steps**: After setting up MongoDB Atlas, configure your environment variables and deploy the updated functions!
