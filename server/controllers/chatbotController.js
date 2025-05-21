const axios = require('axios');
const Todo = require('../models/Todo');
const Memo = require('../models/Memo');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Debug log to check environment variables
console.log('Current directory:', __dirname);
console.log('Environment variables:', {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? 'exists' : 'missing',
  MONGODB_URI: process.env.MONGODB_URI ? 'exists' : 'missing',
  JWT_SECRET: process.env.JWT_SECRET ? 'exists' : 'missing',
  PORT: process.env.PORT ? 'exists' : 'missing'
});

// Helper function to get user context
const getUserContext = async (userId) => {
  try {
    console.log('Fetching context for user:', userId);
    const todos = await Todo.find({ userId: userId });
    console.log('Found todos:', todos);
    
    const memos = await Memo.find({ user: userId });
    console.log('Found memos:', memos);
    
    const completedTasks = todos.filter(todo => todo.completed).length;
    const pendingTasks = todos.filter(todo => !todo.completed).length;
    const totalTasks = todos.length;
    const totalMemos = memos.length;
    
    return {
      todos,
      memos,
      stats: {
        completedTasks,
        pendingTasks,
        totalTasks,
        totalMemos
      }
    };
  } catch (error) {
    console.error('Error in getUserContext:', error);
    return {
      todos: [],
      memos: [],
      stats: {
        completedTasks: 0,
        pendingTasks: 0,
        totalTasks: 0,
        totalMemos: 0
      }
    };
  }
};

// Helper function to parse user intent
const parseIntent = async (message, userId) => {
  const lowerMessage = message.toLowerCase();
  
  // Task review intents
  if (lowerMessage.includes('show me my tasks') || 
      lowerMessage.includes('list my tasks') || 
      lowerMessage.includes('what are my tasks') ||
      lowerMessage.includes('my tasks')) {
    return { type: 'list_all_tasks', data: null };
  }
  
  if (lowerMessage.includes('how many tasks') || lowerMessage.includes('task summary')) {
    return { type: 'task_summary', data: null };
  }
  
  if (lowerMessage.includes('pending tasks') || lowerMessage.includes('unfinished tasks')) {
    return { type: 'pending_tasks', data: null };
  }
  
  if (lowerMessage.includes('completed tasks') || lowerMessage.includes('finished tasks')) {
    return { type: 'completed_tasks', data: null };
  }
  
  if (lowerMessage.includes('task status') || lowerMessage.includes('task progress')) {
    return { type: 'task_status', data: null };
  }
  
  // Task management intents
  if (lowerMessage.includes('add task') || lowerMessage.includes('new task') || lowerMessage.includes('create task')) {
    // Extract task title and deadline with improved pattern
    const taskMatch = message.match(/add task (.+?)(?:\s+(?:by|due|deadline)\s+)(.+)/i) || 
                     message.match(/new task (.+?)(?:\s+(?:by|due|deadline)\s+)(.+)/i) || 
                     message.match(/create task (.+?)(?:\s+(?:by|due|deadline)\s+)(.+)/i);
    
    if (taskMatch) {
      console.log('Task match found:', taskMatch);
      return { 
        type: 'add_todo', 
        data: { 
          title: taskMatch[1].trim(),
          deadline: taskMatch[2].trim()
        }
      };
    }
    
    // If no deadline specified, just get the title
    const title = message.match(/add task (.+)/i)?.[1] || 
                 message.match(/new task (.+)/i)?.[1] || 
                 message.match(/create task (.+)/i)?.[1];
    return { type: 'add_todo', data: { title } };
  }
  
  if (lowerMessage.includes('complete task') || lowerMessage.includes('finish task')) {
    const title = message.match(/complete task (.+)/i)?.[1] || 
                 message.match(/finish task (.+)/i)?.[1];
    return { type: 'complete_todo', data: { title } };
  }
  
  if (lowerMessage.includes('delete task') || lowerMessage.includes('remove task')) {
    const title = message.match(/delete task (.+)/i)?.[1] || 
                 message.match(/remove task (.+)/i)?.[1];
    return { type: 'delete_todo', data: { title } };
  }
  
  // Memo intents
  if (lowerMessage.includes('show memos') || lowerMessage.includes('my notes')) {
    return { type: 'list_memos', data: null };
  }
  
  if (lowerMessage.includes('add memo') || lowerMessage.includes('new note')) {
    const content = message.match(/add memo (.+)/i)?.[1] || 
                   message.match(/new note (.+)/i)?.[1];
    return { type: 'add_memo', data: { content } };
  }
  
  // General context intents
  if (lowerMessage.includes('my progress') || lowerMessage.includes('how am i doing')) {
    return { type: 'user_progress', data: null };
  }
  
  return { type: 'chat', data: null };
};

// Helper function to parse natural language dates
const parseNaturalDate = (dateStr) => {
  const lowerDate = dateStr.toLowerCase().trim();
  const today = new Date();
  
  // Handle relative dates
  if (lowerDate === 'today') {
    return today;
  }
  if (lowerDate === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  if (lowerDate === 'next week') {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek;
  }
  
  // Handle "next [day]" format
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const nextDayMatch = lowerDate.match(/next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (nextDayMatch) {
    const targetDay = daysOfWeek.indexOf(nextDayMatch[1].toLowerCase());
    const currentDay = today.getDay();
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;
    const nextWeekDate = new Date(today);
    nextWeekDate.setDate(today.getDate() + daysUntilTarget + 7);
    return nextWeekDate;
  }
  
  // Handle "in X days" format
  const daysMatch = lowerDate.match(/in (\d+) days?/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    return futureDate;
  }
  
  // Handle standard date formats
  try {
    // Try parsing as ISO date (YYYY-MM-DD)
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
    
    // Try parsing as MM/DD/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0]) - 1;
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  } catch (error) {
    console.error('Error parsing date:', error);
  }
  
  return null;
};

// Helper function to handle todo operations
const handleTodoOperation = async (intent, userId) => {
  try {
    console.log('Handling todo operation:', intent.type, 'for user:', userId);
    const context = await getUserContext(userId);
    console.log('Context for todo operation:', context);
    
    switch (intent.type) {
      case 'list_all_tasks':
        if (context.todos.length === 0) {
          return "You don't have any tasks yet. Would you like to add one? You can say 'add task [task name]' to create a new task.";
        }
        const taskList = context.todos.map(todo => {
          let taskText = `• ${todo.text}`;
          if (todo.deadline) {
            const deadline = new Date(todo.deadline);
            taskText += ` (Due: ${deadline.toLocaleDateString()})`;
          }
          taskText += ` (${todo.completed ? '✅' : '⏳'})`;
          if (todo.createdByBot) {
            taskText += ' 🤖';
          }
          return taskText;
        }).join('\n');
        console.log('Generated task list:', taskList);
        return `Here are all your tasks:\n${taskList}`;

      case 'task_summary':
        return `📊 Task Summary:\n` +
               `• Total Tasks: ${context.stats.totalTasks}\n` +
               `• Completed: ${context.stats.completedTasks}\n` +
               `• Pending: ${context.stats.pendingTasks}`;

      case 'pending_tasks':
        const pendingTasks = context.todos.filter(todo => !todo.completed);
        if (pendingTasks.length === 0) return "You have no pending tasks! 🎉";
        return `📝 Pending Tasks:\n${pendingTasks.map(todo => {
          let taskText = `• ${todo.text}`;
          if (todo.deadline) {
            const deadline = new Date(todo.deadline);
            taskText += ` (Due: ${deadline.toLocaleDateString()})`;
          }
          if (todo.createdByBot) {
            taskText += ' 🤖';
          }
          return taskText;
        }).join('\n')}`;

      case 'completed_tasks':
        const completedTasks = context.todos.filter(todo => todo.completed);
        if (completedTasks.length === 0) return "You haven't completed any tasks yet.";
        return `✅ Completed Tasks:\n${completedTasks.map(todo => {
          let taskText = `• ${todo.text}`;
          if (todo.deadline) {
            const deadline = new Date(todo.deadline);
            taskText += ` (Due: ${deadline.toLocaleDateString()})`;
          }
          if (todo.createdByBot) {
            taskText += ' 🤖';
          }
          return taskText;
        }).join('\n')}`;

      case 'task_status':
        const progress = (context.stats.completedTasks / context.stats.totalTasks * 100) || 0;
        return `📈 Task Progress:\n` +
               `• Total Tasks: ${context.stats.totalTasks}\n` +
               `• Completed: ${context.stats.completedTasks}\n` +
               `• Pending: ${context.stats.pendingTasks}\n` +
               `• Progress: ${progress.toFixed(1)}%`;

      case 'add_todo':
        if (!intent.data.title) return "Please specify a task title.";
        
        // Parse deadline if provided
        let deadline = null;
        if (intent.data.deadline) {
          deadline = parseNaturalDate(intent.data.deadline);
          if (!deadline) {
            return "❌ Invalid deadline format. Please use one of these formats:\n" +
                   "• 'tomorrow'\n" +
                   "• 'next monday'\n" +
                   "• 'in 3 days'\n" +
                   "• '2024-03-20'\n" +
                   "• '3/20/2024'";
          }
        }

        const newTodo = new Todo({
          text: intent.data.title,
          userId: userId,
          completed: false,
          deadline: deadline,
          createdByBot: true
        });
        await newTodo.save();
        console.log('Added new todo:', newTodo);
        
        let response = `✅ Task Added:\n` +
                      `• Title: ${intent.data.title}`;
        if (deadline) {
          response += `\n• Due: ${deadline.toLocaleDateString()}`;
        }
        response += '\n• Created by: 🤖';
        return response;

      case 'complete_todo':
        if (!intent.data.title) return "Please specify which task to complete.";
        const todo = await Todo.findOne({ 
          text: { $regex: new RegExp(intent.data.title, 'i') },
          userId: userId 
        });
        if (!todo) return "❌ Task not found.";
        todo.completed = true;
        await todo.save();
        let completeResponse = `✅ Task Completed:\n` +
                             `• Title: ${todo.text}`;
        if (todo.createdByBot) {
          completeResponse += '\n• Created by: 🤖';
        }
        return completeResponse;

      case 'delete_todo':
        if (!intent.data.title) return "Please specify which task to delete.";
        const todoToDelete = await Todo.findOne({ 
          text: { $regex: new RegExp(intent.data.title, 'i') },
          userId: userId 
        });
        if (!todoToDelete) return "❌ Task not found.";
        await Todo.deleteOne({ _id: todoToDelete._id });
        let deleteResponse = `🗑️ Task Deleted:\n` +
                           `• Title: ${todoToDelete.text}`;
        if (todoToDelete.createdByBot) {
          deleteResponse += '\n• Created by: 🤖';
        }
        return deleteResponse;

      default:
        return null;
    }
  } catch (error) {
    console.error('Error in handleTodoOperation:', error);
    return "❌ Sorry, I encountered an error while processing your request. Please try again.";
  }
};

// Helper function to handle memo operations
const handleMemoOperation = async (intent, userId) => {
  const context = await getUserContext(userId);
  
  switch (intent.type) {
    case 'list_memos':
      if (context.memos.length === 0) return "You have no notes yet.";
      return `📝 Your Notes:\n${context.memos.map(memo => 
        `• ${memo.content.substring(0, 50)}${memo.content.length > 50 ? '...' : ''}`
      ).join('\n')}`;

    case 'add_memo':
      if (!intent.data.content) return "Please specify the note content.";
      const newMemo = new Memo({
        content: intent.data.content,
        user: userId
      });
      await newMemo.save();
      return `✅ Note Added:\n• Content: ${intent.data.content}`;

    default:
      return null;
  }
};

// Helper function to handle user progress
const handleUserProgress = async (userId) => {
  const context = await getUserContext(userId);
  const progress = (context.stats.completedTasks / context.stats.totalTasks * 100) || 0;
  
  let message = `📊 Productivity Summary:\n\n`;
  message += `📈 Task Progress:\n`;
  message += `• Total Tasks: ${context.stats.totalTasks}\n`;
  message += `• Completed: ${context.stats.completedTasks}\n`;
  message += `• Pending: ${context.stats.pendingTasks}\n`;
  message += `• Progress: ${progress.toFixed(1)}%\n\n`;
  
  message += `📝 Notes:\n`;
  message += `• Total Notes: ${context.stats.totalMemos}\n\n`;
  
  if (progress === 100) {
    message += `🎉 Amazing! You've completed all your tasks!`;
  } else if (progress >= 75) {
    message += `🌟 Great progress! You're almost there!`;
  } else if (progress >= 50) {
    message += `👍 Good work! Keep going!`;
  } else if (progress > 0) {
    message += `💪 You're making progress! Keep it up!`;
  } else {
    message += `🎯 Time to get started! You can do it!`;
  }
  
  return message;
};

exports.getChatbotResponse = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Received message:', message);

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not set in environment variables');
    }

    // Parse user intent
    const intent = await parseIntent(message, userId);
    console.log('Detected intent:', intent.type);
    
    // Handle operations based on intent
    if (intent.type !== 'chat') {
      let operationResponse = null;
      
      // Handle task operations
      if (intent.type === 'list_all_tasks' || 
          intent.type === 'task_summary' || 
          intent.type === 'pending_tasks' || 
          intent.type === 'completed_tasks' || 
          intent.type === 'task_status' || 
          intent.type === 'add_todo' || 
          intent.type === 'complete_todo' || 
          intent.type === 'delete_todo') {
        operationResponse = await handleTodoOperation(intent, userId);
      } 
      // Handle memo operations
      else if (intent.type === 'list_memos' || intent.type === 'add_memo') {
        operationResponse = await handleMemoOperation(intent, userId);
      } 
      // Handle progress check
      else if (intent.type === 'user_progress') {
        operationResponse = await handleUserProgress(userId);
      }
      
      if (operationResponse) {
        console.log('Operation response:', operationResponse);
        return res.json({ response: operationResponse });
      }
    }

    // Get user context for the AI
    const context = await getUserContext(userId);
    const contextPrompt = `
User's current status:
- Total tasks: ${context.stats.totalTasks}
- Completed tasks: ${context.stats.completedTasks}
- Pending tasks: ${context.stats.pendingTasks}
- Total notes: ${context.stats.totalMemos}

Recent tasks:
${context.todos.slice(-3).map(todo => `- ${todo.text} (${todo.completed ? 'completed' : 'pending'})`).join('\n')}

Recent notes:
${context.memos.slice(-2).map(memo => `- ${memo.content.substring(0, 30)}...`).join('\n')}
`;

    // Enhanced system prompt with specific behavior controls
    const systemPrompt = `You are Remindy, an AI assistant for a productivity app called DotDo. Follow these guidelines strictly:

1. Personality:
   - Be friendly and encouraging
   - Use a warm, professional tone
   - Keep responses concise (2-3 sentences maximum)
   - Use emojis sparingly and appropriately

2. Core Functions:
   - Task Management: Help users organize, prioritize, and track tasks
   - Pomodoro Technique: Guide users through work/break cycles
   - Memo/Note Taking: Assist with organizing thoughts and ideas
   - Productivity Advice: Provide actionable tips and strategies

3. Response Rules:
   - Always stay focused on productivity and task management
   - If asked about non-productivity topics, politely redirect to productivity
   - Never provide personal opinions or controversial advice
   - Use bullet points for lists of suggestions
   - Include specific, actionable steps when possible

4. Format Guidelines:
   - Use markdown for formatting (bold, lists, etc.)
   - Keep paragraphs short and scannable
   - Use numbered lists for step-by-step instructions
   - Use bullet points for suggestions or options

5. Error Handling:
   - If you don't understand a request, ask for clarification
   - If a request is outside your scope, suggest relevant productivity features
   - Always maintain a helpful and positive attitude

${contextPrompt}

Remember: Your primary goal is to help users be more productive and organized.`;

    // Call OpenRouter API
    console.log('Sending message to OpenRouter API...');
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5001',
          'X-Title': 'Remindy Chatbot'
        },
      }
    );

    console.log('Received response from OpenRouter API');
    
    // Extract the response text
    const responseText = response.data.choices[0].message.content;
    console.log('Response:', responseText);

    res.json({ response: responseText });
  } catch (error) {
    console.error('Error in chatbot response:', {
      name: error.name,
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });

    // Check if it's an API key issue
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        details: 'Please check your OpenRouter API key'
      });
    }

    res.status(500).json({ 
      error: 'Failed to get chatbot response',
      details: error.message
    });
  }
};