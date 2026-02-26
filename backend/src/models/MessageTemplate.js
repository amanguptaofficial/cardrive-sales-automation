import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['greeting', 'follow_up', 'quote', 'test_drive', 'closing', 'objection_handling', 'other'],
    default: 'other'
  },
  content: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['whatsapp', 'email', 'sms', 'all'],
    default: 'all'
  },
  variables: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  usageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

templateSchema.index({ createdBy: 1, category: 1 });
templateSchema.index({ isPublic: 1, isActive: 1 });

export default mongoose.model('MessageTemplate', templateSchema);
