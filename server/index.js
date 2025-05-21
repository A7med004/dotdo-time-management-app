const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const memoRoutes = require('./routes/memos');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/memos', memoRoutes); 