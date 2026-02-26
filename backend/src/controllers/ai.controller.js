import Lead from '../models/Lead.js';
import { generateResponse, regenerateResponse, scoreLead } from '../services/ai.service.js';
import { sendMessage } from '../services/messaging.service.js';
import { MessageDirection, MessageChannel, MessageStatus } from '../enums/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { notifyNewLead } from './chat.controller.js';
import Chat from '../models/Chat.js';
import { getIO } from '../socket.js';

export const scoreLeadAI = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.leadId);

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const result = await scoreLead(lead);

  lead.score = result.score;
  lead.tier = result.tier;
  lead.aiSignals = result.signals;
  lead.sentiment = result.sentiment;
  lead.scoreHistory.push({
    score: result.score,
    tier: result.tier,
    reason: result.reasoning,
    scoredAt: new Date()
  });
  await lead.save();

  res.json({
    success: true,
    data: result
  });
});

export const generateResponseAI = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.leadId)
    .populate('assignedTo', 'name email');

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const result = await generateResponse(lead);

  const message = {
    direction: MessageDirection.OUTBOUND,
    channel: lead.preferredContact === 'whatsapp' ? MessageChannel.WHATSAPP : 
             lead.preferredContact === 'email' ? MessageChannel.EMAIL : 
             lead.phone ? MessageChannel.WHATSAPP : MessageChannel.EMAIL,
    content: result.content,
    isAI: true,
    status: MessageStatus.DRAFT
  };

  lead.messages.push(message);
  await lead.save();

  res.json({
    success: true,
    data: {
      content: result.content,
      tags: result.tags,
      messageId: lead.messages[lead.messages.length - 1]._id
    }
  });
});

export const sendAIResponse = asyncHandler(async (req, res) => {
  const { messageId, channel } = req.body;
  const lead = await Lead.findById(req.params.leadId)
    .populate('assignedTo', 'name email');

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  let message = null;
  if (messageId) {
    const messageIdStr = messageId.toString();
    
    try {
      message = lead.messages.id(messageIdStr);
    } catch (err) {
    }
    
    if (!message) {
      message = lead.messages.find(msg => {
        if (!msg._id) return false;
        const msgId = msg._id.toString();
        return msgId === messageIdStr;
      });
    }
    
    if (!message && !isNaN(messageIdStr)) {
      const index = parseInt(messageIdStr);
      if (index >= 0 && index < lead.messages.length) {
        message = lead.messages[index];
      }
    }
  }
  
  if (!message) {
    const draftMessages = lead.messages.filter(msg => 
      msg.isAI === true && (msg.status === 'draft' || msg.status === 'failed')
    );
    if (draftMessages.length > 0) {
      message = draftMessages[draftMessages.length - 1]; // Get the most recent draft
    }
  }

  if (!message) {
    const hasDraftMessages = lead.messages.some(msg => 
      msg.isAI === true && (msg.status === 'draft' || msg.status === 'failed')
    );
    
    if (!hasDraftMessages) {
      throw new AppError('No draft AI messages found for this lead. The message may have already been sent or removed.', 404);
    } else {
      throw new AppError(`Message with ID "${messageId}" not found. Please ensure the message exists and is in draft status.`, 404);
    }
  }
  
  if (message.status !== 'draft' && message.status !== 'failed') {
    throw new AppError(`Message has already been sent (status: ${message.status}). Cannot send again.`, 400);
  }

  const sendChannel = channel || message.channel;
  const to = sendChannel === MessageChannel.EMAIL ? lead.email : lead.phone;

  if (!to) {
    throw new AppError('No contact information available', 400);
  }

  const sendResult = await sendMessage(
    sendChannel,
    to,
    message.content,
    `CarDrive Motors - Inquiry about ${lead.interest?.model || 'your vehicle'}`
  );

  message.status = sendResult.status;
  message.channel = sendChannel;
  await lead.save();

  const io = getIO();
  if (io && lead.assignedTo) {
    try {
      const groups = await Chat.find({
        type: 'group',
        'settings.autoAddNewLeads': true,
        isActive: true
      }).populate('members.user', 'name email');

      if (groups.length > 0) {
        const agentName = lead.assignedTo.name || 'Agent';
        groups.forEach(group => {
          const notificationMessage = {
            sender: null,
            content: `✅ Message sent to ${lead.name} (${lead.interest?.model || 'Lead'}) by ${agentName}`,
            type: 'system',
            metadata: {
              leadId: lead._id.toString(),
              leadName: lead.name,
              agentName: agentName,
              messageChannel: sendChannel
            }
          };

          group.messages.push(notificationMessage);
          group.save();

          group.members.forEach(member => {
            io.to(member.user._id?.toString() || member.user.toString()).emit('chat:message', {
              chatId: group._id.toString(),
              message: {
                ...notificationMessage,
                _id: notificationMessage._id || new Date().getTime(),
                createdAt: new Date()
              }
            });
          });
        });
      }
    } catch (error) {
      console.error('Error notifying chat about message sent:', error);
    }
  }

  res.json({
    success: true,
    data: {
      message,
      sendResult
    }
  });
});

export const regenerateResponseAI = asyncHandler(async (req, res) => {
  const { tone = 'friendly' } = req.body;
  const lead = await Lead.findById(req.params.leadId)
    .populate('assignedTo', 'name email');

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const result = await regenerateResponse(lead, tone);

  const message = {
    direction: MessageDirection.OUTBOUND,
    channel: lead.preferredContact === 'whatsapp' ? MessageChannel.WHATSAPP : 
             lead.preferredContact === 'email' ? MessageChannel.EMAIL : 
             lead.phone ? MessageChannel.WHATSAPP : MessageChannel.EMAIL,
    content: result.content,
    isAI: true,
    status: MessageStatus.DRAFT
  };

  lead.messages.push(message);
  await lead.save();

  res.json({
    success: true,
    data: {
      content: result.content,
      tags: result.tags,
      messageId: lead.messages[lead.messages.length - 1]._id
    }
  });
});
