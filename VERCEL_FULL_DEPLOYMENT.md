# Vercel Full Deployment Guide - Frontend + Backend

Yes, you can deploy both frontend and backend on Vercel! Vercel supports static sites for frontend and serverless functions for backend.

## 🎯 **Vercel Architecture**

```
Vercel Project
├── Frontend (Static Files)
│   ├── index.html
│   ├── script.js
│   └── CSS/styles
└── Backend (Serverless Functions)
    ├── api/auth.js
    ├── api/pigeons.js
    └── api/upload.js
```

## 📋 **Prerequisites**

- GitHub account
- Vercel account (free)
- MongoDB Atlas account (free)

## 🚀 **Step 1: Restructure Your Project**

### Create Vercel Project Structure

Your project needs to be restructured for Vercel:

```
pigeon-manager/
├── public/                 # Frontend static files
│   ├── index.html
│   ├── script.js
│   └── images/
├── api/                    # Backend serverless functions
│   ├── auth.js
│   ├── pigeons.js
│   ├── upload.js
│   └── users.js
├── lib/                    # Shared utilities
│   ├── db.js
│   └── auth.js
├── models/                 # Database models
│   ├── User.js
│   └── Pigeon.js
├── middleware/             # Middleware functions
│   ├── auth.js
│   └── upload.js
├── vercel.json            # Vercel configuration
└── package.json
```

## 🔧 **Step 2: Create Vercel Configuration**

### Create `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "public/**",
      "use": "@vercel/static"
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "functions": {
    "api/auth.js": {
      "maxDuration": 30
    },
    "api/pigeons.js": {
      "maxDuration": 30
    },
    "api/upload.js": {
      "maxDuration": 60
    }
  },
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

## 📁 **Step 3: Restructure Your Files**

### Move Frontend Files

1. **Create `public/` directory**
2. **Move frontend files**:
   - `frontend/index.html` → `public/index.html`
   - `frontend/script.js` → `public/script.js`
   - `frontend/images/` → `public/images/`

### Create API Functions

#### `api/auth.js` (Authentication)
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const app = express();
app.use(express.json());

// Register
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = app;
```

#### `api/pigeons.js` (Pigeon CRUD)
```javascript
const express = require('express');
const auth = require('../middleware/auth');
const Pigeon = require('../models/Pigeon');

const app = express();
app.use(express.json());

// Get all pigeons
app.get('/', auth, async (req, res) => {
  try {
    const pigeons = await Pigeon.find({ user: req.user.userId });
    res.json(pigeons);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create pigeon
app.post('/', auth, async (req, res) => {
  try {
    const pigeon = new Pigeon({
      ...req.body,
      user: req.user.userId
    });
    
    await pigeon.save();
    res.status(201).json(pigeon);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single pigeon
app.get('/:id', auth, async (req, res) => {
  try {
    const pigeon = await Pigeon.findOne({
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!pigeon) {
      return res.status(404).json({ message: 'Pigeon not found' });
    }
    
    res.json(pigeon);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update pigeon
app.put('/:id', auth, async (req, res) => {
  try {
    const pigeon = await Pigeon.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      req.body,
      { new: true }
    );
    
    if (!pigeon) {
      return res.status(404).json({ message: 'Pigeon not found' });
    }
    
    res.json(pigeon);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete pigeon
app.delete('/:id', auth, async (req, res) => {
  try {
    const pigeon = await Pigeon.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!pigeon) {
      return res.status(404).json({ message: 'Pigeon not found' });
    }
    
    res.json({ message: 'Pigeon deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = app;
```

#### `api/upload.js` (Image Upload)
```javascript
const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');

const app = express();

// Configure multer for Vercel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload image
app.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // For Vercel, you might want to use a cloud storage service
    // like Cloudinary, AWS S3, or store in MongoDB as base64
    
    // For now, we'll return the file info
    res.json({
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = app;
```

## 🔗 **Step 4: Update Database Connection**

### Create `lib/db.js`
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Update Models
Make sure your models work with the new structure:

#### `models/User.js`
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
```

#### `models/Pigeon.js`
```javascript
const mongoose = require('mongoose');

const pigeonSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  ringNumber: String,
  dateOfBirth: Date,
  color: String,
  sex: {
    type: String,
    enum: ['Male', 'Female', 'Unknown'],
    default: 'Unknown'
  },
  strain: String,
  breeder: String,
  notes: String,
  image: String,
  gallery: [String],
  // Family information
  father: {
    name: String,
    image: String
  },
  mother: {
    name: String,
    image: String
  },
  // Pedigree information
  pedigree: {
    gggFather: { name: String, image: String },
    gggMother: { name: String, image: String },
    ggFather: { name: String, image: String },
    ggMother: { name: String, image: String },
    gFather: { name: String, image: String },
    gMother: { name: String, image: String }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pigeon', pigeonSchema);
```

## 🔐 **Step 5: Update Middleware**

### `middleware/auth.js`
```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
```

## 📦 **Step 6: Update Package.json**

### Create root `package.json`
```json
{
  "name": "pigeon-manager-vercel",
  "version": "1.0.0",
  "description": "Pigeon Management System on Vercel",
  "main": "index.js",
  "scripts": {
    "dev": "vercel dev",
    "build": "echo 'No build step needed'",
    "start": "vercel dev"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "vercel": "^32.0.0"
  },
  "engines": {
    "node": "18.x"
  }
}
```

## 🌐 **Step 7: Update Frontend**

### Update `public/script.js`
Change API URLs to use Vercel functions:

```javascript
// Update API URLs for Vercel
const API_BASE_URL = isProduction 
    ? '/api'
    : 'http://localhost:3000/api';
const IMAGE_BASE_URL = isProduction 
    ? '/api'
    : 'http://localhost:3000/api';

// Update fetch calls to use new endpoints
// Example:
// POST /api/auth/login
// GET /api/pigeons
// POST /api/pigeons
// etc.
```

## 🚀 **Step 8: Deploy to Vercel**

### Method 1: Using Vercel Dashboard

1. **Go to [Vercel](https://vercel.com)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure project**:
   - Framework Preset: Other
   - Root Directory: `.` (root)
   - Build Command: Leave empty
   - Output Directory: Leave empty
5. **Add Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your secure JWT secret
6. **Click "Deploy"**

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET

# Deploy to production
vercel --prod
```

## 🔧 **Step 9: Configure Environment Variables**

In Vercel dashboard → Settings → Environment Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pigeon-manager?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
```

## 📊 **Vercel Advantages for Full-Stack**

### ✅ **Single Platform**
- Frontend and backend in one place
- Unified deployment
- Single dashboard

### ✅ **Serverless Functions**
- Automatic scaling
- Pay per request
- No server management

### ✅ **Global CDN**
- Fast loading worldwide
- Automatic optimization
- Edge functions

### ✅ **Easy Development**
- `vercel dev` for local development
- Automatic deployments
- Preview deployments

## ⚠️ **Important Considerations**

### **File Upload Limitations**
Vercel serverless functions have limitations for file uploads:
- **Memory limit**: 50MB per function
- **Execution time**: 10 seconds (free), 60 seconds (pro)
- **No persistent storage**

### **Solutions for File Uploads**
1. **Use Cloudinary** (recommended)
2. **Use AWS S3**
3. **Store as base64 in MongoDB**
4. **Use external storage service**

### **Database Connections**
- Serverless functions create new connections
- Use connection pooling
- Consider MongoDB Atlas connection limits

## 🔄 **Alternative: Hybrid Approach**

If you prefer to keep your current structure:

### **Frontend on Vercel + Backend on Railway**
1. Deploy frontend to Vercel (static files)
2. Deploy backend to Railway (Node.js server)
3. Update API URLs in frontend
4. Configure CORS on backend

This gives you:
- ✅ Vercel's excellent frontend performance
- ✅ Railway's full Node.js capabilities
- ✅ Better file upload handling
- ✅ More flexible backend

## 🎯 **Recommendation**

For your pigeon management system, I recommend the **Hybrid Approach**:

1. **Frontend on Vercel** (free, excellent performance)
2. **Backend on Railway** ($5/month, better for file uploads)

This gives you the best of both worlds without the limitations of serverless functions for file uploads.

Would you like me to help you set up the hybrid approach, or do you want to proceed with the full Vercel deployment? 