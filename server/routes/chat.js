const express = require('express');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Room = require('../models/Room');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();


router.get('/messages/:room', authenticate, async (req, res) => {
  try {
    const { room } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ 
      room, 
      messageType: 'room' 
    })
      .populate('sender', 'username avatar')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    res.json({
      messages: messages.reverse(),
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/conversations', authenticate, async (req, res) => {
  try {
    const { participantId } = req.body;

    if (participantId === req.userId.toString()) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, participantId] }
    }).populate('participants', 'username isOnline lastSeen');

    if (!conversation) {
     
      conversation = new Conversation({
        participants: [req.userId, participantId],
        conversationType: 'private',
        unreadCount: [
          { user: req.userId, count: 0 },
          { user: participantId, count: 0 }
        ]
      });

      await conversation.save();
      await conversation.populate('participants', 'username isOnline lastSeen');
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/conversations', authenticate, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId
    })
    .populate('participants', 'username isOnline lastSeen')
    .populate('lastMessage.sender', 'username')
    .sort({ 'lastMessage.timestamp': -1 });

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({
      conversationId,
      messageType: 'private'
    })
      .populate('sender', 'username avatar')
      .populate('recipient', 'username')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    
    await Message.updateMany(
      {
        conversationId,
        recipient: req.userId,
        'readBy.user': { $ne: req.userId }
      },
      {
        $push: {
          readBy: {
            user: req.userId,
            readAt: new Date()
          }
        }
      }
    );

    
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: {
        'unreadCount.$[elem].count': 0
      }
    }, {
      arrayFilters: [{ 'elem.user': req.userId }]
    });

    res.json({
      messages: messages.reverse(),
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Get private messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/rooms', authenticate, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { isPrivate: false },
        { participants: req.userId }
      ]
    }).populate('admin', 'username');

    res.json({ rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



router.post('/conversations', authenticate, async (req, res) => {
  try {
    const { participantId } = req.body;

    console.log('📞 Creating conversation between:', req.userId, 'and', participantId);

    if (participantId === req.userId.toString()) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

   
    let conversation;

    try {
      const Conversation = require('../models/Conversation');
      conversation = await Conversation.findOne({
        participants: { $all: [req.userId, participantId] }
      }).populate('participants', 'username isOnline lastSeen');
    } catch (modelError) {
      console.log('Conversation model not found, creating simple conversation');
    }

    if (!conversation) {
      
      const User = require('../models/User');
      const currentUser = await User.findById(req.userId).select('username');
      const otherUser = await User.findById(participantId).select('username isOnline lastSeen');

      if (!otherUser) {
        return res.status(404).json({ error: 'User not found' });
      }

     
      conversation = {
        _id: `chat_${req.userId}_${participantId}`,
        participants: [
          {
            _id: req.userId,
            username: currentUser.username,
            isOnline: true
          },
          {
            _id: participantId,
            username: otherUser.username,
            isOnline: otherUser.isOnline || false
          }
        ],
        lastMessage: null,
        unreadCount: []
      };

      console.log('✅ Simple conversation created:', conversation._id);
    }

    res.json({ conversation });
  } catch (error) {
    console.error('❌ Create conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/conversations', authenticate, async (req, res) => {
  try {
    
    console.log('📋 Getting conversations for user:', req.userId);

    try {
      const Conversation = require('../models/Conversation');
      const conversations = await Conversation.find({
        participants: req.userId
      })
      .populate('participants', 'username isOnline lastSeen')
      .populate('lastMessage.sender', 'username')
      .sort({ 'lastMessage.timestamp': -1 });

      res.json({ conversations });
    } catch (modelError) {
      console.log('Conversation model not found, returning empty list');
      res.json({ conversations: [] });
    }
  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/conversations/:conversationId/messages', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log('💬 Getting messages for conversation:', conversationId);

    try {
      const Message = require('../models/Message');

      const messages = await Message.find({
        conversationId,
        messageType: 'private'
      })
        .populate('sender', 'username avatar')
        .populate('recipient', 'username')
        .sort({ timestamp: 1 });

      console.log(`📨 Found ${messages.length} messages for conversation:`, conversationId);

      res.json({
        messages: messages || [],
        hasMore: false
      });
    } catch (modelError) {
      console.log('Message model not fully configured, returning empty messages');
      res.json({ messages: [], hasMore: false });
    }
  } catch (error) {
    console.error('❌ Get conversation messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/users/online', authenticate, async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find({ 
      isOnline: true,
      _id: { $ne: req.userId } 
    })
      .select('username email isOnline lastSeen')
      .limit(20);

    console.log(`👥 Found ${users.length} online users`);

    res.json({ users });
  } catch (error) {
    console.error('❌ Get online users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/rooms', authenticate, async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    const room = new Room({
      name,
      description,
      admin: req.userId,
      participants: [req.userId],
      isPrivate: !!isPrivate
    });

    await room.save();
    await room.populate('admin', 'username');

    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/users/online', authenticate, async (req, res) => {
  try {
    const users = await User.find({ 
      isOnline: true,
      _id: { $ne: req.userId }
    })
      .select('username avatar isOnline')
      .limit(20);

    res.json({ users });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;