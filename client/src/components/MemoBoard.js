import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Rnd } from 'react-rnd';
import { FaTrash, FaEdit, FaStickyNote, FaTimes, FaUser } from 'react-icons/fa';

const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 200;
const COLORS = [
  '#ffd700', // Yellow
  '#98fb98', // Pale Green
  '#87ceeb', // Sky Blue
  '#dda0dd', // Plum
  '#f0e68c', // Khaki
  '#e6e6fa', // Lavender
  '#ffb6c1', // Light Pink
  '#b0e0e6', // Powder Blue
];

const MemoBoard = () => {
  const [memos, setMemos] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, memoId: null });
  const [user, setUser] = useState(null);
  const boardRef = useRef(null);

  useEffect(() => {
    fetchMemos();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching user profile with token:', token);
      
      if (!token) {
        console.error('No token found in localStorage');
        return;
      }

      const response = await axios.get('http://localhost:5001/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('User profile response:', response.data);
      
      if (response.data) {
        setUser(response.data);
        console.log('User state updated:', response.data);
      } else {
        console.error('No user data in response');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  const fetchMemos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/memos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMemos(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching memos:', error);
      setError('Failed to load memos. Please try again.');
    }
  };

  const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  const addNewMemo = async () => {
    try {
      const token = localStorage.getItem('token');
      const newMemo = {
        content: '',
        x: 50,
        y: 50,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        color: getRandomColor()
      };

      const response = await axios.post('http://localhost:5001/api/memos', newMemo, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMemos([...memos, response.data]);
      setEditingId(response.data._id);
      setError('');
    } catch (error) {
      console.error('Error adding memo:', error);
      setError('Failed to add memo. Please try again.');
    }
  };

  const showDeleteConfirm = (memoId) => {
    setDeleteConfirm({ show: true, memoId });
  };

  const hideDeleteConfirm = () => {
    setDeleteConfirm({ show: false, memoId: null });
  };

  const deleteMemo = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/memos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMemos(memos.filter(memo => memo._id !== id));
      setError('');
      hideDeleteConfirm();
    } catch (error) {
      console.error('Error deleting memo:', error);
      setError('Failed to delete memo. Please try again.');
    }
  };

  const updateMemo = async (id, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5001/api/memos/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMemos(memos.map(memo => memo._id === id ? response.data : memo));
      setError('');
    } catch (error) {
      console.error('Error updating memo:', error);
      setError('Failed to update memo. Please try again.');
    }
  };

  const handleDragStop = (id, e, d) => {
    updateMemo(id, { x: d.x, y: d.y });
  };

  const handleResizeStop = (id, e, direction, ref, delta, position) => {
    // Convert width and height from string (e.g., "200px") to number
    const width = parseInt(ref.style.width);
    const height = parseInt(ref.style.height);

    updateMemo(id, {
      width,
      height,
      x: position.x,
      y: position.y
    });
  };

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-50">
          {error}
        </div>
      )}
      
      {/* User Profile and Add Note Button Container */}
      <div className="absolute top-4 right-4 flex items-center gap-4 z-10">
        {/* Add Note Button */}
        <button
          onClick={addNewMemo}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg transition-all duration-200"
        >
          <FaStickyNote className="text-lg" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Memo</h3>
              <button
                onClick={hideDeleteConfirm}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this memo? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={hideDeleteConfirm}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMemo(deleteConfirm.memoId)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Memo Board */}
      <div 
        ref={boardRef}
        className="w-full h-full p-4"
      >
        {memos.map((memo) => (
          <Rnd
            key={memo._id}
            default={{
              x: memo.x,
              y: memo.y,
              width: memo.width,
              height: memo.height
            }}
            onDragStop={(e, d) => handleDragStop(memo._id, e, d)}
            onResizeStop={(e, direction, ref, delta, position) => 
              handleResizeStop(memo._id, e, direction, ref, delta, position)
            }
            bounds="parent"
            className="shadow-lg"
          >
            <div 
              className="w-full h-full p-4 rounded-lg relative flex flex-col"
              style={{ 
                backgroundColor: memo.color || COLORS[0]
              }}
            >
              {/* Top Controls */}
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => setEditingId(memo._id)}
                  className="text-gray-600 hover:text-blue-500 transition-colors p-1 rounded-full hover:bg-white/20"
                  title="Edit memo"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => showDeleteConfirm(memo._id)}
                  className="text-gray-600 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white/20"
                  title="Delete memo"
                >
                  <FaTrash />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1">
                {editingId === memo._id ? (
                  <textarea
                    value={memo.content}
                    onChange={(e) => updateMemo(memo._id, { content: e.target.value })}
                    onBlur={() => setEditingId(null)}
                    className="w-full h-full bg-transparent border-none outline-none resize-none"
                    autoFocus
                  />
                ) : (
                  <div className="w-full h-full">
                    {memo.content || 'Click edit to add content...'}
                  </div>
                )}
              </div>
            </div>
          </Rnd>
        ))}
      </div>
    </div>
  );
};

export default MemoBoard; 