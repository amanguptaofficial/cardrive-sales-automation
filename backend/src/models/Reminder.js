import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  reminderDate: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['follow_up', 'call', 'meeting', 'test_drive', 'quote', 'other'],
    default: 'follow_up'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'snoozed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  snoozedUntil: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

reminderSchema.index({ agentId: 1, reminderDate: 1 });
reminderSchema.index({ leadId: 1 });
reminderSchema.index({ status: 1, reminderDate: 1 });

export default mongoose.model('Reminder', reminderSchema);
