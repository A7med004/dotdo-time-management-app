import React from 'react';
import { useNavigate } from 'react-router-dom';

const Developers = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-cal">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full flex flex-col items-center relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 font-medium"
        >
          &larr; Back
        </button>
        <h1 className="text-3xl font-bold text-blue-700 mb-4 mt-2">Developers</h1>
        <ul className="text-lg text-gray-800 space-y-2 w-full">
          <li className="transition-transform duration-200 hover:scale-110 cursor-pointer">Ahmed Osama Munir</li>
          <li className="transition-transform duration-200 hover:scale-110 cursor-pointer">Ahmed Ibrahim Elshenawy</li>
          <li className="transition-transform duration-200 hover:scale-110 cursor-pointer">Ahmed Abo Hussien Selim</li>
          <li className="transition-transform duration-200 hover:scale-110 cursor-pointer">Abdulrahman Elsayed Fathallah</li>
          <li className="transition-transform duration-200 hover:scale-110 cursor-pointer">Malek Sobhy Mesbah</li>
          <li className="transition-transform duration-200 hover:scale-110 cursor-pointer">Mohammed Yasser Abdulhamid</li>
          <li className="transition-transform duration-200 hover:scale-110 cursor-pointer">Abdulrahman Mohammed Shaheen</li>
        </ul>
      </div>
    </div>
  );
};

export default Developers; 