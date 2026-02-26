import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { dripQueue } from '../queues/index.js';
import Lead from '../models/Lead.js';
import Sequence from '../models/Sequence.js';
import { sendMessage } from '../services/messaging.service.js';
import { MessageDirection, MessageChannel, MessageStatus } from '../enums/index.js';
import { logger } from '../utils/logger.js';

if (!redis) {
  logger.warn('Redis not available. Drip worker will not start.');
}

const dripWorker = redis ? new Worker('drip', async (job) => {
  const { leadId, sequence, step } = job.data;
  const lead = await Lead.findById(leadId);
  
  if (!lead || !lead.drip.isActive) {
    return;
  }

  let sequenceDoc;
  if (typeof sequence === 'string' && sequence.match(/^[0-9a-fA-F]{24}$/)) {
    sequenceDoc = await Sequence.findById(sequence);
  } else {
    sequenceDoc = await Sequence.findOne({ name: sequence });
  }

  if (!sequenceDoc || !sequenceDoc.isActive) {
    lead.drip.isActive = false;
    await lead.save();
    return;
  }

  const sequenceMessages = sequenceDoc.messages || [];
  const messageTemplate = sequenceMessages[step - 1];
  
  if (!messageTemplate) {
    lead.drip.isActive = false;
    await lead.save();
    return;
  }

  let content = messageTemplate.content
    .replace(/{name}/g, lead.name || 'there')
    .replace(/{model}/g, lead.interest?.model || 'vehicle');

  const channel = lead.preferredContact === 'whatsapp' ? MessageChannel.WHATSAPP : 
                 lead.preferredContact === 'email' ? MessageChannel.EMAIL : 
                 lead.phone ? MessageChannel.WHATSAPP : MessageChannel.EMAIL;
  
  const to = channel === MessageChannel.EMAIL ? lead.email : lead.phone;
  
  if (to) {
    const subject = messageTemplate.subject || `CarDrive Motors - Update on ${lead.interest?.model || 'your inquiry'}`;
    
    const sendResult = await sendMessage(
      channel,
      to,
      content,
      subject
    );

    const message = {
      direction: MessageDirection.OUTBOUND,
      channel,
      content,
      isAI: true,
      status: sendResult.status
    };

    lead.messages.push(message);
    lead.drip.step = step;
    
    if (step < sequenceMessages.length) {
      const nextStep = step + 1;
      const currentDay = messageTemplate.day || step;
      const nextMessage = sequenceMessages[nextStep - 1];
      const nextDay = nextMessage?.day || (currentDay + 7);
      const delay = (nextDay - currentDay) * 24 * 60 * 60 * 1000;
      
      lead.drip.nextAt = new Date(Date.now() + delay);
      await lead.save();
      
      const sequenceId = typeof sequence === 'string' && sequence.match(/^[0-9a-fA-F]{24}$/) 
        ? sequence 
        : sequenceDoc._id.toString();
      
      if (dripQueue) {
        await dripQueue.add('send-drip', {
          leadId: lead._id.toString(),
          sequence: sequenceId,
          step: nextStep
        }, { delay });
      } else {
        logger.warn('Drip queue not available. Next message will not be scheduled.');
      }
    } else {
      lead.drip.isActive = false;
      await lead.save();
    }
  }
}, {
  connection: redis,
  concurrency: 5,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 }
}) : null;

if (dripWorker) {
  dripWorker.on('completed', (job) => {
    logger.success(`Drip job ${job.id} completed for lead ${job.data.leadId}`);
  });

  dripWorker.on('failed', (job, err) => {
    logger.error(`Drip job ${job.id} failed:`, err);
  });
}

export default dripWorker;
