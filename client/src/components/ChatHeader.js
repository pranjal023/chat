import React from 'react';
import './ChatHeader.css';

const ChatHeader = ({ 
  currentRoom, 
  currentView, 
  onToggleSidebar, 
  onLogout, 
  onViewChange, 
  user 
}) => {
  return (
    <header className="chat-header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          ☰
        </button>
        {}
        <div className="view-selector">
          <button 
            className={`view-button ${currentView === 'rooms' ? 'active' : ''}`}
            onClick={() => onViewChange('rooms')}
          >
            🏠 Rooms
          </button>
          <button 
            className={`view-button ${currentView === 'private' ? 'active' : ''}`}
            onClick={() => onViewChange('private')}
          >
            💬 Messages
          </button>
        </div>
        <h1 className="room-title">
          {currentView === 'rooms' ? `#${currentRoom}` : currentRoom}
        </h1>
      </div>

      

      <div className="header-right">
        <div className="user-info">
          <span className="username">{user?.username}</span>
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </div>
        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;