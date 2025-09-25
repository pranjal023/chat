import React, { useRef, useEffect } from 'react';
import MessageInput from './MessageInput';
import './PrivateChat.css';

const PrivateChat = ({ 
  conversation, 
  messages = [], 
  currentUser, 
  typingUsers = [], 
  onSendMessage,
  socket 
}) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherParticipant = () => {
    if (!conversation || !conversation.participants || !currentUser) return null;
    return conversation.participants.find(p => p._id !== currentUser.id);
  };

  const otherUser = getOtherParticipant();

  return (
    <div className="private-chat">
      <div className="private-chat-header">
        <div className="participant-info">
          <div className={`user-avatar ${otherUser?.isOnline ? 'online' : ''}`}>
            {otherUser?.username ? otherUser.username.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="participant-details">
            <span className="participant-name">{otherUser?.username || 'Unknown User'}</span>
            <span className="participant-status">
              {otherUser?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="private-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <div className="welcome-message">
              <h3>Start your conversation with {otherUser?.username || 'this user'}</h3>
              <p>Send a message to begin chatting privately</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender?._id === currentUser?.id;
            const showAvatar = index === 0 || messages[index - 1].sender?._id !== message.sender?._id;

            return (
              <div 
                key={message._id || index} 
                className={`message-container ${isOwnMessage ? 'own-message' : 'other-message'}`}
              >
                
                {!isOwnMessage && showAvatar && (
                  <div className="message-avatar">
                    <div className="avatar">
                      {otherUser?.username ? otherUser.username.charAt(0).toUpperCase() : '?'}
                    </div>
                  </div>
                )}

                
                <div className={`message-bubble ${isOwnMessage ? 'sent' : 'received'}`}>
                  <div className="message-content">{message.content}</div>
                  <div className="message-meta">
                    <span className="message-time">
                      {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : ''}
                    </span>
                    
                    {isOwnMessage && (
                      <span className="message-status">
                        ✓✓ 
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        
        {typingUsers.length > 0 && (
          <div className="typing-container">
            <div className="typing-avatar">
              <div className="avatar">
                {otherUser?.username ? otherUser.username.charAt(0).toUpperCase() : '?'}
              </div>
            </div>
            <div className="typing-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

<MessageInput 
  onSendMessage={onSendMessage}
  conversationId={conversation?._id}
  currentView="private"
  socket={socket}
  user={currentUser}
  placeholder={`Message ${otherUser?.username || 'user'}`} 
/>

    </div>
  );
};

export default PrivateChat;