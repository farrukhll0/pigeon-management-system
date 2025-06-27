require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Use the MongoDB connection string with your password
    const mongoURI = 'mongodb+srv://farrukhll0:aqr2960@cluster0.mongodb.net/pegions';
    console.log('MongoDB URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB successfully!');
    
    // Check what database we're connected to
    const dbName = mongoose.connection.db.databaseName;
    console.log('Connected to database:', dbName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));
    
    // Check if users collection exists and count users
    const userCount = await User.countDocuments();
    console.log('Number of users in database:', userCount);
    
    // List all users (without passwords)
    const users = await User.find({}, 'name email createdAt');
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Created: ${user.createdAt}`);
    });
    
    await mongoose.connection.close();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase(); 