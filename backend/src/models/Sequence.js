import mongoose from 'mongoose';

const messageStepSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  content: { type: String, required: true },
  subject: String
}, { _id: false });

const sequenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  isActive: { type: Boolean, default: true },
  targetTier: {
    type: String,
    enum: ['hot', 'warm', 'cold', 'all'],
    default: 'cold'
  },
  messages: [messageStepSchema],
  enrolledLeads: { type: Number, default: 0 }
}, {
  timestamps: true
});

sequenceSchema.index({ isActive: 1, targetTier: 1 });

export default mongoose.model('Sequence', sequenceSchema);
