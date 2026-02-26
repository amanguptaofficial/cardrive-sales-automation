import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent'
    },
    emoji: String
  }]
}, {
  timestamps: true
});

const chatMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastReadAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  name: {
    type: String,
    required: function() {
      return this.type === 'group';
    }
  },
  description: String,
  avatar: String,
  members: [chatMemberSchema],
  messages: [messageSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    muteNotifications: {
      type: Boolean,
      default: false
    },
    autoAddNewLeads: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

chatSchema.index({ 'members.user': 1 });
chatSchema.index({ type: 1, createdAt: -1 });
chatSchema.index({ createdAt: -1 });

export default mongoose.model('Chat', chatSchema);
