import Lead from '../models/Lead.js';
import { scoreLead } from './ai.service.js';
import { generateResponse } from './ai.service.js';
import { sendMessage } from './messaging.service.js';
import { MessageDirection, MessageChannel, MessageStatus, LeadTier, LeadStatus } from '../enums/index.js';
import { getIO } from '../socket.js';
import { logger } from '../utils/logger.js';
import { dripQueue } from '../queues/index.js';

export const processLeadScoring = async (leadId) => {
  try {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      logger.error(`Lead ${leadId} not found for scoring`);
      return;
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

    const io = getIO();
    if (io) {
      io.emit('lead:scored', {
        leadId: lead._id.toString(),
        score: result.score,
        tier: result.tier
      });
    }

    logger.success(`Lead ${leadId} scored: ${result.score} (${result.tier})`);

    await processLeadResponse(leadId);
  } catch (error) {
    logger.error(`Error processing lead scoring for ${leadId}:`, error);
  }
};

export const processLeadResponse = async (leadId) => {
  try {
    const lead = await Lead.findById(leadId)
      .populate('assignedTo', 'name email');
    if (!lead) {
      logger.error(`Lead ${leadId} not found for response generation`);
      return;
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
  } catch (error) {
    logger.error(`Error processing lead response for ${leadId}:`, error);
  }
};
