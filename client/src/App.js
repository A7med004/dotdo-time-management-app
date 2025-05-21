import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTrash, FaCheck, FaEdit, FaClock, FaCalendarAlt, FaSignOutAlt, FaTasks, FaCalendar, FaUser, FaCog, FaBell, FaLock, FaStickyNote, FaRobot } from 'react-icons/fa';
import Login from './components/Login';
import Signup from './components/Signup';
import Developers from './Developers';
import MemoBoard from './components/MemoBoard';
import MemoBoardPage from './pages/MemoBoardPage';
import PomodoroPage from './pages/PomodoroPage';
import RemindyPage from './pages/RemindyPage';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

// TodoList component
const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [editingTodo, setEditingTodo] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [userProfile, setUserProfile] = useState({
    username: localStorage.getItem('username') || 'User',
    profileImage: localStorage.getItem('profileImage')
  });
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks', 'calendar', or 'memo'
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const settingsModalRef = useRef(null);
  // Settings state
  const [newUsername, setNewUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [profileImageLoading, setProfileImageLoading] = useState(false);
  const [profileImageError, setProfileImageError] = useState('');
  const [profileImageSuccess, setProfileImageSuccess] = useState('');
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchTodos();
    // Update time every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatCurrentTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrentDayDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const fetchTodos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/todos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched todos:', response.data);
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const todoData = {
      text: newTodo.trim(),
      description: newDescription.trim(),
      deadline: newDeadline || null,
      completed: false
    };

    console.log('Sending todo data:', todoData);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5001/api/todos', todoData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Server response:', response.data);
      
      const newTodoItem = response.data;
      setTodos(prevTodos => [newTodoItem, ...prevTodos]);
      
      setNewTodo('');
      setNewDescription('');
      setNewDeadline('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const toggleTodo = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const todo = todos.find(t => t._id === id);
      const response = await axios.put(`http://localhost:5001/api/todos/${id}`, {
        ...todo,
        completed: !todo.completed
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodos(todos.map(todo => 
        todo._id === id ? response.data : todo
      ));
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  };

  const confirmDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const deleteTodo = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/todos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodos(todos.filter(todo => todo._id !== id));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const startEditing = (todo) => {
    console.log('Starting edit for todo:', todo);
    setEditingTodo(todo._id);
    setEditText(todo.text);
    setEditDescription(todo.description || '');
    setEditDeadline(todo.deadline ? new Date(todo.deadline).toISOString().split('T')[0] : '');
  };

  const saveEdit = async (id) => {
    const editData = {
      text: editText.trim(),
      description: editDescription.trim(),
      deadline: editDeadline || null
    };

    console.log('Saving edit with data:', editData);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5001/api/todos/${id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Edit response:', response.data);
      setTodos(todos.map(todo => 
        todo._id === id ? response.data : todo
      ));
      setEditingTodo(null);
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('profileImage');
    window.location.href = '/login';
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleClickOutside = (event) => {
    if (!event.target.closest('.profile-menu')) {
      setShowProfileMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Helper to group todos by date
  const groupTodosByDate = (todos) => {
    const groups = {};
    todos.forEach(todo => {
      const dateKey = todo.deadline ? new Date(todo.deadline).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      }) : 'No Date';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(todo);
    });
    return groups;
  };

  // Helper to get days in current month and first day
  const getCalendarMatrix = (todos) => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
    const matrix = [];
    let week = new Array(7).fill(null);
    let day = 1;
    // Map todos by date string 'YYYY-MM-DD'
    const todoMap = {};
    todos.forEach(todo => {
      if (todo.deadline) {
        const d = new Date(todo.deadline);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (!todoMap[key]) todoMap[key] = [];
        todoMap[key].push(todo);
      }
    });
    // Fill first week
    for (let i = 0; i < 7; i++) {
      if (i >= startDay) {
        week[i] = day++;
      }
    }
    matrix.push(week);
    // Fill remaining weeks
    while (day <= numDays) {
      week = new Array(7).fill(null);
      for (let i = 0; i < 7 && day <= numDays; i++) {
        week[i] = day++;
      }
      matrix.push(week);
    }
    return { matrix, todoMap, year, month };
  };

  // Add these helper functions for month navigation
  const goToPreviousMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  // Add these helper functions for date grouping
  const getDateGroup = (deadline) => {
    if (!deadline) return 'No Deadline';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const taskDate = new Date(deadline);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate.getTime() === today.getTime()) return 'Today';
    if (taskDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
    if (taskDate < nextWeek) return 'This Week';
    if (taskDate < new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000)) return 'Next Week';
    return 'Later';
  };

  return (
    <div className="min-h-screen bg-gray-100 font-cal flex">
      {/* Left Sidebar */}
      <div className="fixed top-0 left-0 h-screen w-28 bg-white shadow-lg flex flex-col items-center py-8 z-50">
        {/* Logo as a button */}
        <button onClick={() => navigate('/developers')} className="focus:outline-none mb-8 group">
          <img src="/logo.png" alt="DotDo Logo" className="w-16 h-16 rounded-lg shadow transition-transform duration-1000 group-hover:rotate-90" />
        </button>

        {/* Memo Board Button */}
        <Link
          to="/memo-board"
          className="flex flex-col items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
            <FaStickyNote className="text-xl" />
          </div>
          <span className="text-base font-bold text-gray-800">Memo Board</span>
        </Link>

        {/* Tomato Tick Button */}
        <Link
          to="/tomato-tick"
          className="mt-4 flex flex-col items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white">
            <FaClock className="text-xl" />
          </div>
          <span className="text-base font-bold text-gray-800">Tomato Tick</span>
        </Link>

        {/* Remindy Chatbot Button */}
        <Link
          to="/remindy"
          className="mt-4 flex flex-col items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white">
            <FaRobot className="text-xl" />
          </div>
          <span className="text-base font-bold text-gray-800">Remindy</span>
        </Link>

        {/* Spacer to push profile to bottom */}
        <div className="flex-grow"></div>

        {/* Profile Section with Dropdown */}
        <div className="relative profile-menu flex flex-col items-center gap-3">
          <button
            onClick={handleProfileClick}
            className="flex flex-col items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors"
          >
            {userProfile.profileImage ? (
              <img
                src={`http://localhost:5001/${userProfile.profileImage}`}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold">
                {userProfile.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-base font-bold text-gray-800 mt-1">{userProfile.username}</span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute left-20 bottom-0 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                <FaUser className="text-gray-500" />
                My Profile
              </button>
              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => { setShowSettings(true); setShowProfileMenu(false); }}>
                <FaCog className="text-gray-500" />
                Settings
              </button>
              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                <FaBell className="text-gray-500" />
                Notifications
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <FaSignOutAlt className="text-red-500" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Main Content */}
      <div className="ml-28 flex-1">
        {/* Top Bar (Navigation Tabs) */}
        <div className="bg-white shadow-md">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-center space-x-8 py-4">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'tasks'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaTasks className="text-lg" />
                My Tasks
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'calendar'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaCalendar className="text-lg" />
                Calendar
              </button>
            </div>
          </div>
        </div>
        {/* Main Page Content */}
        <div className="py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex flex-col items-center mb-8">
              <div className="flex flex-col items-center text-lg text-gray-600 font-medium">
                <span>{formatCurrentTime(currentDateTime)}</span>
                <span className="text-base text-gray-500 font-normal">{formatCurrentDayDate(currentDateTime)}</span>
              </div>
              <h1 className="text-6xl font-bold text-gray-800 cal-sans-text mt-2">
                DotDo
              </h1>
              <div className="text-base text-gray-500 font-light mt-1 tracking-wide">
                DotDo — Stay on Point.
              </div>
            </div>

            {activeTab === 'tasks' && (
              <>
                <form onSubmit={addTodo} className="mb-8 space-y-4 font-cal">
                  <div>
                    <input
                      type="text"
                      value={newTodo}
                      onChange={(e) => setNewTodo(e.target.value)}
                      placeholder="Add a new todo..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 font-cal"
                    />
                  </div>
                  <div>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Add a description (optional)..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 font-cal"
                      rows="2"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 font-cal"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-cal"
                  >
                    Add Todo
                  </button>
                </form>

                <div className="space-y-8 font-cal">
                  {(() => {
                    // Group todos by deadline
                    const groupedTodos = todos.reduce((groups, todo) => {
                      const group = getDateGroup(todo.deadline);
                      if (!groups[group]) groups[group] = [];
                      groups[group].push(todo);
                      return groups;
                    }, {});

                    // Define the order of groups
                    const groupOrder = ['Today', 'Tomorrow', 'This Week', 'Next Week', 'Later', 'No Deadline'];

                    return groupOrder.map(group => {
                      const groupTodos = groupedTodos[group] || [];
                      if (groupTodos.length === 0) return null;

                      return (
                        <div key={group} className="space-y-4">
                          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            {group === 'Today' && <FaCalendarAlt className="text-blue-500" />}
                            {group === 'Tomorrow' && <FaCalendarAlt className="text-green-500" />}
                            {group === 'This Week' && <FaCalendarAlt className="text-yellow-500" />}
                            {group === 'Next Week' && <FaCalendarAlt className="text-orange-500" />}
                            {group === 'Later' && <FaCalendarAlt className="text-red-500" />}
                            {group === 'No Deadline' && <FaCalendarAlt className="text-gray-500" />}
                            {group}
                          </h3>
                          {groupTodos.map((todo) => (
                            <div
                              key={todo._id}
                              className="bg-white rounded-lg shadow p-4"
                            >
                              {editingTodo === todo._id ? (
                                <div className="space-y-4">
                                  <input
                                    type="text"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                                  />
                                  <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="Add a description (optional)..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                                    rows="2"
                                  />
                                  <input
                                    type="date"
                                    value={editDeadline}
                                    onChange={(e) => setEditDeadline(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => saveEdit(todo._id)}
                                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingTodo(null)}
                                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={() => toggleTodo(todo._id)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                          ${todo.completed 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'border-gray-300 hover:border-green-500'
                                          }`}
                                      >
                                        {todo.completed && <FaCheck className="w-3 h-3" />}
                                      </button>
                                      <span className={`text-lg ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                        {todo.text}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => startEditing(todo)}
                                        className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                                      >
                                        <FaEdit />
                                      </button>
                                      {deleteConfirmId === todo._id ? (
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => deleteTodo(todo._id)}
                                            className="p-2 text-red-500 hover:text-red-600 transition-colors"
                                          >
                                            <FaTrash />
                                          </button>
                                          <button
                                            onClick={cancelDelete}
                                            className="text-sm text-gray-500 hover:text-gray-600"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => confirmDelete(todo._id)}
                                          className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                                        >
                                          <FaTrash />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {todo.description && (
                                    <p className="text-gray-600 ml-9">{todo.description}</p>
                                  )}
                                  {todo.deadline && (
                                    <div className="flex items-center gap-2 ml-9 text-sm">
                                      <FaCalendarAlt className="text-gray-500" />
                                      <span className={`${isOverdue(todo.deadline) && !todo.completed ? 'text-red-500' : 'text-gray-500'}`}>
                                        {formatDeadline(todo.deadline)}
                                        {isOverdue(todo.deadline) && !todo.completed && ' (Overdue)'}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 ml-9 text-sm text-gray-500">
                                    <FaClock />
                                    <span>Created: {formatDateTime(todo.createdAt)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            )}

            {activeTab === 'calendar' && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-800">Calendar</h2>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={goToPreviousMonth}
                      className="p-2 hover:bg-blue-50 rounded-full transition-colors group"
                    >
                      <svg className="w-6 h-6 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={goToCurrentMonth}
                      className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg"
                    >
                      Today
                    </button>
                    <button
                      onClick={goToNextMonth}
                      className="p-2 hover:bg-blue-50 rounded-full transition-colors group"
                    >
                      <svg className="w-6 h-6 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                  {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                {/* Monthly calendar grid */}
                {todos.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No tasks to display.</p>
                  </div>
                ) : (
                  (() => {
                    const { matrix, todoMap, year, month } = getCalendarMatrix(todos);
                    const daysShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                    return (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                          <thead>
                            <tr>
                              {daysShort.map(day => (
                                <th key={day} className="px-4 py-3 text-center text-sm font-semibold text-blue-600 bg-blue-50 first:rounded-tl-lg last:rounded-tr-lg">
                                  {day}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {matrix.map((week, wi) => (
                              <tr key={wi} className="border-b border-gray-100 last:border-b-0">
                                {week.map((date, di) => {
                                  const dateKey = date
                                    ? `${year}-${String(month+1).padStart(2,'0')}-${String(date).padStart(2,'0')}`
                                    : null;
                                  const today = new Date();
                                  const isToday = date &&
                                    today.getFullYear() === year &&
                                    today.getMonth() === month &&
                                    today.getDate() === date;
                                  const isWeekend = di === 0 || di === 6;
                                  
                                  return (
                                    <td
                                      key={di}
                                      className={`h-32 align-top p-2 transition-colors hover:bg-gray-50
                                        ${isWeekend ? 'bg-gray-50' : 'bg-white'}
                                        ${isToday ? 'bg-blue-50' : ''}
                                        ${di === 0 ? 'border-l border-gray-100' : ''}
                                        ${di === 6 ? 'border-r border-gray-100' : ''}
                                      `}
                                    >
                                      {date && (
                                        <div className="h-full">
                                          <div className={`text-sm font-semibold mb-2 px-2 py-1 rounded-full inline-block
                                            ${isToday 
                                              ? 'bg-blue-500 text-white' 
                                              : isWeekend 
                                                ? 'text-gray-500' 
                                                : 'text-gray-700'
                                            }`}
                                          >
                                            {date}
                                          </div>
                                          <div className="space-y-1 max-h-[calc(100%-2rem)] overflow-y-auto pr-1">
                                            {(todoMap[dateKey] || []).map(task => (
                                              <div
                                                key={task._id}
                                                className={`p-1.5 rounded-md text-xs transition-colors
                                                  ${task.completed 
                                                    ? 'bg-gray-100 text-gray-500' 
                                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                  }`}
                                              >
                                                <div className="flex items-center gap-1.5">
                                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                                                    ${task.completed ? 'bg-gray-400' : 'bg-blue-500'}`}
                                                  />
                                                  <span className={`truncate ${task.completed ? 'line-through' : ''}`}>
                                                    {task.text}
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div ref={settingsModalRef} className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-blue-700 flex items-center gap-2">
              <FaCog className="text-blue-500" />
              Settings
            </h2>

            {/* Current Profile Section */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaUser className="text-blue-500" />
                Current Profile
              </h3>
              <div className="flex items-center gap-4">
                {userProfile.profileImage ? (
                  <img
                    src={`http://localhost:5001/${userProfile.profileImage}`}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {userProfile.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-gray-800 font-medium">Username</p>
                  <p className="text-gray-600">{userProfile.username}</p>
                </div>
              </div>
            </div>

            {/* Change Username */}
            <form className="mb-6" onSubmit={async (e) => {
              e.preventDefault();
              setUsernameLoading(true);
              setUsernameError('');
              setUsernameSuccess('');
              try {
                const token = localStorage.getItem('token');
                const response = await axios.put('http://localhost:5001/api/auth/update-username',
                  { username: newUsername },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                // Update localStorage and UI
                localStorage.setItem('username', newUsername);
                setUserProfile((prev) => ({ ...prev, username: newUsername }));
                setUsernameSuccess('Username updated successfully!');
                setNewUsername('');
              } catch (err) {
                setUsernameError(err.response?.data?.message || 'Failed to update username');
              } finally {
                setUsernameLoading(false);
              }
            }}>
              <label className="block mb-1 font-medium text-gray-700 flex items-center gap-2">
                <FaUser className="text-blue-500" />
                Change Username
              </label>
              <input type="text" className="w-full px-3 py-2 border rounded mb-2" placeholder="New username" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
              {usernameError && <div className="text-red-500 text-sm mb-2">{usernameError}</div>}
              {usernameSuccess && <div className="text-green-600 text-sm mb-2">{usernameSuccess}</div>}
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2 justify-center" disabled={usernameLoading}>
                {usernameLoading ? 'Updating...' : 'Update Username'}
              </button>
            </form>

            {/* Change Profile Image */}
            <form className="mb-6" onSubmit={async (e) => {
              e.preventDefault();
              setProfileImageError('');
              setProfileImageSuccess('');
              setProfileImageLoading(true);
              try {
                const token = localStorage.getItem('token');
                const formData = new FormData();
                formData.append('profileImage', e.target.profileImage.files[0]);
                const response = await axios.put(
                  'http://localhost:5001/api/auth/update-profile-image',
                  formData,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'multipart/form-data',
                    },
                  }
                );
                // Update localStorage and UI
                localStorage.setItem('profileImage', response.data.profileImage);
                setUserProfile((prev) => ({
                  ...prev,
                  profileImage: response.data.profileImage,
                }));
                setProfileImageSuccess('Profile image updated successfully!');
                e.target.reset();
              } catch (err) {
                setProfileImageError(
                  err.response?.data?.message || 'Failed to update profile image'
                );
              } finally {
                setProfileImageLoading(false);
              }
            }}>
              <label className="block mb-1 font-medium text-gray-700 flex items-center gap-2">
                <FaUser className="text-blue-500" />
                Change Profile Image
              </label>
              <input type="file" name="profileImage" accept="image/*" className="w-full px-3 py-2 border rounded mb-2" required />
              {profileImageError && (
                <div className="text-red-500 text-sm mb-2">{profileImageError}</div>
              )}
              {profileImageSuccess && (
                <div className="text-green-600 text-sm mb-2">{profileImageSuccess}</div>
              )}
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2 justify-center" disabled={profileImageLoading}>
                {profileImageLoading ? 'Updating...' : 'Update Image'}
              </button>
            </form>

            {/* Change Password */}
            <form>
              <label className="block mb-1 font-medium text-gray-700 flex items-center gap-2">
                <FaLock className="text-blue-500" />
                Change Password
              </label>
              <input type="password" className="w-full px-3 py-2 border rounded mb-2" placeholder="Current password" />
              <input type="password" className="w-full px-3 py-2 border rounded mb-2" placeholder="New password" />
              <input type="password" className="w-full px-3 py-2 border rounded mb-2" placeholder="Confirm new password" />
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2 justify-center">
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App component
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/developers" element={<Developers />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <TodoList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/memo-board"
          element={
            <ProtectedRoute>
              <MemoBoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tomato-tick"
          element={
            <ProtectedRoute>
              <PomodoroPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/remindy"
          element={
            <ProtectedRoute>
              <RemindyPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App; 