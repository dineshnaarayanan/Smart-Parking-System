const mongoose = require('mongoose');
const { seedMemorySlots, seedMemoryAdmin } = require('./memoryStore');

let mockMode = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-parking';
  
  try {
    // Attempt Mongoose connection with a short 2-second timeout
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000
    });
    mockMode = false;
    console.log('MongoDB Connected successfully.');
  } catch (err) {
    mockMode = true;
    console.warn('============================================================');
    console.warn('WARNING: Failed to connect to MongoDB server:');
    console.warn(err.message);
    console.warn('Falling back to In-Memory Database Mode for local execution.');
    console.warn('============================================================');
    
    // Seed in-memory database arrays
    seedMemorySlots();
    await seedMemoryAdmin();
  }
};

const isMock = () => mockMode;

module.exports = {
  connectDB,
  isMock
};
