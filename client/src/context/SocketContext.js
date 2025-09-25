import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');

      const newSocket = io('http://localhost:5000', {
        auth: { token }
      });
newSocket.on('connect', () => {
  console.log('Connected to server');
  
  console.log('Authenticating with userId:', user.id); 
  newSocket.emit('authenticate', { userId: user.id });
  newSocket.emit('join_room', 'general');
});


      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  
  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('join_room', roomId);
    }
  };

  
  const joinConversation = (conversationId) => {
    if (socket) {
      socket.emit('join_conversation', conversationId);
    }
  };

  
  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit('send_message', messageData);
    }
  };

  
  const sendPrivateMessage = (messageData) => {
    if (socket) {
      socket.emit('send_private_message', messageData);
    }
  };

  
  const sendTyping = (roomId, isTyping) => {
    if (socket && user) {
      socket.emit('typing', {
        room: roomId,
        username: user.username,
        isTyping
      });
    }
  };

  
  const sendPrivateTyping = (conversationId, isTyping) => {
    if (socket && user) {
      socket.emit('private_typing', {
        conversationId,
        username: user.username,
        isTyping
      });
    }
  };

  
  const markAsRead = (conversationId) => {
    if (socket) {
      socket.emit('mark_as_read', { conversationId });
    }
  };

  const value = {
    socket,
    onlineUsers,
    joinRoom,
    joinConversation, 
    sendMessage,
    sendPrivateMessage, 
    sendTyping,
    sendPrivateTyping, 
    markAsRead 
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};