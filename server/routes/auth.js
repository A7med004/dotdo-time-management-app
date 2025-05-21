const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Signup route
router.post('/signup', upload.single('profileImage'), async (req, res) => {
  try {
    console.log('Signup request headers:', req.headers);
    console.log('Signup request body:', req.body);
    console.log('Signup file:', req.file);

    const { email, password, username } = req.body;

    // Log the received data
    console.log('Received signup data:', {
      email: email || 'not provided',
      username: username || 'not provided',
      password: password ? 'provided' : 'not provided',
      hasImage: !!req.file
    });

    if (!email || !password || !username) {
      console.log('Missing required fields:', {
        email: !email,
        password: !password,
        username: !username
      });
      return res.status(400).json({ 
        message: 'Email, username, and password are required',
        details: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
          username: !username ? 'Username is required' : null
        }
      });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Validate username length
    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      console.log('User already exists:', {
        email: existingUser.email === email,
        username: existingUser.username === username
      });
      return res.status(400).json({ 
        message: existingUser.email === email ? 
          'Email already in use' : 
          'Username already taken'
      });
    }

    // Create new user
    const user = new User({ 
      email,
      password, 
      username,
      profileImage: req.file ? req.file.path : null
    });
    
    await user.save();
    console.log('New user created:', {
      email: user.email,
      username: user.username,
      hasProfileImage: !!user.profileImage
    });

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      token, 
      userId: user._id,
      username: user.username,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ 
      message: 'Error creating user', 
      error: error.message
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing login credentials:', {
        email: !email,
        password: !password
      });
      return res.status(400).json({ 
        message: 'Email and password are required',
        details: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User logged in successfully:', {
      email: user.email,
      username: user.username
    });

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({ 
      token, 
      userId: user._id,
      username: user.username,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Error logging in', 
      error: error.message
    });
  }
});

// Update username
router.put('/update-username', auth, async (req, res) => {
  try {
    const userId = req.userId; // from auth middleware
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Username is required' });

    // Check if username is already taken
    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { username },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Username updated', username: user.username });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile image
router.put('/update-profile-image', auth, upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: req.file.path },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile image updated', profileImage: user.profileImage });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile', error: error.message });
  }
});

module.exports = router; 