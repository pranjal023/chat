import React, { useState, useRef, useEffect } from 'react';
import './MessageInput.css';

const MessageInput = ({ 
  onSendMessage, 
  currentRoom, 
  currentView,
  socket,
  user,
  placeholder, 
  conversationId
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  
  const getPlaceholder = () => {
    if (placeholder) return placeholder; 

    if (currentView === 'private') {
      return 'Type a message...'; 
    } else if (currentRoom && currentRoom !== 'undefined') {
      return `Message #${currentRoom}`;
    } else {
      return 'Type a message...'; 
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && onSendMessage) {
      onSendMessage(message);
      setMessage('');
      handleTypingStop();
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleTyping = () => {
    if (!isTyping && socket && user) {
      setIsTyping(true);

      if (currentView === 'private' && conversationId) {
        
        socket.emit('private_typing', {
          conversationId,
          username: user.username,
          isTyping: true
        });
      } else if (currentView === 'rooms' && currentRoom) {
        
        socket.emit('typing', {
          room: currentRoom,
          username: user.username,
          isTyping: true
        });
      }
    }

    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 2000);
  };

  const handleTypingStop = () => {
    if (isTyping && socket && user) {
      setIsTyping(false);

      if (currentView === 'private' && conversationId) {
        
        socket.emit('private_typing', {
          conversationId,
          username: user.username,
          isTyping: false
        });
      } else if (currentView === 'rooms' && currentRoom) {
        
        socket.emit('typing', {
          room: currentRoom,
          username: user.username,
          isTyping: false
        });
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    
    if (inputRef.current) {
      inputRef.current.focus();
    }

    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-form">
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder={getPlaceholder()}
            className="message-input"
            maxLength={1000}
          />
          <button 
            type="submit" 
            className={`send-button ${message.trim() ? 'active' : ''}`}
            disabled={!message.trim()}
          >
            <span className="send-icon">➤</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;