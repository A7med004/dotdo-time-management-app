const express = require('express');
const router = express.Router();
const Memo = require('../models/Memo');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/memos';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
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

// Get all memos for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const memos = await Memo.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(memos);
  } catch (error) {
    console.error('Error fetching memos:', error);
    res.status(500).json({ message: 'Error fetching memos', error: error.message });
  }
});

// Create a new memo
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('Creating memo with data:', {
      content: req.body.content,
      user: req.userId,
      x: req.body.x,
      y: req.body.y,
      width: req.body.width,
      height: req.body.height,
      color: req.body.color,
      completed: req.body.completed || false,
      image: req.file ? `/uploads/memos/${req.file.filename}` : null
    });

    const memo = new Memo({
      content: req.body.content || '',
      user: req.userId,
      x: req.body.x || 100,
      y: req.body.y || 100,
      width: req.body.width || 200,
      height: req.body.height || 200,
      color: req.body.color,
      completed: req.body.completed || false,
      image: req.file ? `/uploads/memos/${req.file.filename}` : null
    });

    const savedMemo = await memo.save();
    console.log('Memo created successfully:', savedMemo);
    res.status(201).json(savedMemo);
  } catch (error) {
    console.error('Error creating memo:', error);
    res.status(400).json({ message: 'Error creating memo', error: error.message });
  }
});

// Update a memo
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('Updating memo with data:', req.body);
    const memo = await Memo.findOne({ _id: req.params.id, user: req.userId });
    if (!memo) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    // Update only the fields that are provided
    if (req.body.content !== undefined) memo.content = req.body.content;
    if (req.body.x !== undefined) memo.x = req.body.x;
    if (req.body.y !== undefined) memo.y = req.body.y;
    if (req.body.width !== undefined) memo.width = req.body.width;
    if (req.body.height !== undefined) memo.height = req.body.height;
    if (req.body.color !== undefined) memo.color = req.body.color;
    if (req.body.completed !== undefined) {
      console.log('Setting completed status to:', req.body.completed);
      memo.completed = req.body.completed;
    }
    
    // Handle image upload
    if (req.file) {
      // Delete old image if it exists
      if (memo.image) {
        const oldImagePath = path.join(__dirname, '..', memo.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      memo.image = `/uploads/memos/${req.file.filename}`;
    }

    const updatedMemo = await memo.save();
    console.log('Memo updated successfully:', updatedMemo);
    
    // Ensure we're sending back the complete memo object
    const responseMemo = await Memo.findById(updatedMemo._id);
    res.json(responseMemo);
  } catch (error) {
    console.error('Error updating memo:', error);
    res.status(400).json({ message: 'Error updating memo', error: error.message });
  }
});

// Delete a memo
router.delete('/:id', auth, async (req, res) => {
  try {
    const memo = await Memo.findOne({ _id: req.params.id, user: req.userId });
    if (!memo) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    // Delete associated image if it exists
    if (memo.image) {
      const imagePath = path.join(__dirname, '..', memo.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await memo.deleteOne();
    res.json({ message: 'Memo deleted successfully' });
  } catch (error) {
    console.error('Error deleting memo:', error);
    res.status(500).json({ message: 'Error deleting memo', error: error.message });
  }
});

module.exports = router; 