# Real-Time Chat Application

A full-stack MERN (MongoDB, Express.js, React, Node.js) chat application with real-time messaging using Socket.io.

## Features

- **Real-time messaging** with Socket.io
- **User authentication** (register/login)
- **Multiple chat rooms**
- **Online user status**
- **Typing indicators**
- **Message history**
- **Responsive design** with plain CSS
- **MongoDB** for data persistence

## Tech Stack

### Backend
- Node.js
- Express.js
- Socket.io
- MongoDB with Mongoose
- JWT authentication
- bcryptjs for password hashing

### Frontend
- React 18
- Socket.io Client
- Axios for HTTP requests
- React Router for navigation
- Plain CSS (no external UI libraries)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory:
```env
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

4. Start the server:
```bash
npm run dev
```

The server will run on http://localhost:5000

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The client will run on http://localhost:3000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Register a new account or login with existing credentials
3. Start chatting in real-time!
4. Switch between different rooms using the sidebar
5. See who's online and typing indicators

## Project Structure

```
chat-app/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Message.js
│   │   └── Room.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── chat.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── package.json
│   └── .env
└── client/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── ChatHeader.js
    │   │   ├── MessageList.js
    │   │   ├── Message.js
    │   │   ├── MessageInput.js
    │   │   └── UserList.js
    │   ├── context/
    │   │   ├── AuthContext.js
    │   │   └── SocketContext.js
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   └── Chat.js
    │   ├── App.js
    │   ├── index.js
    │   └── *.css files
    └── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Chat
- `GET /api/chat/messages/:room` - Get messages for a room
- `GET /api/chat/rooms` - Get available rooms
- `POST /api/chat/rooms` - Create new room
- `GET /api/chat/users/online` - Get online users

## Socket Events

### Client to Server
- `join_room` - Join a chat room
- `send_message` - Send a message
- `typing` - Send typing indicator

### Server to Client
- `receive_message` - Receive new message
- `user_typing` - User typing indicator

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Deployment

### Backend Deployment
- Deploy to Heroku, Railway, or DigitalOcean
- Set environment variables in your hosting platform
- Update CORS origins for production

### Frontend Deployment
- Build the React app: `npm run build`
- Deploy to Netlify, Vercel, or serve from Express server
- Update API URLs for production

## Troubleshooting

1. **MongoDB Connection Issues**: Make sure MongoDB is running and the connection string is correct
2. **CORS Errors**: Update CORS settings in server.js for your frontend URL
3. **Socket Connection Issues**: Check that both client and server are using the same Socket.io versions
4. **Authentication Issues**: Verify JWT secret is set correctly in environment variables

## Future Enhancements

- File sharing and image uploads
- Private messaging
- User profiles and avatars
- Message reactions and emojis
- Push notifications
- Dark/light theme toggle
- Message search functionality
- User roles and permissions