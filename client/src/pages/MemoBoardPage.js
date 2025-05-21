import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUser } from 'react-icons/fa';
import MemoBoard from '../components/MemoBoard';
import axios from 'axios';

const MemoBoardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    fetchUserProfile();
    // Update date and time every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { dateStr, timeStr };
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        return;
      }

      const response = await axios.get('http://localhost:5001/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const { dateStr, timeStr } = formatDateTime(currentDateTime);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <FaArrowLeft className="mr-2" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900 ml-4">Memo Board</h1>
            </div>

            {/* Date and Time Display */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <div className="text-gray-600 font-bold text-lg">{dateStr}</div>
              <div className="text-gray-600 font-bold text-lg">{timeStr}</div>
            </div>
            
            {/* User Profile Section */}
            {user && (
              <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  {user.profileImage ? (
                    <img 
                      src={`http://localhost:5001/${user.profileImage}`} 
                      alt={user.username} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                      onError={(e) => {
                        console.error('Error loading profile image:', e);
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      <FaUser className="text-gray-400 text-lg" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-gray-800 font-semibold">Welcome,</span>
                    <span className="text-gray-600">{user.username}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="h-[calc(100vh-4rem)]">
        <MemoBoard />
      </div>
    </div>
  );
};

export default MemoBoardPage; 