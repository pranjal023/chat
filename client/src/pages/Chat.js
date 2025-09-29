import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import UserList from '../components/UserList';
import ConversationList from '../components/ConversationList';
import PrivateChat from '../components/PrivateChat';
import './Chat.css';
import axios from 'axios';

const Chat = () => {
  // ✅ ADD THIS LINE - Environment variable for API URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const [messages, setMessages] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [currentView, setCurrentView] = useState('rooms');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [privateTypingUsers, setPrivateTypingUsers] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, logout } = useAuth();
  const { socket, joinRoom, sendMessage, sendPrivateMessage } = useSocket();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (socket && user) {
      socket.on('receive_message', (message) => {
        if (currentView === 'rooms') {
          setMessages(prev => [...prev, message]);
        }
      });

      socket.on('receive_private_message', (message) => {
        if (currentView === 'private' && selectedConversation && message.conversationId === selectedConversation._id) {
          setMessages(prev => [...prev, message]);
        }
        loadConversations();
      });

      socket.on('user_typing', (data) => {
        if (data.isTyping) {
          setTypingUsers(prev => {
            if (!prev.includes(data.username)) {
              return [...prev, data.username];
            }
            return prev;
          });
        } else {
          setTypingUsers(prev => prev.filter(user => user !== data.username));
        }
      });

      socket.on('user_private_typing', (data) => {
        if (currentView === 'private' && selectedConversation && data.conversationId === selectedConversation._id) {
          setPrivateTypingUsers(prev => ({
            ...prev,
            [data.conversationId]: data.isTyping ? [data.username] : []
          }));
        }
      });

      return () => {
        socket.off('receive_message');
        socket.off('receive_private_message');
        socket.off('user_typing');
        socket.off('user_private_typing');
      };
    }
  }, [socket, user, currentView, selectedConversation]);

  useEffect(() => {
    if (currentView === 'rooms') {
      loadMessages();
    } else if (currentView === 'private' && selectedConversation) {
      loadPrivateMessages();
    }
    loadOnlineUsers();
  }, [currentRoom, currentView, selectedConversation]);

  useEffect(() => {
    if (currentView === 'private') {
      loadConversations();
    }
  }, [currentView]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ FIXED - Using environment variable
  const loadMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/chat/messages/${currentRoom}`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED - Using environment variable
  const loadPrivateMessages = async () => {
    if (!selectedConversation) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/chat/conversations/${selectedConversation._id}/messages`
      );
      setMessages(response.data.messages || []);

      if (socket) {
        socket.emit('mark_as_read', {
          conversationId: selectedConversation._id
        });
      }
    } catch (error) {
      console.error('Error loading private messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED - Using environment variable
  const loadConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/chat/conversations`);
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // ✅ FIXED - Using environment variable
  const loadOnlineUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/chat/users/online`);
      setOnlineUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading online users:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ FIXED - Using environment variable
  const handleStartPrivateChat = async (selectedUser) => {
    try {
      console.log('🚀 Starting private chat with:', selectedUser.username);
      
      const response = await axios.post(`${API_URL}/chat/conversations`, {
        participantId: selectedUser._id
      });

      setCurrentView('private');
      setSelectedConversation(response.data.conversation);
      setMessages([]);
      setLoading(true);
      setSidebarOpen(false);

      if (socket) {
        socket.emit('join_conversation', response.data.conversation._id);
      }

      console.log('✅ Private chat started with:', selectedUser.username);
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      
      const conversation = {
        _id: `chat_${user.id}_${selectedUser._id}`,
        participants: [
          { _id: user.id, username: user.username },
          { _id: selectedUser._id, username: selectedUser.username }
        ]
      };

      setCurrentView('private');
      setSelectedConversation(conversation);
      setMessages([]);
      setSidebarOpen(false);
      console.log('✅ Local conversation created with:', selectedUser.username);
    }
  };

  const handleSendMessage = (content) => {
    if (content.trim() && socket && user) {
      if (currentView === 'rooms') {
        const messageData = {
          content: content.trim(),
          sender: user.id,
          room: currentRoom
        };
        sendMessage(messageData);
      } else if (currentView === 'private' && selectedConversation) {
        const recipient = selectedConversation.participants.find(p => p._id !== user.id);
        const messageData = {
          conversationId: selectedConversation._id,
          content: content.trim(),
          recipientId: recipient._id
        };
        sendPrivateMessage(messageData);
      }
    }
  };

  const handleRoomChange = (roomId) => {
    setCurrentRoom(roomId);
    setCurrentView('rooms');
    setSelectedConversation(null);
    joinRoom(roomId);
    setMessages([]);
    setLoading(true);
    setSidebarOpen(false);
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setCurrentView('private');
    setMessages([]);
    setLoading(true);
    setSidebarOpen(false);

    if (socket) {
      socket.emit('join_conversation', conversation._id);
    }
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    setMessages([]);
    if (view === 'rooms') {
      setSelectedConversation(null);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const currentTypingUsers = currentView === 'private' && selectedConversation
    ? privateTypingUsers[selectedConversation._id] || []
    : typingUsers;

  if (loading && messages.length === 0) {
    return (
      <div className="chat-loading">
        <div className="loading-spinner"></div>
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <ChatHeader 
        currentRoom={currentView === 'rooms' ? currentRoom : 
          (selectedConversation ? 
            selectedConversation.participants.find(p => p._id !== user.id)?.username : 
            'Private Chat')}
        currentView={currentView}
        onToggleSidebar={toggleSidebar}
        onLogout={logout}
        onViewChange={handleViewChange}
        user={user}
      />
      
      <div className="chat-main">
        <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
          {currentView === 'rooms' ? (
            <UserList 
              onlineUsers={onlineUsers}
              currentRoom={currentRoom}
              onRoomChange={handleRoomChange}
              onStartPrivateChat={handleStartPrivateChat}
              currentView={currentView}
            />
          ) : (
            <ConversationList 
              conversations={conversations}
              onlineUsers={onlineUsers}
              onConversationSelect={handleConversationSelect}
              onStartPrivateChat={handleStartPrivateChat}
              selectedConversation={selectedConversation}
            />
          )}
        </div>

        <div className="chat-content">
          {currentView === 'private' && selectedConversation ? (
            <PrivateChat 
              conversation={selectedConversation}
              messages={messages}
              onSendMessage={handleSendMessage}
              currentUser={user}
              typingUsers={currentTypingUsers}
            />
          ) : (
            <>
              <MessageList 
                messages={messages}
                user={user}
                typingUsers={currentTypingUsers}
              />
              <div ref={messagesEndRef} />
              <MessageInput 
                onSendMessage={handleSendMessage}
                currentRoom={currentRoom}
                currentView={currentView}
                socket={socket}
                user={user}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
