import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import Lead from '../models/Lead.js';
import { generateResponse } from '../services/ai.service.js';
import { sendMessage } from '../services/messaging.service.js';
import { MessageDirection, MessageChannel, MessageStatus, LeadTier, LeadStatus } from '../enums/index.js';
import { dripQueue } from '../queues/index.js';
import { getIO } from '../socket.js';
import { logger } from '../utils/logger.js';

if (!redis) {
  logger.warn('Redis not available. Respond worker will not start.');
}

const respondWorker = redis ? new Worker('respond', async (job) => {
  const { leadId } = job.data;
  const lead = await Lead.findById(leadId)
    .populate('assignedTo', 'name email');
  
  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
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
  
  const io = getIO();
  
  if (lead.tier === LeadTier.HOT) {
    await lead.save();
    if (io) {
      io.emit('lead:ai-replied', {
        leadId: lead._id.toString(),
        message: result.content,
        messageId: lead.messages[lead.messages.length - 1]._id?.toString(),
        sent: false,
        draft: true,
        tier: 'hot'
      });
    }
    logger.info(`Hot lead ${leadId} - AI response saved as draft for review`);
  } else {
    const channel = message.channel;
    const to = channel === MessageChannel.EMAIL ? lead.email : lead.phone;
    
    if (to) {
      try {
        const sendResult = await sendMessage(
          channel,
          to,
          result.content,
          `CarDrive Motors - Inquiry about ${lead.interest?.model || 'your vehicle'}`
        );
        
        const lastMessage = lead.messages[lead.messages.length - 1];
        lastMessage.status = sendResult.status || MessageStatus.SENT;
        
        lead.status = LeadStatus.AI_REPLIED;
        await lead.save();
        
        if (io) {
          io.emit('lead:ai-replied', {
            leadId: lead._id.toString(),
            message: result.content,
            messageId: lastMessage._id?.toString(),
            sent: true,
            draft: false,
            tier: lead.tier
          });
        }
        
        logger.success(`AI response sent automatically to ${lead.tier} lead ${leadId}`);

        if (lead.tier === LeadTier.COLD && dripQueue) {
          await dripQueue.add('send-drip', {
            leadId: lead._id.toString(),
            sequence: 'cold-14day',
            step: 1
          }, {
            delay: 24 * 60 * 60 * 1000
          });
        }
      } catch (error) {
        logger.error(`Failed to send AI response for lead ${leadId}:`, error);
        const lastMessage = lead.messages[lead.messages.length - 1];
        lastMessage.status = MessageStatus.DRAFT;
        await lead.save();
        
        if (io) {
          io.emit('lead:ai-replied', {
            leadId: lead._id.toString(),
            message: result.content,
            messageId: lastMessage._id?.toString(),
            sent: false,
            draft: true,
            error: error.message || 'Failed to send'
          });
        }
        logger.info(`Message saved as draft due to send failure for lead ${leadId}`);
      }
    } else {
      const lastMessage = lead.messages[lead.messages.length - 1];
      lastMessage.status = MessageStatus.DRAFT;
      await lead.save();
      
      if (io) {
        io.emit('lead:ai-replied', {
          leadId: lead._id.toString(),
          message: result.content,
          sent: false,
          draft: true,
          error: 'No contact information'
        });
      }
      logger.warn(`No contact info for lead ${leadId} - saved as draft`);
    }
  }

  return result;
}, {
  connection: redis,
  concurrency: 3,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 }
}) : null;

if (respondWorker) {
  respondWorker.on('completed', (job) => {
    logger.success(`Respond job ${job.id} completed for lead ${job.data.leadId}`);
  });

  respondWorker.on('failed', (job, err) => {
    logger.error(`Respond job ${job.id} failed:`, err);
  });
}

export default respondWorker;
