const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Please create a .env file in the server directory with the following variables:');
  console.error(`
MONGODB_URI=mongodb://127.0.0.1:27017/todo-app
JWT_SECRET=your-secret-key-here
PORT=5001
  `);
  process.exit(1);
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Import routes
const authRoutes = require('./routes/auth');
const memoRoutes = require('./routes/memos');
const todoRoutes = require('./routes/todos');
const chatbotRoutes = require('./routes/chatbot');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
console.log('Attempting to connect to MongoDB...');

// Set up mongoose connection options
mongoose.set('strictQuery', false);
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('MongoDB connected successfully');
    console.log('Connection state:', mongoose.connection.readyState);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code
    });
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
}

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

// Initial connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/memos', memoRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/chatbot', chatbotRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 