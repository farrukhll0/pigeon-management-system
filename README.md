# Pigeon Management System

A clean, full-stack application for managing pigeon data.

## Project Structure

```
Pegions/
├── lib/
│   └── db.js              # MongoDB connection
├── models/
│   ├── User.js            # User model
│   └── Pigeon.js          # Pigeon model
├── middleware/
│   ├── auth.js            # Authentication middleware
│   └── upload.js          # File upload middleware
├── public/
│   ├── index.html         # Main frontend page
│   └── script.js          # Frontend JavaScript
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
   ```

3. **Run the application:**
   ```bash
   npm start
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - API Health Check: http://localhost:3000/api/health

## Features

- User authentication (signup/login)
- Pigeon management (CRUD operations)
- File upload functionality
- MongoDB database integration
- RESTful API endpoints

## Next Steps

This is a clean setup ready for:
- Adding new features
- Deploying to any platform (Vercel, Heroku, etc.)
- Customizing the frontend
- Adding more API endpoints 