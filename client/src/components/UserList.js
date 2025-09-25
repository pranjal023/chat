import React from 'react';
import './UserList.css';

const UserList = ({ 
  onlineUsers, 
  currentRoom, 
  onRoomChange, 
  currentView,
  onStartPrivateChat  
}) => {
  const rooms = [
    { id: 'general', name: 'General', description: 'General discussion' },
    { id: 'random', name: 'Random', description: 'Random topics' },
    { id: 'tech', name: 'Tech Talk', description: 'Technology discussions' }
  ];

  const handleUserClick = (user) => {
    
    if (onStartPrivateChat) {
      onStartPrivateChat(user);
    }
  };

  return (
    <div className="user-list">
      
      <div className="sidebar-section">
        <h3>Rooms</h3>
        <div className="rooms-list">
          {rooms.map(room => (
            <div
              key={room.id}
              className={`room-item ${currentRoom === room.id && currentView === 'rooms' ? 'active' : ''}`}
              onClick={() => onRoomChange(room.id)}
            >
              <span className="room-name">#{room.name}</span>
              <span className="room-description">{room.description}</span>
            </div>
          ))}
        </div>
      </div>

      
      <div className="sidebar-section">
        <h3>Online ({onlineUsers.length})</h3>
        {onlineUsers.length === 0 ? (
          <div className="no-users">
            <p>No users online</p>
          </div>
        ) : (
          <div className="online-users">
            {onlineUsers.map(user => (
              <div 
                key={user._id} 
                className="user-item clickable"
                onClick={() => handleUserClick(user)}
                title={`Click to message ${user.username}`}
              >
                <div className="user-avatar online">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <span className="user-name">{user.username}</span>
                  <span className="user-status">Online • Click to message</span>
                </div>
                <div className="message-icon">💬</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;