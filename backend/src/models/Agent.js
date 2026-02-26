import mongoose from 'mongoose';
import { AgentRole } from '../enums/index.js';

const statsSchema = new mongoose.Schema({
  totalLeads: { type: Number, default: 0 },
  responded: { type: Number, default: 0 },
  qualified: { type: Number, default: 0 },
  closed: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 }
}, { _id: false });

const notificationPreferencesSchema = new mongoose.Schema({
  newLeadAlerts: { type: Boolean, default: true },
  hotLeadNotifications: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: false },
  chatNotifications: { type: Boolean, default: true },
  mentionNotifications: { type: Boolean, default: true }
}, { _id: false });

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true },
  phone: String,
  role: {
    type: String,
    enum: Object.values(AgentRole),
    default: AgentRole.AGENT
  },
  isAvailable: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String },
  stats: statsSchema,
  notificationPreferences: {
    type: notificationPreferencesSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

agentSchema.index({ email: 1 });
agentSchema.index({ role: 1 });

export default mongoose.model('Agent', agentSchema);
