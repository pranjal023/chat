import React from 'react';
import './ConversationList.css';

const ConversationList = ({ conversations = [], selectedConversation, onConversationSelect, currentUser }) => {

  const safeConversations = conversations || [];

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation || !conversation.participants || !currentUser) return null;
    return conversation.participants.find(p => p._id !== currentUser.id);
  };

  const getUnreadCount = (conversation) => {
    if (!conversation || !conversation.unreadCount || !currentUser) return 0;
    const userUnread = conversation.unreadCount.find(u => u.user === currentUser.id);
    return userUnread ? userUnread.count : 0;
  };

  return (
    <div className="conversation-list">
      <div className="sidebar-section">
        <h3>Private Messages</h3>
        <div className="conversations">
          {safeConversations.length === 0 ? (
            <div className="no-conversations">
              <p>No conversations yet</p>
              <small>Click on an online user to start messaging</small>
            </div>
          ) : (
            safeConversations.map(conversation => {
              if (!conversation) return null;

              const otherUser = getOtherParticipant(conversation);
              const unreadCount = getUnreadCount(conversation);
              const isSelected = selectedConversation && selectedConversation._id === conversation._id;

              return (
                <div
                  key={conversation._id}
                  className={`conversation-item ${isSelected ? 'active' : ''}`}
                  onClick={() => onConversationSelect && onConversationSelect(conversation)}
                >
                  <div className="conversation-avatar">
                    <div className={`user-avatar ${otherUser?.isOnline ? 'online' : ''}`}>
                      {otherUser?.username ? otherUser.username.charAt(0).toUpperCase() : '?'}
                    </div>
                    {otherUser?.isOnline && <div className="online-indicator"></div>}
                  </div>

                  <div className="conversation-content">
                    <div className="conversation-header">
                      <span className="conversation-name">
                        {otherUser?.username || 'Unknown User'}
                      </span>
                      {conversation.lastMessage && (
                        <span className="conversation-time">
                          {formatTime(conversation.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>

                    <div className="conversation-preview">
                      {conversation.lastMessage ? (
                        <span className={`last-message ${unreadCount > 0 ? 'unread' : ''}`}>
                          {conversation.lastMessage.sender === currentUser.id ? 'You: ' : ''}
                          {conversation.lastMessage.content && conversation.lastMessage.content.length > 40 
                            ? conversation.lastMessage.content.substring(0, 40) + '...'
                            : conversation.lastMessage.content || 'Message'
                          }
                        </span>
                      ) : (
                        <span className="no-messages">Start a conversation</span>
                      )}

                      {unreadCount > 0 && (
                        <span className="unread-badge">{unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationList;