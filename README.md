# MERN Todo List Application

A full-stack Todo List application built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

- Create, read, update, and delete todos
- Mark todos as complete/incomplete
- Clean and modern UI
- Real-time updates
- Responsive design

## Project Structure

```
todo-app/
├── client/          # React frontend
├── server/          # Node.js backend
└── README.md
```

## Setup Instructions

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file and add your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   ```
4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Technologies Used

- Frontend:
  - React.js
  - Axios
  - Tailwind CSS
  - React Icons

- Backend:
  - Node.js
  - Express.js
  - MongoDB
  - Mongoose
  - Cors
  - Dotenv 