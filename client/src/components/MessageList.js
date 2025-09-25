import React from 'react';
import Message from './Message';
import './MessageList.css';

const MessageList = ({ messages, currentUser, typingUsers }) => {
  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="no-messages">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <Message
            key={message._id}
            message={message}
            isOwn={message.sender._id === currentUser?.id}
            showAvatar={
              index === 0 || 
              messages[index - 1].sender._id !== message.sender._id
            }
          />
        ))
      )}

      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          <div className="typing-message">
            <div className="typing-avatar">💬</div>
            <div className="typing-content">
              <span className="typing-text">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </span>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;