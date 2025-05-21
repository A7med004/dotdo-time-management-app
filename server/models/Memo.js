const mongoose = require('mongoose');

const memoSchema = new mongoose.Schema({
  content: {
    type: String,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  x: {
    type: Number,
    default: 100
  },
  y: {
    type: Number,
    default: 100
  },
  width: {
    type: Number,
    default: 200
  },
  height: {
    type: Number,
    default: 200
  },
  color: {
    type: String,
    default: '#ffd700' // Default to yellow
  },
  completed: {
    type: Boolean,
    default: false
  },
  image: {
    type: String, // URL to the uploaded image
    default: null
  }
});

memoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Memo', memoSchema); 