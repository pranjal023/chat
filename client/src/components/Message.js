import React from 'react';
import './Message.css';

const Message = ({ message, isOwn, showAvatar }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`message ${isOwn ? 'own' : ''}`}>
      {showAvatar && (
        <div className="message-avatar">
          {message.sender.username.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="message-content">
        {showAvatar && !isOwn && (
          <div className="message-header">
            <span className="message-username">{message.sender.username}</span>
            <span className="message-time">{formatTime(message.timestamp)}</span>
          </div>
        )}

        <div className="message-bubble">
          <p className="message-text">{message.content}</p>
          {isOwn && (
            <span className="message-time own-time">
              {formatTime(message.timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;