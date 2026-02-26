import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import Lead from '../models/Lead.js';
import Agent from '../models/Agent.js';
import { sendEmail } from '../services/messaging.service.js';
import { AgentRole, LeadStatus } from '../enums/index.js';
import { logger } from '../utils/logger.js';

if (!redis) {
  logger.warn('Redis not available. Escalation worker will not start.');
}

const escalationWorker = redis ? new Worker('escalation', async (job) => {
  const { leadId } = job.data;
  const lead = await Lead.findById(leadId).populate('assignedTo');
  
  if (!lead) {
    return;
  }

  const hasAgentReply = lead.messages.some(msg => 
    msg.direction === 'outbound' && !msg.isAI
  );

  if (!hasAgentReply && lead.status !== LeadStatus.CONVERTED && lead.status !== LeadStatus.LOST) {
    const managers = await Agent.find({
      role: { $in: [AgentRole.MANAGER, AgentRole.OWNER] }
    });

    for (const manager of managers) {
      if (manager.email) {
        await sendEmail(
          manager.email,
          `⚠️ Escalation: No Response on HOT Lead - ${lead.name}`,
          `
            <h2>Lead Escalation Alert</h2>
            <p><strong>Lead:</strong> ${lead.name}</p>
            <p><strong>Car Interest:</strong> ${lead.interest?.make} ${lead.interest?.model}</p>
            <p><strong>Score:</strong> ${lead.score} (${lead.tier})</p>
            <p><strong>Assigned To:</strong> ${lead.assignedTo?.name || 'Unassigned'}</p>
            <p><strong>Status:</strong> ${lead.status}</p>
            <p><strong>Created:</strong> ${new Date(lead.createdAt).toLocaleString()}</p>
            <p>This lead has been waiting for 24 hours without an agent response.</p>
          `
        );
      }
    }

    logger.warn(`Escalation sent for lead ${leadId} - no agent response in 24h`);
  }
}, {
  connection: redis,
  concurrency: 3,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 }
}) : null;

if (escalationWorker) {
  escalationWorker.on('completed', (job) => {
    logger.success(`Escalation job ${job.id} completed for lead ${job.data.leadId}`);
  });

  escalationWorker.on('failed', (job, err) => {
    logger.error(`Escalation job ${job.id} failed:`, err);
  });
}

export default escalationWorker;
