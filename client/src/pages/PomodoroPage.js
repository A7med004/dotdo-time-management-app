import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaRedo, FaCheck, FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const PomodoroPage = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro', 'shortBreak', 'longBreak'
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentTask, setCurrentTask] = useState(null);
  const timerRef = useRef(null);

  const modes = {
    pomodoro: { time: 25 * 60, color: 'bg-red-500', label: 'Focus' },
    shortBreak: { time: 5 * 60, color: 'bg-green-500', label: 'Short Break' },
    longBreak: { time: 15 * 60, color: 'bg-blue-500', label: 'Long Break' }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const handleTimerComplete = () => {
    if (mode === 'pomodoro') {
      setCompletedPomodoros(prev => prev + 1);
      if (currentTask) {
        setTasks(prev => prev.map(task => 
          task.id === currentTask.id 
            ? { ...task, completedPomodoros: (task.completedPomodoros || 0) + 1 }
            : task
        ));
      }
    }
  };

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(modes[mode].time);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(modes[newMode].time);
    setIsRunning(false);
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    const task = {
      id: Date.now(),
      text: newTask.trim(),
      completed: false,
      completedPomodoros: 0,
      estimatedPomodoros: 1
    };
    
    setTasks(prev => [...prev, task]);
    setNewTask('');
  };

  const toggleTask = (taskId) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    if (currentTask?.id === taskId) {
      setCurrentTask(null);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <FaArrowLeft />
          <span>Back to Main</span>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Pomodoro Timer</h1>
          <p className="text-gray-600">Stay focused and boost your productivity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Timer Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-center space-x-4 mb-6">
              {Object.entries(modes).map(([key, { label, color }]) => (
                <button
                  key={key}
                  onClick={() => switchMode(key)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    mode === key ? color + ' text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="text-center mb-8">
              <div className="text-7xl font-bold text-gray-800 mb-4">
                {formatTime(timeLeft)}
              </div>
              <div className="flex justify-center space-x-4">
                {!isRunning ? (
                  <button
                    onClick={startTimer}
                    className="px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <FaPlay /> Start
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="px-6 py-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors flex items-center gap-2"
                  >
                    <FaPause /> Pause
                  </button>
                )}
                <button
                  onClick={resetTimer}
                  className="px-6 py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <FaRedo /> Reset
                </button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600">
                Completed Pomodoros: <span className="font-bold text-gray-800">{completedPomodoros}</span>
              </p>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Tasks</h2>
            
            <form onSubmit={addTask} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <FaPlus /> Add
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border ${
                    task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                          ${task.completed 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-green-500'
                          }`}
                      >
                        {task.completed && <FaCheck className="w-3 h-3" />}
                      </button>
                      <span className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {task.completedPomodoros || 0}/{task.estimatedPomodoros} 🍅
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroPage; 