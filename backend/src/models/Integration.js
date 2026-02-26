import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  source: {
    type: String,
    required: true,
    unique: true,
    enum: ['website', 'cardekho', 'carwale', 'facebook', 'google', 'instagram', 'other']
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'pending'],
    default: 'disconnected'
  },
  webhookUrl: {
    type: String,
    required: true
  },
  webhookSecret: {
    type: String,
    default: null
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lastSyncAt: {
    type: Date,
    default: null
  },
  stats: {
    totalLeads: {
      type: Number,
      default: 0
    },
    leadsToday: {
      type: Number,
      default: 0
    },
    leadsThisWeek: {
      type: Number,
      default: 0
    },
    leadsThisMonth: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'Link2'
  }
}, {
  timestamps: true
});

integrationSchema.index({ source: 1 });
integrationSchema.index({ status: 1 });

export default mongoose.model('Integration', integrationSchema);
