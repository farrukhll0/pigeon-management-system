# 🐦 Pigeon Management System

A full-stack web application for managing pigeon breeding, racing, and pedigree tracking. Built with Node.js, Express, MongoDB, and vanilla JavaScript.

## ✨ Features

- **User Authentication**: Secure login/signup with JWT tokens
- **Pigeon Management**: Add, edit, delete, and view pigeon details
- **Image Upload**: Support for multiple pigeon and family images
- **Pedigree Tracking**: Complete family tree management
- **Search & Filter**: Advanced filtering by color, sex, and other attributes
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Instant UI updates without page refresh

## 🚀 Live Demo

Visit: [Your Vercel URL here] - Replace with your actual Vercel URL after deployment

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcrypt
- **File Upload**: Multer for image handling
- **Frontend**: Vanilla JavaScript, Bootstrap 5, HTML5, CSS3
- **Deployment**: Vercel (Serverless Functions)
- **Version Control**: Git & GitHub

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account (free tier available)
- GitHub account
- Vercel account (free tier available)

## 🚀 Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pigeon-manager.git
cd pigeon-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/pigeon-manager
JWT_SECRET=your-super-secret-jwt-key-here
PORT=3000
NODE_ENV=development
```

### 4. Local Development

```bash
npm run dev
```

Visit `http://localhost:3000` to view the application.

## 🌐 Deployment Guide

### MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account
   - Create a new cluster (M0 Free tier recommended)

2. **Configure Database**
   - Create a database user with read/write permissions
   - Get your connection string
   - Add your IP address to the whitelist (or use 0.0.0.0/0 for all IPs)

3. **Connection String Format**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/pigeon-manager
   ```

### GitHub Setup

1. **Initialize Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub Repository**
   - Go to [GitHub](https://github.com)
   - Create a new repository
   - Don't initialize with README (we already have one)

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/pigeon-manager.git
   git branch -M main
   git push -u origin main
   ```

### Vercel Deployment

1. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Sign up with your GitHub account
   - Click "New Project"

2. **Import Repository**
   - Select your `pigeon-manager` repository
   - Vercel will auto-detect it's a Node.js project

3. **Configure Environment Variables**
   - Add the following environment variables in Vercel:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Your JWT secret key
     - `NODE_ENV`: `production`

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application
   - You'll get a URL like: `https://your-app.vercel.app`

## 📁 Project Structure

```
pigeon-manager/
├── lib/
│   └── db.js                 # Database connection
├── middleware/
│   ├── auth.js              # JWT authentication
│   └── upload.js            # File upload handling
├── models/
│   ├── User.js              # User model
│   └── Pigeon.js            # Pigeon model
├── routes/
│   ├── auth.js              # Authentication routes
│   └── pigeons.js           # Pigeon CRUD routes
├── public/
│   ├── index.html           # Main application page
│   └── script.js            # Frontend JavaScript
├── server.js                # Express server
├── package.json             # Dependencies and scripts
├── vercel.json              # Vercel configuration
└── README.md                # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |

### File Upload Limits

- **Individual Images**: 5MB maximum
- **Gallery Images**: 3 images maximum
- **Total Gallery Size**: 50MB maximum
- **Supported Formats**: JPG, PNG, GIF, WebP

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Server-side validation for all inputs
- **File Type Validation**: Only image files allowed
- **CORS Protection**: Configured for production
- **Environment Variables**: Sensitive data protected

## 🚀 Performance Optimizations

- **Database Indexing**: Optimized queries for user and strain
- **Connection Pooling**: Efficient MongoDB connections
- **File Size Limits**: Prevents memory issues
- **Error Handling**: Comprehensive error management
- **Caching**: Database connection caching
- **Compression**: Express compression middleware

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check your connection string
   - Verify IP whitelist in MongoDB Atlas
   - Ensure database user has correct permissions

2. **JWT Token Issues**
   - Verify JWT_SECRET is set correctly
   - Check token expiration (24 hours default)
   - Clear browser localStorage if needed

3. **File Upload Errors**
   - Check file size limits (5MB per image)
   - Verify file type (images only)
   - Check Vercel function timeout limits

4. **Vercel Deployment Issues**
   - Check environment variables are set
   - Verify MongoDB connection string
   - Check Vercel function logs for errors

### Debug Mode

For local debugging, add to your `.env`:
```env
DEBUG=true
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Bootstrap for the responsive UI framework
- MongoDB Atlas for the database service
- Vercel for the hosting platform
- Font Awesome for the icons

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the Vercel function logs
3. Check MongoDB Atlas logs
4. Create an issue on GitHub

---

**Happy Pigeon Managing! 🐦✨**

## 🚀 Deployment Trigger

Updated for latest image upload fixes 