import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import Lead from '../models/Lead.js';
import { scoreLead } from '../services/ai.service.js';
import { respondQueue } from '../queues/index.js';
import { getIO } from '../socket.js';
import { logger } from '../utils/logger.js';

if (!redis) {
  logger.warn('Redis not available. Score worker will not start.');
}

const scoreWorker = redis ? new Worker('score', async (job) => {
  const { leadId } = job.data;
  const lead = await Lead.findById(leadId);
  
  if (!lead) {
    throw new Error(`Lead ${leadId} not found`);
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

  if (respondQueue) {
    await respondQueue.add('generate-response', { leadId: lead._id.toString() }, {
      priority: result.tier === 'hot' ? 1 : 10
    });
  } else {
    logger.warn('Respond queue not available. Lead scored but response not queued.');
  }

  return result;
}, {
  connection: redis,
  concurrency: 5,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 }
}) : null;

if (scoreWorker) {
  scoreWorker.on('completed', (job) => {
    logger.success(`Score job ${job.id} completed for lead ${job.data.leadId}`);
  });

  scoreWorker.on('failed', (job, err) => {
    logger.error(`Score job ${job.id} failed:`, err);
  });
}

export default scoreWorker;
