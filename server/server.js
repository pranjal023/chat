const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://vconnectapp.netlify.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// FIXED: Use an array for allowed origins!
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://vconnectapp.netlify.app"
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp';
    console.log('Connecting to MongoDB...');

    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', async (data) => {
    try {
      const { userId } = data;
      if (!userId) {
        console.error('Authentication failed: userId is undefined');
        return;
      }
      socket.userId = userId;
      const User = require('./models/User');
      await User.findByIdAndUpdate(userId, { 
        socketId: socket.id,
        isOnline: true
      });
      console.log(`✅ User ${userId} authenticated with socket ${socket.id}`);
    } catch (error) {
      console.error('Authentication error:', error);
    }
  });

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('send_message', async (messageData) => {
    try {
      if (!socket.userId) {
        console.error('Message rejected: User not authenticated');
        socket.emit('message_error', { error: 'User not authenticated' });
        return;
      }
      const Message = require('./models/Message');
      const newMessage = new Message({
        content: messageData.content,
        sender: socket.userId, // Use authenticated userId
        room: messageData.room,
        messageType: 'room',
        timestamp: new Date()
      });
      await newMessage.save();
      await newMessage.populate('sender', 'username');
      io.to(messageData.room).emit('receive_message', {
        _id: newMessage._id,
        content: newMessage.content,
        sender: newMessage.sender,
        timestamp: newMessage.timestamp,
        messageType: 'room'
      });
      console.log(`✅ Message saved from user ${socket.userId} in room ${messageData.room}`);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('send_private_message', async (messageData) => {
    try {
      const { conversationId, content, recipientId } = messageData;
      const Message = require('./models/Message');
      const Conversation = require('./models/Conversation');
      const User = require('./models/User');
      const newMessage = new Message({
        content,
        sender: socket.userId,
        recipient: recipientId,
        messageType: 'private',
        conversationId,
        readBy: [{ user: socket.userId }]
      });
      await newMessage.save();
      await newMessage.populate('sender', 'username avatar');
      await newMessage.populate('recipient', 'username');
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
          content,
          sender: socket.userId,
          timestamp: new Date()
        },
        $inc: {
          'unreadCount.$[elem].count': 1
        }
      }, {
        arrayFilters: [{ 'elem.user': recipientId }]
      });
      io.to(`conversation_${conversationId}`).emit('receive_private_message', {
        _id: newMessage._id,
        content: newMessage.content,
        sender: newMessage.sender,
        recipient: newMessage.recipient,
        timestamp: newMessage.timestamp,
        conversationId,
        messageType: 'private'
      });
      const recipient = await User.findById(recipientId);
      if (recipient && recipient.socketId && recipient.isOnline) {
        io.to(recipient.socketId).emit('new_private_message_notification', {
          from: newMessage.sender,
          conversationId,
          content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        });
      }
    } catch (error) {
      console.error('Error sending private message:', error);
      socket.emit('message_error', { error: 'Failed to send private message' });
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.room).emit('user_typing', {
      username: data.username,
      isTyping: data.isTyping
    });
  });

  socket.on('private_typing', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_private_typing', {
      username: data.username,
      conversationId: data.conversationId,
      isTyping: data.isTyping
    });
  });

  socket.on('mark_as_read', async (data) => {
    try {
      const { conversationId } = data;
      const Message = require('./models/Message');
      const Conversation = require('./models/Conversation');
      await Message.updateMany(
        {
          conversationId,
          recipient: socket.userId,
          'readBy.user': { $ne: socket.userId }
        },
        {
          $push: {
            readBy: {
              user: socket.userId,
              readAt: new Date()
            }
          }
        }
      );
      await Conversation.findByIdAndUpdate(conversationId, {
        $set: {
          'unreadCount.$[elem].count': 0
        }
      }, {
        arrayFilters: [{ 'elem.user': socket.userId }]
      });
      socket.to(`conversation_${conversationId}`).emit('messages_read', {
        conversationId,
        readBy: socket.userId
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    try {
      if (socket.userId) {
        const User = require('./models/User');
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
          socketId: null
        });
      }
    } catch (error) {
      console.error('Error updating user offline status:', error);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready with private messaging`);
  console.log(`🌐 API available at http://localhost:${PORT}/api`);
});
