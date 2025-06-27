# Pigeon Management System

A full-stack pigeon management system with Node.js/Express backend, MongoDB, and a modern frontend. Deployable on Vercel.

## Features
- User authentication (signup/login with JWT)
- Pigeon CRUD operations
- Image uploads
- Responsive frontend

## Getting Started

### Prerequisites
- Node.js
- MongoDB Atlas or other MongoDB instance

### Environment Variables
Create a `.env` file in your project root with:

```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key-here
PORT=3000
NODE_ENV=development
```

- **MONGODB_URI**: Your MongoDB connection string (should match your Vercel deployment)
- **JWT_SECRET**: Any strong secret string

### Local Development
```bash
npm install
npm start
```
Visit [http://localhost:3000](http://localhost:3000)

### Deployment (Vercel)
- Set the same environment variables in your Vercel project settings.
- Deploy via GitHub or Vercel CLI.

## Troubleshooting
- Ensure your `.env` file is named correctly and in the project root.
- Make sure your local and Vercel `MONGODB_URI` values are identical.
- If you change the database, delete old users to avoid password mismatch issues.

## License
MIT 