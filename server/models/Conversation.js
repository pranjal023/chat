const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  conversationType: {
    type: String,
    enum: ['private'],
    default: 'private'
  },
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  unreadCount: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});


conversationSchema.pre('save', function(next) {
  if (this.conversationType === 'private' && this.participants.length !== 2) {
    const error = new Error('Private conversations must have exactly 2 participants');
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);