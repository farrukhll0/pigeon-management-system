# Pigeon Manager - Vercel Deployment

Your project has been restructured for Vercel deployment with both frontend and backend on the same platform.

## 📁 Project Structure

```
pigeon-manager/
├── public/                 # Frontend static files
│   ├── index.html
│   └── script.js
├── api/                    # Backend serverless functions
│   ├── auth.js
│   ├── pigeons.js
│   └── upload.js
├── lib/                    # Shared utilities
│   └── db.js
├── models/                 # Database models
│   ├── User.js
│   └── Pigeon.js
├── middleware/             # Middleware functions
│   ├── auth.js
│   └── upload.js
├── vercel.json            # Vercel configuration
└── package.json
```

## 🚀 Deploy to Vercel

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Deploy to Vercel
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

### Step 3: Set Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pigeon-manager?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
```

## 🔧 API Endpoints

- **Authentication**: `/api/auth`
  - POST `/api/auth/register` - Register user
  - POST `/api/auth/login` - Login user
  - GET `/api/auth/profile` - Get user profile

- **Pigeons**: `/api/pigeons`
  - GET `/api/pigeons` - Get all pigeons
  - POST `/api/pigeons` - Create pigeon
  - GET `/api/pigeons/:id` - Get single pigeon
  - PUT `/api/pigeons/:id` - Update pigeon
  - DELETE `/api/pigeons/:id` - Delete pigeon

- **Upload**: `/api/upload`
  - POST `/api/upload` - Upload single image
  - POST `/api/upload/multiple` - Upload multiple images

## ⚠️ Important Notes

### File Upload Limitations
- Vercel serverless functions have memory limits
- Files are stored as base64 in this setup
- For production, consider using Cloudinary or AWS S3

### Database Connections
- Each function creates a new MongoDB connection
- Consider connection pooling for high traffic

## 🎯 Next Steps

1. **Set up MongoDB Atlas** (follow `MONGODB_SETUP.md`)
2. **Deploy to Vercel** using the steps above
3. **Test all features** on your deployed URL
4. **Consider file storage** for production use

## 🔄 Alternative: Hybrid Deployment

If you encounter issues with file uploads on Vercel, consider:
- **Frontend on Vercel** (free, excellent performance)
- **Backend on Railway** ($5/month, better for file uploads)

This gives you the best of both worlds! 