import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserSearch.css';

const UserSearch = ({ onUserSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const loadContacts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/contacts');
      setContacts(response.data.contacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const searchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/auth/users/search?query=${searchQuery}`);
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (user) => {
    try {
      await axios.post('http://localhost:5000/api/auth/contacts', {
        userId: user._id
      });
      loadContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const isContact = (userId) => {
    return contacts.some(contact => contact.user._id === userId);
  };

  return (
    <div className="user-search-overlay">
      <div className="user-search-modal">
        <div className="search-header">
          <h3>Start New Conversation</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="search-input-container">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
        </div>

        <div className="search-results">
          
          {contacts.length > 0 && (
            <div className="results-section">
              <h4>Your Contacts</h4>
              {contacts.map(contact => (
                <div key={contact.user._id} className="user-result-item">
                  <div className={`user-avatar ${contact.user.isOnline ? 'online' : ''}`}>
                    {contact.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <span className="username">{contact.user.username}</span>
                    <span className="user-status">
                      {contact.user.isOnline ? 'Online' : 
                        `Last seen ${new Date(contact.user.lastSeen).toLocaleDateString()}`}
                    </span>
                  </div>
                  <button 
                    className="message-button"
                    onClick={() => onUserSelect(contact.user)}
                  >
                    Message
                  </button>
                </div>
              ))}
            </div>
          )}

          
          {searchQuery.length >= 2 && (
            <div className="results-section">
              <h4>Search Results</h4>
              {loading ? (
                <div className="loading">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="no-results">No users found</div>
              ) : (
                searchResults.map(user => (
                  <div key={user._id} className="user-result-item">
                    <div className={`user-avatar ${user.isOnline ? 'online' : ''}`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <span className="username">{user.username}</span>
                      <span className="user-email">{user.email}</span>
                      <span className="user-status">
                        {user.isOnline ? 'Online' : 
                          `Last seen ${new Date(user.lastSeen).toLocaleDateString()}`}
                      </span>
                    </div>
                    <div className="user-actions">
                      {!isContact(user._id) && (
                        <button 
                          className="add-contact-button"
                          onClick={() => addContact(user)}
                        >
                          Add Contact
                        </button>
                      )}
                      <button 
                        className="message-button"
                        onClick={() => onUserSelect(user)}
                      >
                        Message
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearch;