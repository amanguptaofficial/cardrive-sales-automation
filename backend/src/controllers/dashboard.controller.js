import Lead from '../models/Lead.js';
import { redis } from '../config/redis.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getStats = asyncHandler(async (req, res) => {
  const cacheKey = 'dashboard:stats';
  let cached = null;
  
  try {
    if (redis) {
      cached = await redis.get(cacheKey);
    }
  } catch (error) {
    console.error('Redis cache read error:', error);
  }

  if (cached) {
    try {
      return res.json({
        success: true,
        data: JSON.parse(cached)
      });
    } catch (error) {
      console.error('Error parsing cached data:', error);
    }
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalLeads = await Lead.countDocuments({
    createdAt: { $gte: startOfMonth }
  });

  const aiReplied = await Lead.countDocuments({
    status: 'ai_replied',
    createdAt: { $gte: startOfMonth }
  });

  const aiResponseRate = totalLeads > 0 ? (aiReplied / totalLeads) * 100 : 0;

  const respondedLeads = await Lead.find({
    'messages.direction': 'outbound',
    createdAt: { $gte: startOfMonth }
  }).select('messages createdAt');

  let totalResponseTime = 0;
  let responseCount = 0;

  for (const lead of respondedLeads) {
    if (!lead.messages || lead.messages.length === 0) continue;
    const firstOutbound = lead.messages.find(m => m.direction === 'outbound' && m.sentAt);
    if (firstOutbound && firstOutbound.sentAt && lead.createdAt) {
      try {
        const sentAt = new Date(firstOutbound.sentAt);
        const createdAt = new Date(lead.createdAt);
        if (!isNaN(sentAt.getTime()) && !isNaN(createdAt.getTime())) {
          const responseTime = (sentAt - createdAt) / 1000;
          if (responseTime > 0 && responseTime < 86400) {
            totalResponseTime += responseTime;
            responseCount++;
          }
        }
      } catch (error) {
        console.error('Error calculating response time:', error);
      }
    }
  }

  const avgFirstResponse = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;

  const convertedLeads = await Lead.find({
    status: 'converted',
    createdAt: { $gte: startOfMonth }
  }).select('interest');

  const pipelineValue = convertedLeads.reduce((sum, lead) => {
    try {
      const value = lead.interest?.budget?.max || lead.interest?.budget?.min || 0;
      return sum + (typeof value === 'number' ? value : 0);
    } catch (error) {
      return sum;
    }
  }, 0);

  const stats = {
    totalLeads,
    aiResponseRate: Math.round(aiResponseRate * 100) / 100,
    avgFirstResponseSec: avgFirstResponse,
    monthlySalesValue: pipelineValue
  };

  try {
    if (redis) {
      await redis.setex(cacheKey, 60, JSON.stringify(stats));
    }
  } catch (error) {
    console.error('Redis cache write error:', error);
  }

  res.json({
    success: true,
    data: stats
  });
});

export const getFunnel = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const ingested = await Lead.countDocuments({
    createdAt: { $gte: startOfMonth }
  });

  const scored = await Lead.countDocuments({
    score: { $ne: null },
    createdAt: { $gte: startOfMonth }
  });

  const responded = await Lead.countDocuments({
    status: { $in: ['ai_replied', 'agent_replied'] },
    createdAt: { $gte: startOfMonth }
  });

  const testDrive = await Lead.countDocuments({
    'testDrive.scheduled': true,
    createdAt: { $gte: startOfMonth }
  });

  const converted = await Lead.countDocuments({
    status: 'converted',
    createdAt: { $gte: startOfMonth }
  });

  res.json({
    success: true,
    data: {
      ingested,
      scored,
      responded,
      testDrive,
      converted
    }
  });
});

export const getActivity = asyncHandler(async (req, res) => {
  const activities = [];

  const recentLeads = await Lead.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .select('name score tier status interest messages createdAt');

  for (const lead of recentLeads) {
    try {
      if (lead.messages && lead.messages.length > 0) {
        const lastMessage = lead.messages[lead.messages.length - 1];
        if (lastMessage && lastMessage.isAI) {
          activities.push({
            type: 'reply_sent',
            leadId: lead._id.toString(),
            leadName: lead.name || 'Unknown',
            description: `${lead.interest?.model || 'Vehicle'} match • ${lastMessage.channel || 'unknown'} • AI response sent`,
            timestamp: lastMessage.sentAt || lead.updatedAt || new Date()
          });
        }
      }

      if (lead.tier === 'hot' && lead.score >= 85) {
        activities.push({
          type: 'hot_flagged',
          leadId: lead._id.toString(),
          leadName: lead.name || 'Unknown',
          description: `Score ${lead.score} • Routed to agent`,
          timestamp: lead.updatedAt || lead.createdAt || new Date()
        });
      }
    } catch (error) {
      console.error('Error processing lead activity:', error);
    }
  }

  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.json({
    success: true,
    data: activities.slice(0, 20)
  });
});

export const getVolume = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const volumes = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = await Lead.countDocuments({
      createdAt: { $gte: date, $lt: nextDate }
    });

    volumes.push({
      date: date.toISOString().split('T')[0],
      count
    });
  }

  res.json({
    success: true,
    data: volumes
  });
});
