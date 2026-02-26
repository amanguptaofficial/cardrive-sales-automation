import Lead from '../models/Lead.js';
import RoutingRule from '../models/RoutingRule.js';
import { scoreQueue, escalationQueue } from '../queues/index.js';
import { evaluateRules } from '../services/routing.service.js';
import { processLeadScoring } from '../services/lead-processing.service.js';
import { getIO } from '../socket.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { LeadStatus } from '../enums/index.js';
import { notifyNewLead } from './chat.controller.js';

export const createLead = asyncHandler(async (req, res) => {
  const leadData = { ...req.body };
  
  if (leadData.interest) {
    if (leadData.interest.fuelType === '' || leadData.interest.fuelType === null || leadData.interest.fuelType === undefined) {
      leadData.interest.fuelType = null;
    }
    if (leadData.interest.make === '') leadData.interest.make = null;
    if (leadData.interest.model === '') leadData.interest.model = null;
    if (leadData.interest.variant === '') leadData.interest.variant = null;
    if (leadData.interest.bodyType === '') leadData.interest.bodyType = null;
    if (leadData.interest.budget) {
      if (leadData.interest.budget.min === '' || leadData.interest.budget.min === null) {
        leadData.interest.budget.min = null;
      }
      if (leadData.interest.budget.max === '' || leadData.interest.budget.max === null) {
        leadData.interest.budget.max = null;
      }
    }
  }
  
  if (leadData.location) {
    if (leadData.location.city === '') leadData.location.city = null;
    if (leadData.location.area === '') leadData.location.area = null;
    if (leadData.location.pincode === '') leadData.location.pincode = null;
  }
  
  if (leadData.email === '') leadData.email = null;
  if (leadData.firstMessage === '') leadData.firstMessage = null;
  
  const lead = await Lead.create(leadData);

  if (scoreQueue) {
    await scoreQueue.add('score-lead', { leadId: lead._id.toString() }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });
    logger.info(`Lead ${lead._id} queued for AI scoring`);
  } else {
    logger.warn('Score queue not available. Processing lead directly (without Redis).');
    processLeadScoring(lead._id.toString()).catch(err => {
      logger.error(`Error processing lead ${lead._id} directly:`, err);
    });
  }

  const io = getIO();
  if (io) {
    io.emit('lead:new', {
      id: lead._id.toString(),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      preferredContact: lead.preferredContact,
      interest: lead.interest,
      score: lead.score,
      tier: lead.tier,
      status: lead.status,
      createdAt: lead.createdAt
    });
  }

  notifyNewLead(lead._id.toString()).catch(err => {
    logger.error('Error notifying groups about new lead:', err);
  });

  res.status(201).json({
    success: true,
    data: lead
  });
});

export const getLeads = asyncHandler(async (req, res) => {
  const {
    tier,
    status,
    source,
    page = 1,
    limit = 20,
    search
  } = req.query;

  const query = {};

  if (tier) query.tier = tier;
  if (status) query.status = status;
  if (source) query.source = source;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const leads = await Lead.find(query)
    .populate('assignedTo', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Lead.countDocuments(query);

  res.json({
    success: true,
    data: leads,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

export const getAIInbox = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const allLeads = await Lead.find({
    'messages.isAI': true,
    'messages.status': 'draft'
  })
    .populate('assignedTo', 'name email role')
    .sort({ updatedAt: -1 })
    .limit(500);

  const leadsWithDraftAI = allLeads.filter(lead => {
    if (!lead.messages || lead.messages.length === 0) return false;
    return lead.messages.some(msg => 
      msg.isAI === true && (msg.status === 'draft' || msg.status === 'failed')
    );
  });

  const sortedLeads = leadsWithDraftAI.sort((a, b) => {
    const aLastDraft = a.messages
      .filter(m => m.isAI && (m.status === 'draft' || m.status === 'failed'))
      .sort((m1, m2) => new Date(m2.sentAt || m2.createdAt || 0) - new Date(m1.sentAt || m1.createdAt || 0))[0];
    const bLastDraft = b.messages
      .filter(m => m.isAI && (m.status === 'draft' || m.status === 'failed'))
      .sort((m1, m2) => new Date(m2.sentAt || m2.createdAt || 0) - new Date(m1.sentAt || m1.createdAt || 0))[0];
    
    const aDate = aLastDraft ? (aLastDraft.sentAt || aLastDraft.createdAt || a.updatedAt) : a.updatedAt;
    const bDate = bLastDraft ? (bLastDraft.sentAt || bLastDraft.createdAt || b.updatedAt) : b.updatedAt;
    
    return new Date(bDate) - new Date(aDate);
  });

  const paginatedLeads = sortedLeads.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    data: paginatedLeads,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: sortedLeads.length,
      pages: Math.ceil(sortedLeads.length / parseInt(limit))
    }
  });
});

export const getPipeline = asyncHandler(async (req, res) => {
  const qualified = await Lead.countDocuments({ status: LeadStatus.QUALIFIED });
  const testDrives = await Lead.countDocuments({ 'testDrive.scheduled': true });
  const converted = await Lead.find({ status: LeadStatus.CONVERTED });
  
  const pipelineValue = converted.reduce((sum, lead) => {
    const value = lead.interest?.budget?.max || lead.interest?.budget?.min || 0;
    return sum + value;
  }, 0);

  res.json({
    success: true,
    data: {
      qualified,
      testDrives,
      pipelineValue
    }
  });
});

export const getAIScoring = asyncHandler(async (req, res) => {
  const hot = await Lead.countDocuments({ tier: 'hot', score: { $gte: 85 } });
  const warm = await Lead.countDocuments({ tier: 'warm', score: { $gte: 55, $lt: 85 } });
  const cold = await Lead.countDocuments({ tier: 'cold', score: { $lt: 55 } });

  res.json({
    success: true,
    data: {
      hot,
      warm,
      cold
    }
  });
});

export const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('assignedTo', 'name email role')
    .populate('messages.sentBy', 'name email')
    .populate('notes.addedBy', 'name email');

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  res.json({
    success: true,
    data: lead
  });
});

export const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  Object.assign(lead, req.body);
  lead.lastActivity = new Date();
  await lead.save();

  const io = getIO();
  if (io) {
    io.emit('lead:updated', {
      leadId: lead._id.toString(),
      updates: req.body
    });
  }

  res.json({
    success: true,
    data: lead
  });
});

export const updateLeadScore = asyncHandler(async (req, res) => {
  const { score, reason } = req.body;
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const oldTier = lead.tier;
  lead.score = score;
  
  if (score >= 85) lead.tier = 'hot';
  else if (score >= 55) lead.tier = 'warm';
  else lead.tier = 'cold';

  lead.scoreHistory.push({
    score,
    tier: lead.tier,
    reason: reason || 'Manual re-score',
    scoredAt: new Date()
  });

  await lead.save();

  if (oldTier !== lead.tier) {
    const rules = await RoutingRule.find({ isActive: true });
    await evaluateRules(lead, rules);
  }

  const io = getIO();
  if (io) {
    io.emit('lead:scored', {
      leadId: lead._id.toString(),
      score: lead.score,
      tier: lead.tier
    });
  }

  res.json({
    success: true,
    data: lead
  });
});

export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  lead.status = 'deleted';
  await lead.save();

  res.json({
    success: true,
    message: 'Lead deleted successfully'
  });
});

export const addMessage = asyncHandler(async (req, res) => {
  const { content, channel } = req.body;
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const message = {
    direction: 'outbound',
    channel,
    content,
    isAI: false,
    sentBy: req.agent._id,
    sentAt: new Date(),
    status: 'draft'
  };

  lead.messages.push(message);
  lead.lastActivity = new Date();
  await lead.save();

  if (escalationQueue) {
    const escalationJobs = await escalationQueue.getJobs(['delayed', 'waiting']);
    for (const job of escalationJobs) {
      if (job.data.leadId === req.params.id) {
        await job.remove();
      }
    }
  }

  res.json({
    success: true,
    data: message
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('messages.sentBy', 'name email');

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  res.json({
    success: true,
    data: lead.messages
  });
});

export const addNote = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  if (!text || !text.trim()) {
    throw new AppError('Note text is required', 400);
  }

  const note = {
    text: text.trim(),
    addedBy: req.agent._id,
    addedAt: new Date()
  };

  lead.notes.push(note);
  lead.lastActivity = new Date();
  await lead.save();

  const populatedLead = await Lead.findById(req.params.id)
    .populate('notes.addedBy', 'name email');

  const addedNote = populatedLead.notes[populatedLead.notes.length - 1];

  res.status(201).json({
    success: true,
    data: addedNote
  });
});

export const updateNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { text } = req.body;
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const note = lead.notes.id(noteId);
  if (!note) {
    throw new AppError('Note not found', 404);
  }

  if (note.addedBy.toString() !== req.agent._id.toString()) {
    throw new AppError('Unauthorized. You can only edit your own notes.', 403);
  }

  if (!text || !text.trim()) {
    throw new AppError('Note text is required', 400);
  }

  note.text = text.trim();
  lead.lastActivity = new Date();
  await lead.save();

  const populatedLead = await Lead.findById(req.params.id)
    .populate('notes.addedBy', 'name email');

  const updatedNote = populatedLead.notes.id(noteId);

  res.json({
    success: true,
    data: updatedNote
  });
});

export const deleteNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const note = lead.notes.id(noteId);
  if (!note) {
    throw new AppError('Note not found', 404);
  }

  if (note.addedBy.toString() !== req.agent._id.toString() && 
      req.agent.role !== 'manager' && 
      req.agent.role !== 'owner') {
    throw new AppError('Unauthorized. You can only delete your own notes.', 403);
  }

  note.deleteOne();
  lead.lastActivity = new Date();
  await lead.save();

  res.json({
    success: true,
    message: 'Note deleted successfully'
  });
});

export const getNotes = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate('notes.addedBy', 'name email')
    .select('notes');

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  res.json({
    success: true,
    data: lead.notes
  });
});

export const quickAction = asyncHandler(async (req, res) => {
  const { action, data } = req.body;
  const lead = await Lead.findById(req.params.id);

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  switch (action) {
    case 'mark_qualified':
      lead.status = LeadStatus.QUALIFIED;
      break;
    case 'schedule_test_drive':
      lead.testDrive = {
        scheduled: true,
        date: data?.date ? new Date(data.date) : null,
        carAssigned: data?.carAssigned || null
      };
      lead.status = LeadStatus.TEST_DRIVE_SCHEDULED;
      break;
    case 'mark_converted':
      lead.status = LeadStatus.CONVERTED;
      break;
    case 'mark_lost':
      lead.status = LeadStatus.LOST;
      break;
    case 'reassign':
      if (data?.agentId) {
        lead.assignedTo = data.agentId;
      }
      break;
    default:
      throw new AppError('Invalid action', 400);
  }

  lead.lastActivity = new Date();
  await lead.save();

  const io = getIO();
  if (io) {
    io.emit('lead:updated', {
      leadId: lead._id.toString(),
      action,
      updates: { status: lead.status }
    });
  }

  res.json({
    success: true,
    data: lead
  });
});

export const bulkUpdate = asyncHandler(async (req, res) => {
  const { leadIds, updates } = req.body;

  if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
    throw new AppError('Lead IDs array is required', 400);
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw new AppError('Updates object is required', 400);
  }

  if (req.agent.role !== 'manager' && req.agent.role !== 'owner') {
    throw new AppError('Unauthorized. Only managers and owners can perform bulk operations.', 403);
  }

  const result = await Lead.updateMany(
    { _id: { $in: leadIds } },
    { 
      $set: { ...updates, lastActivity: new Date() }
    }
  );

  const io = getIO();
  if (io) {
    leadIds.forEach(leadId => {
      io.emit('lead:updated', {
        leadId: leadId.toString(),
        updates
      });
    });
  }

  res.json({
    success: true,
    message: `${result.modifiedCount} leads updated successfully`,
    modifiedCount: result.modifiedCount
  });
});
