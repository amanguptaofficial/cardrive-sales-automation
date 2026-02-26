import mongoose from 'mongoose';
import {
  LeadSource,
  LeadStatus,
  LeadTier,
  FuelType,
  MessageDirection,
  MessageChannel,
  MessageStatus,
  PreferredContact,
  Sentiment
} from '../enums/index.js';

const scoreHistorySchema = new mongoose.Schema({
  score: { type: Number, required: true },
  tier: { type: String, enum: Object.values(LeadTier), required: true },
  reason: { type: String, required: true },
  scoredAt: { type: Date, default: Date.now }
}, { _id: false });

const interestSchema = new mongoose.Schema({
  make: String,
  model: String,
  variant: String,
  fuelType: { 
    type: String, 
    default: null,
    required: false,
    validate: {
      validator: function(v) {
        if (!v || v === '' || v === null || v === undefined) return true;
        return Object.values(FuelType).includes(v);
      },
      message: 'Invalid fuel type. Must be one of: ' + Object.values(FuelType).join(', ')
    }
  },
  bodyType: String,
  budget: {
    min: Number,
    max: Number
  },
  isNew: { type: Boolean, default: true },
  financeRequired: Boolean
}, { _id: false });

const locationSchema = new mongoose.Schema({
  city: String,
  area: String,
  pincode: String
}, { _id: false });

const messageSchema = new mongoose.Schema({
  direction: { type: String, enum: Object.values(MessageDirection), required: true },
  channel: { type: String, enum: Object.values(MessageChannel), required: true },
  content: { type: String, required: true },
  isAI: { type: Boolean, default: false },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: Object.values(MessageStatus), default: MessageStatus.DRAFT }
}, { _id: true }); // Enable _id for messages so they can be referenced by ID

const dripSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  sequence: String,
  step: { type: Number, default: 0 },
  nextAt: Date
}, { _id: false });

const testDriveSchema = new mongoose.Schema({
  scheduled: { type: Boolean, default: false },
  date: Date,
  carAssigned: String
}, { _id: false });

const noteSchema = new mongoose.Schema({
  text: String,
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, lowercase: true },
  phone: { type: String, required: true },
  source: {
    type: String,
    enum: Object.values(LeadSource),
    required: true
  },
  sourceLeadId: String,
  interest: interestSchema,
  firstMessage: String,
  preferredContact: { type: String, enum: Object.values(PreferredContact) },
  location: locationSchema,
  score: { type: Number, min: 0, max: 100, default: null },
  tier: { type: String, enum: Object.values(LeadTier), default: null },
  scoreHistory: [scoreHistorySchema],
  aiSignals: [String],
  sentiment: { type: String, enum: Object.values(Sentiment) },
  status: {
    type: String,
    enum: Object.values(LeadStatus),
    default: LeadStatus.NEW
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  messages: [messageSchema],
  drip: dripSchema,
  testDrive: testDriveSchema,
  isDuplicate: { type: Boolean, default: false },
  tags: [String],
  notes: [noteSchema],
  lastActivity: { type: Date, default: Date.now }
}, {
  timestamps: true
});

leadSchema.pre('save', function(next) {
  if (this.interest) {
    if (this.interest.fuelType === '') {
      this.interest.fuelType = null;
    }
    if (this.interest.make === '') this.interest.make = null;
    if (this.interest.model === '') this.interest.model = null;
    if (this.interest.variant === '') this.interest.variant = null;
    if (this.interest.bodyType === '') this.interest.bodyType = null;
  }
  if (this.location) {
    if (this.location.city === '') this.location.city = null;
    if (this.location.area === '') this.location.area = null;
    if (this.location.pincode === '') this.location.pincode = null;
  }
  if (this.email === '') this.email = null;
  if (this.firstMessage === '') this.firstMessage = null;
  next();
});

leadSchema.index({ email: 1, createdAt: -1 });
leadSchema.index({ phone: 1, createdAt: -1 });
leadSchema.index({ score: -1 });
leadSchema.index({ tier: 1, status: 1 });
leadSchema.index({ assignedTo: 1 });

export default mongoose.model('Lead', leadSchema);
