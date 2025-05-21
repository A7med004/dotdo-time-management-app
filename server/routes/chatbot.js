const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const auth = require('../middleware/auth');

// Get chatbot response
router.post('/response', auth, chatbotController.getChatbotResponse);

module.exports = router; 