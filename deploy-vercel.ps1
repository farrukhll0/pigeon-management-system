# Vercel Deployment Script for Pigeon Manager
Write-Host "🚀 Starting Vercel Deployment for Pigeon Manager..." -ForegroundColor Green

# Check if Vercel CLI is installed
Write-Host "📋 Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Check if user is logged in to Vercel
Write-Host "🔐 Checking Vercel login status..." -ForegroundColor Yellow
try {
    vercel whoami
    Write-Host "✅ Already logged in to Vercel" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Not logged in to Vercel. Please login:" -ForegroundColor Yellow
    Write-Host "   Run: vercel login" -ForegroundColor Cyan
    Write-Host "   Then run this script again." -ForegroundColor Cyan
    exit 1
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "   This will create a preview deployment." -ForegroundColor Cyan
Write-Host "   Press Enter to continue..." -ForegroundColor Cyan
Read-Host

vercel

Write-Host ""
Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Set environment variables in Vercel dashboard:" -ForegroundColor Cyan
Write-Host "   - MONGODB_URI: Your MongoDB Atlas connection string" -ForegroundColor Cyan
Write-Host "   - JWT_SECRET: Your secure JWT secret" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Deploy to production:" -ForegroundColor Cyan
Write-Host "   vercel --prod" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Test your application at the provided URL" -ForegroundColor Cyan 