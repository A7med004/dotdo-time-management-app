const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Todo = require('../models/Todo');

// Get all todos for a user
router.get('/', auth, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new todo
router.post('/', auth, async (req, res) => {
  try {
    const newTodo = new Todo({
      text: req.body.text,
      description: req.body.description || '',
      deadline: req.body.deadline || null,
      completed: false,
      userId: req.userId
    });

    const savedTodo = await newTodo.save();
    res.status(201).json(savedTodo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a todo
router.put('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    todo.text = req.body.text || todo.text;
    todo.description = req.body.description !== undefined ? req.body.description : todo.description;
    todo.deadline = req.body.deadline !== undefined ? req.body.deadline : todo.deadline;
    todo.completed = req.body.completed !== undefined ? req.body.completed : todo.completed;

    const updatedTodo = await todo.save();
    res.json(updatedTodo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a todo
router.delete('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    await todo.deleteOne();
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 