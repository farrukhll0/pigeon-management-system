# Deployment Guide - Pigeon Management System

This guide will walk you through deploying your Pigeon Management System to Render with MongoDB Atlas and GitHub.

## Prerequisites

- GitHub account
- Render account (free tier available)
- MongoDB Atlas account (free tier available)

## Step 1: Set Up MongoDB Atlas

Follow the instructions in `MONGODB_SETUP.md` to:
1. Create a MongoDB Atlas account
2. Set up a free cluster
3. Create database user
4. Configure network access
5. Get your connection string

## Step 2: Prepare Your Code for GitHub

### Initialize Git Repository (if not already done)
```bash
git init
git add .
git commit -m "Initial commit - Pigeon Management System"
```

### Create GitHub Repository
1. Go to [GitHub](https://github.com)
2. Click "New repository"
3. Name it `pigeon-management-system`
4. Make it public or private
5. Don't initialize with README (you already have one)
6. Click "Create repository"

### Connect Local Repository to GitHub
```bash
git remote add origin https://github.com/yourusername/pigeon-management-system.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy Backend to Render

### Create Render Account
1. Go to [Render](https://render.com)
2. Sign up with your GitHub account
3. Verify your email

### Deploy Backend Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `pigeon-manager-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Add Environment Variables
Click "Environment" tab and add:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pigeon-manager?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
NODE_ENV=production
```

### Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your backend URL (e.g., `https://pigeon-manager-backend.onrender.com`)

## Step 4: Deploy Frontend to Render

### Create Frontend Service
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `pigeon-manager-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: Leave empty
   - **Publish Directory**: `.` (current directory)

### Deploy
1. Click "Create Static Site"
2. Wait for deployment to complete
3. Note your frontend URL (e.g., `https://pigeon-manager-frontend.onrender.com`)

## Step 5: Update Frontend Configuration

### Update API URLs
Edit `frontend/script.js` and replace the placeholder URLs:

```javascript
const API_BASE_URL = isProduction 
    ? 'https://your-actual-backend-url.onrender.com/api'
    : 'http://localhost:3000/api';
const IMAGE_BASE_URL = isProduction 
    ? 'https://your-actual-backend-url.onrender.com'
    : 'http://localhost:3000';
```

### Update CORS in Backend
Edit `backend/server.js` and update the CORS origin:

```javascript
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-actual-frontend-url.onrender.com', 'http://localhost:8080'] 
        : 'http://localhost:8080',
    credentials: true
}));
```

### Commit and Push Changes
```bash
git add .
git commit -m "Update deployment URLs"
git push origin main
```

## Step 6: Test Your Deployment

1. Visit your frontend URL
2. Create a new account
3. Test all features:
   - Login/Logout
   - Add pigeons
   - Upload images
   - Search and filter
   - Profile management

## Step 7: Custom Domain (Optional)

### Backend Custom Domain
1. In Render dashboard, go to your backend service
2. Click "Settings" → "Custom Domains"
3. Add your domain (e.g., `api.yourdomain.com`)
4. Update DNS records as instructed

### Frontend Custom Domain
1. In Render dashboard, go to your frontend service
2. Click "Settings" → "Custom Domains"
3. Add your domain (e.g., `yourdomain.com`)
4. Update DNS records as instructed

## Troubleshooting

### Common Issues

#### Backend Won't Start
- Check environment variables in Render
- Verify MongoDB connection string
- Check logs in Render dashboard

#### Frontend Can't Connect to Backend
- Verify CORS settings in backend
- Check API URLs in frontend
- Ensure backend is running

#### Image Uploads Not Working
- Check uploads directory permissions
- Verify file size limits
- Check multer configuration

#### MongoDB Connection Issues
- Verify network access in MongoDB Atlas
- Check connection string format
- Ensure database user has correct permissions

### Useful Commands

```bash
# Check deployment status
curl https://your-backend-url.onrender.com/api/health

# View logs in Render
# Go to your service dashboard → Logs

# Test local development
cd backend && npm run dev
cd frontend && node server.js
```

## Security Considerations

### Production Security
1. **JWT Secret**: Use a strong, random secret
2. **MongoDB**: Use strong passwords
3. **CORS**: Restrict to your domain only
4. **Environment Variables**: Never commit secrets to Git
5. **HTTPS**: Render provides this automatically

### Environment Variables Checklist
- [ ] `MONGODB_URI` - MongoDB Atlas connection string
- [ ] `JWT_SECRET` - Strong random string
- [ ] `NODE_ENV` - Set to `production`

## Monitoring and Maintenance

### Regular Tasks
1. Monitor Render usage (free tier limits)
2. Check MongoDB Atlas usage
3. Review application logs
4. Update dependencies regularly

### Scaling Considerations
- Render free tier has limitations
- Consider paid plans for production use
- MongoDB Atlas free tier: 512MB storage
- Monitor usage to avoid overages

## Support

If you encounter issues:
1. Check Render documentation
2. Check MongoDB Atlas documentation
3. Review application logs
4. Test locally first
5. Verify all environment variables

---

**Your Pigeon Management System is now deployed and ready to use! 🎉** 