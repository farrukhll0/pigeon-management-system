# Heroku Deployment Guide - Pigeon Management System

Heroku is a reliable and well-established platform for deploying full-stack applications.

## Prerequisites

- GitHub account
- Heroku account (free tier discontinued, paid starts at $5/month)
- MongoDB Atlas account (free)
- Heroku CLI (optional but recommended)

## Step 1: Create Heroku Account

1. Go to [Heroku](https://heroku.com)
2. Sign up for an account
3. Verify your email
4. Add payment method (required for all plans)

## Step 2: Install Heroku CLI (Optional)

```bash
# Windows (using winget)
winget install --id=Heroku.HerokuCLI

# Or download from: https://devcenter.heroku.com/articles/heroku-cli
```

## Step 3: Deploy Backend to Heroku

### Method 1: Using Heroku Dashboard (Easiest)

1. **Create New App**
   - Go to [Heroku Dashboard](https://dashboard.heroku.com)
   - Click "New" → "Create new app"
   - Choose app name (e.g., `pigeon-manager-backend`)
   - Select region
   - Click "Create app"

2. **Connect GitHub**
   - Go to "Deploy" tab
   - Choose "GitHub" as deployment method
   - Connect your GitHub account
   - Select your repository

3. **Configure Deployment**
   - Set **Branch** to `main`
   - Enable "Wait for CI to pass before deploy"
   - Click "Deploy Branch"

4. **Set Buildpack**
   - Go to "Settings" tab
   - Click "Add buildpack"
   - Add: `heroku/nodejs`

### Method 2: Using Heroku CLI

```bash
# Login to Heroku
heroku login

# Create app
heroku create pigeon-manager-backend

# Add Node.js buildpack
heroku buildpacks:set heroku/nodejs

# Set environment variables
heroku config:set MONGODB_URI="your_mongodb_atlas_connection_string"
heroku config:set JWT_SECRET="your_secure_jwt_secret"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main
```

## Step 4: Configure Backend

### Update package.json
Ensure your `backend/package.json` has:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### Add Procfile
Create `backend/Procfile`:

```
web: node server.js
```

### Update server.js
Ensure your server listens on the correct port:

```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```

### Set Environment Variables
In Heroku dashboard → Settings → Config Vars:

```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pigeon-manager?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
NODE_ENV=production
```

## Step 5: Deploy Frontend

### Option 1: Deploy to Vercel (Recommended)
Follow the `VERCEL_DEPLOYMENT.md` guide for frontend deployment.

### Option 2: Deploy to Heroku
Create a separate Heroku app for frontend:

1. **Create Frontend App**
   - Create new Heroku app (e.g., `pigeon-manager-frontend`)
   - Add buildpack: `heroku/static`

2. **Configure Static Buildpack**
   - Set root directory to `frontend`
   - Set build command to leave empty
   - Set start command to `node server.js`

3. **Update frontend/server.js**
   ```javascript
   const PORT = process.env.PORT || 8080;
   app.listen(PORT, () => {
       console.log(`Frontend server running on port ${PORT}`);
   });
   ```

## Step 6: Update API URLs

### Update frontend/script.js
```javascript
const API_BASE_URL = isProduction 
    ? 'https://pigeon-manager-backend.herokuapp.com/api'
    : 'http://localhost:3000/api';
const IMAGE_BASE_URL = isProduction 
    ? 'https://pigeon-manager-backend.herokuapp.com'
    : 'http://localhost:3000';
```

### Update Backend CORS
```javascript
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://pigeon-manager-frontend.herokuapp.com', 'http://localhost:8080'] 
        : 'http://localhost:8080',
    credentials: true
}));
```

## Step 7: Test Your Deployment

1. Visit your frontend URL
2. Test all features
3. Check logs if issues occur

## Heroku Advantages

### ✅ **Reliability**
- Established platform
- High uptime
- Good support

### ✅ **Easy Scaling**
- Automatic scaling
- Easy resource management
- Good monitoring

### ✅ **Add-ons**
- MongoDB Atlas integration
- Redis for caching
- Monitoring tools

### ✅ **CI/CD Integration**
- GitHub integration
- Automatic deployments
- Review apps

## Heroku CLI Commands

### Useful Commands
```bash
# View logs
heroku logs --tail

# Open app
heroku open

# Run commands
heroku run node

# Scale dynos
heroku ps:scale web=1

# View config vars
heroku config

# Set config vars
heroku config:set KEY=value

# Restart app
heroku restart
```

## Monitoring and Logs

### View Logs
1. Go to Heroku dashboard
2. Select your app
3. Go to "More" → "View logs"
4. Or use CLI: `heroku logs --tail`

### Monitoring
1. Go to "Metrics" tab
2. View:
   - Response time
   - Throughput
   - Error rates
   - Dyno usage

## Scaling on Heroku

### Dyno Types
- **Eco**: $5/month (basic)
- **Basic**: $7/month (better performance)
- **Standard**: $25/month (production ready)
- **Performance**: $250/month (high traffic)

### Auto-scaling
1. Go to "Resources" tab
2. Enable "Autoscaling"
3. Set min/max dynos
4. Set scaling rules

## Troubleshooting

### Common Issues

#### App Won't Start
```bash
# Check logs
heroku logs --tail

# Check buildpack
heroku buildpacks

# Restart app
heroku restart
```

#### Environment Variables
```bash
# View all config vars
heroku config

# Set missing variables
heroku config:set MONGODB_URI="your_connection_string"
```

#### Database Connection
- Verify MongoDB Atlas connection string
- Check network access settings
- Test connection locally

### Error Codes

#### H10 - App Crashed
- Check logs for errors
- Verify start command
- Check environment variables

#### H14 - No Web Processes
- Scale web dynos: `heroku ps:scale web=1`
- Check Procfile
- Verify buildpack

#### H15 - Idle Connection
- Normal for free tier
- Upgrade to paid plan to avoid

## Cost Optimization

### Free Tier (Discontinued)
- No longer available
- Must use paid plans

### Paid Plans
- **Eco**: $5/month (basic)
- **Basic**: $7/month (better)
- **Standard**: $25/month (production)

### Cost Saving Tips
1. Use Eco dynos for development
2. Scale down during low traffic
3. Use add-ons wisely
4. Monitor usage regularly

## Security Best Practices

### Environment Variables
- Never commit secrets
- Use Heroku config vars
- Rotate secrets regularly

### Database Security
- Use strong passwords
- Enable MongoDB Atlas security features
- Restrict network access

### HTTPS
- Heroku provides automatic SSL
- Force HTTPS in your app
- Use secure cookies

## Add-ons and Integrations

### Database Add-ons
- MongoDB Atlas (recommended)
- Heroku Postgres
- Redis for caching

### Monitoring Add-ons
- Papertrail (logs)
- New Relic (performance)
- Scout (monitoring)

### Security Add-ons
- Heroku Shield
- SSL certificates
- Security scanning

---

**Your Pigeon Management System is now deployed on Heroku! 🚀**

Heroku provides a reliable and scalable platform for your application. 