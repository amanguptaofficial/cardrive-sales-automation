import Lead from '../models/Lead.js';
import Agent from '../models/Agent.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { AgentRole, LeadStatus, LeadTier } from '../enums/index.js';

export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  if (req.agent.role !== AgentRole.MANAGER && req.agent.role !== AgentRole.OWNER) {
    throw new AppError('Unauthorized. Admin access required.', 403);
  }

  const { period = 'month', startDate, endDate } = req.query;
  
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    end = new Date();
    start = new Date();
    if (period === 'day') {
      start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(start.getMonth() - 1);
    } else if (period === 'year') {
      start.setFullYear(start.getFullYear() - 1);
    }
  }

  const convertedLeads = await Lead.find({
    status: LeadStatus.CONVERTED,
    updatedAt: { $gte: start, $lte: end }
  }).populate('assignedTo', 'name email');

  const totalRevenue = convertedLeads.reduce((sum, lead) => {
    const value = lead.interest?.budget?.max || lead.interest?.budget?.min || 0;
    return sum + value;
  }, 0);

  const revenueBySource = {};
  const revenueByAgent = {};
  const dailyRevenue = {};

  convertedLeads.forEach(lead => {
    const source = lead.source;
    revenueBySource[source] = (revenueBySource[source] || 0) + 
      (lead.interest?.budget?.max || lead.interest?.budget?.min || 0);

    if (lead.assignedTo) {
      const agentId = lead.assignedTo._id.toString();
      const agentName = lead.assignedTo.name;
      if (!revenueByAgent[agentId]) {
        revenueByAgent[agentId] = { name: agentName, revenue: 0, count: 0 };
      }
      revenueByAgent[agentId].revenue += (lead.interest?.budget?.max || lead.interest?.budget?.min || 0);
      revenueByAgent[agentId].count += 1;
    }

    const dateKey = new Date(lead.updatedAt).toISOString().split('T')[0];
    dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + 
      (lead.interest?.budget?.max || lead.interest?.budget?.min || 0);
  });

  const revenueTrend = Object.keys(dailyRevenue)
    .sort()
    .map(date => ({
      date,
      revenue: dailyRevenue[date]
    }));

  res.json({
    success: true,
    data: {
      totalRevenue,
      revenueBySource,
      revenueByAgent: Object.values(revenueByAgent),
      revenueTrend,
      period: { start, end }
    }
  });
});

export const getConversionAnalytics = asyncHandler(async (req, res) => {
  if (req.agent.role !== AgentRole.MANAGER && req.agent.role !== AgentRole.OWNER) {
    throw new AppError('Unauthorized. Admin access required.', 403);
  }

  const { period = 'month', startDate, endDate } = req.query;
  
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    end = new Date();
    start = new Date();
    if (period === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(start.getMonth() - 1);
    } else if (period === 'year') {
      start.setFullYear(start.getFullYear() - 1);
    }
  }

  const totalLeads = await Lead.countDocuments({
    createdAt: { $gte: start, $lte: end }
  });

  const convertedLeads = await Lead.find({
    status: LeadStatus.CONVERTED,
    updatedAt: { $gte: start, $lte: end }
  }).populate('assignedTo', 'name email');

  const overallConversionRate = totalLeads > 0 ? (convertedLeads.length / totalLeads) * 100 : 0;

  const conversionBySource = {};
  const conversionByAgent = {};
  const conversionByTier = { hot: 0, warm: 0, cold: 0 };
  const conversionByTierTotal = { hot: 0, warm: 0, cold: 0 };

  const allLeadsInPeriod = await Lead.find({
    createdAt: { $gte: start, $lte: end }
  });

  allLeadsInPeriod.forEach(lead => {
    if (lead.tier) {
      conversionByTierTotal[lead.tier] = (conversionByTierTotal[lead.tier] || 0) + 1;
    }
  });

  convertedLeads.forEach(lead => {
    const source = lead.source;
    if (!conversionBySource[source]) {
      conversionBySource[source] = { converted: 0, total: 0 };
    }
    conversionBySource[source].converted += 1;

    if (lead.assignedTo) {
      const agentId = lead.assignedTo._id.toString();
      const agentName = lead.assignedTo.name;
      if (!conversionByAgent[agentId]) {
        conversionByAgent[agentId] = { name: agentName, converted: 0, total: 0 };
      }
      conversionByAgent[agentId].converted += 1;
    }

    if (lead.tier) {
      conversionByTier[lead.tier] = (conversionByTier[lead.tier] || 0) + 1;
    }
  });

  Object.keys(conversionBySource).forEach(source => {
    const sourceLeads = allLeadsInPeriod.filter(l => l.source === source).length;
    conversionBySource[source].total = sourceLeads;
    conversionBySource[source].rate = sourceLeads > 0 
      ? (conversionBySource[source].converted / sourceLeads) * 100 
      : 0;
  });

  const agents = await Agent.find({ role: { $ne: AgentRole.OWNER } });
  agents.forEach(agent => {
    const agentId = agent._id.toString();
    if (!conversionByAgent[agentId]) {
      conversionByAgent[agentId] = { name: agent.name, converted: 0, total: 0 };
    }
    const agentLeads = allLeadsInPeriod.filter(l => 
      l.assignedTo && l.assignedTo.toString() === agentId
    ).length;
    conversionByAgent[agentId].total = agentLeads;
    conversionByAgent[agentId].rate = agentLeads > 0 
      ? (conversionByAgent[agentId].converted / agentLeads) * 100 
      : 0;
  });

  Object.keys(conversionByTier).forEach(tier => {
    conversionByTier[tier] = {
      converted: conversionByTier[tier],
      total: conversionByTierTotal[tier] || 0,
      rate: conversionByTierTotal[tier] > 0 
        ? (conversionByTier[tier] / conversionByTierTotal[tier]) * 100 
        : 0
    };
  });

  res.json({
    success: true,
    data: {
      overallConversionRate,
      conversionBySource,
      conversionByAgent: Object.values(conversionByAgent),
      conversionByTier,
      totalLeads,
      convertedLeads: convertedLeads.length,
      period: { start, end }
    }
  });
});

export const getAgentPerformance = asyncHandler(async (req, res) => {
  if (req.agent.role !== AgentRole.MANAGER && req.agent.role !== AgentRole.OWNER) {
    throw new AppError('Unauthorized. Admin access required.', 403);
  }

  const { period = 'month', startDate, endDate } = req.query;
  
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    end = new Date();
    start = new Date();
    if (period === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(start.getMonth() - 1);
    }
  }

  const agents = await Agent.find({ 
    role: { $ne: AgentRole.OWNER },
    isActive: true 
  }).select('name email role');

  const performanceData = await Promise.all(
    agents.map(async (agent) => {
      const agentId = agent._id;

      const assignedLeads = await Lead.countDocuments({
        assignedTo: agentId,
        createdAt: { $gte: start, $lte: end }
      });

      const respondedLeads = await Lead.find({
        assignedTo: agentId,
        'messages.direction': 'outbound',
        'messages.sentBy': agentId,
        createdAt: { $gte: start, $lte: end }
      });

      let totalResponseTime = 0;
      let responseCount = 0;

      for (const lead of respondedLeads) {
        const firstOutbound = lead.messages.find(m => 
          m.direction === 'outbound' && 
          m.sentBy && 
          m.sentBy.toString() === agentId.toString()
        );
        if (firstOutbound && firstOutbound.sentAt) {
          const responseTime = (firstOutbound.sentAt - lead.createdAt) / 1000;
          totalResponseTime += responseTime;
          responseCount++;
        }
      }

      const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
      const responseRate = assignedLeads > 0 ? (responseCount / assignedLeads) * 100 : 0;

      const convertedLeads = await Lead.find({
        assignedTo: agentId,
        status: LeadStatus.CONVERTED,
        updatedAt: { $gte: start, $lte: end }
      });

      const revenue = convertedLeads.reduce((sum, lead) => {
        return sum + (lead.interest?.budget?.max || lead.interest?.budget?.min || 0);
      }, 0);

      const conversionRate = assignedLeads > 0 
        ? (convertedLeads.length / assignedLeads) * 100 
        : 0;

      return {
        agentId: agent._id.toString(),
        name: agent.name,
        email: agent.email,
        role: agent.role,
        assignedLeads,
        respondedLeads: responseCount,
        responseRate: Math.round(responseRate * 100) / 100,
        avgResponseTime,
        convertedLeads: convertedLeads.length,
        conversionRate: Math.round(conversionRate * 100) / 100,
        revenue
      };
    })
  );

  const sortedByRevenue = [...performanceData].sort((a, b) => b.revenue - a.revenue);
  const sortedByConversion = [...performanceData].sort((a, b) => b.conversionRate - a.conversionRate);
  const sortedByResponseRate = [...performanceData].sort((a, b) => b.responseRate - a.responseRate);

  res.json({
    success: true,
    data: {
      performance: performanceData,
      leaderboard: {
        revenue: sortedByRevenue.slice(0, 10),
        conversion: sortedByConversion.slice(0, 10),
        responseRate: sortedByResponseRate.slice(0, 10)
      },
      period: { start, end }
    }
  });
});

export const getPersonalDashboard = asyncHandler(async (req, res) => {
  const agentId = req.agent._id;
  const { period = 'month', startDate, endDate } = req.query;
  
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include full end date
  } else {
    end = new Date();
    end.setHours(23, 59, 59, 999);
    start = new Date();
    start.setHours(0, 0, 0, 0);
    if (period === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(start.getMonth() - 1);
    }
  }

  const totalLeads = await Lead.countDocuments({
    assignedTo: agentId,
    $or: [
      { createdAt: { $gte: start, $lte: end } },
      { updatedAt: { $gte: start, $lte: end }, assignedTo: agentId }
    ]
  });

  const allLeads = await Lead.find({
    assignedTo: agentId,
    $or: [
      { createdAt: { $gte: start, $lte: end } },
      { updatedAt: { $gte: start, $lte: end }, assignedTo: agentId }
    ]
  }).select('messages createdAt updatedAt').populate('messages.sentBy', '_id');

  let totalResponseTime = 0;
  let responseCount = 0;
  
  for (const lead of allLeads) {
    if (!lead.messages || lead.messages.length === 0) continue;
    
    const firstOutbound = lead.messages.find(m => {
      if (m.direction !== 'outbound') return false;
      if (!m.sentBy) return false;
      const sentById = typeof m.sentBy === 'object' ? m.sentBy._id?.toString() : m.sentBy.toString();
      return sentById === agentId.toString();
    });
    
    if (firstOutbound && firstOutbound.sentAt && lead.createdAt) {
      try {
        const responseTime = (new Date(firstOutbound.sentAt) - new Date(lead.createdAt)) / 1000;
        if (responseTime > 0 && responseTime < 86400) {
          totalResponseTime += responseTime;
          responseCount++;
        }
      } catch (error) {
        console.error('Error calculating response time:', error);
      }
    }
  }

  const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;
  const responseRate = totalLeads > 0 ? (responseCount / totalLeads) * 100 : 0;

  const convertedLeads = await Lead.find({
    assignedTo: agentId,
    status: LeadStatus.CONVERTED,
    $or: [
      { updatedAt: { $gte: start, $lte: end } },
      { createdAt: { $gte: start, $lte: end }, status: LeadStatus.CONVERTED }
    ]
  }).select('interest updatedAt');

  const revenue = convertedLeads.reduce((sum, lead) => {
    return sum + (lead.interest?.budget?.max || lead.interest?.budget?.min || 0);
  }, 0);

  const conversionRate = totalLeads > 0 
    ? (convertedLeads.length / totalLeads) * 100 
    : 0;

  const allAgents = await Agent.find({ 
    role: { $ne: AgentRole.OWNER },
    isActive: true 
  }).select('_id');

  const teamStats = await Promise.all(
    allAgents.map(async (agent) => {
      const assigned = await Lead.countDocuments({
        assignedTo: agent._id,
        createdAt: { $gte: start, $lte: end }
      });
      const converted = await Lead.countDocuments({
        assignedTo: agent._id,
        status: LeadStatus.CONVERTED,
        updatedAt: { $gte: start, $lte: end }
      });
      return {
        assigned,
        converted,
        conversionRate: assigned > 0 ? (converted / assigned) * 100 : 0
      };
    })
  );

  const teamAvgConversion = teamStats.length > 0
    ? teamStats.reduce((sum, s) => sum + s.conversionRate, 0) / teamStats.length
    : 0;

  const weeklyStats = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(23, 59, 59, 999);

    const leads = await Lead.countDocuments({
      assignedTo: agentId,
      $or: [
        { createdAt: { $gte: date, $lt: nextDate } },
        { updatedAt: { $gte: date, $lt: nextDate }, assignedTo: agentId }
      ]
    });

    const converted = await Lead.countDocuments({
      assignedTo: agentId,
      status: LeadStatus.CONVERTED,
      $or: [
        { updatedAt: { $gte: date, $lt: nextDate } },
        { createdAt: { $gte: date, $lt: nextDate }, status: LeadStatus.CONVERTED }
      ]
    });

    weeklyStats.push({
      date: date.toISOString().split('T')[0],
      leads,
      converted
    });
  }

  let allTimeStats = null;
  if (totalLeads === 0) {
    const allTimeLeads = await Lead.countDocuments({ assignedTo: agentId });
    const allTimeConverted = await Lead.countDocuments({
      assignedTo: agentId,
      status: LeadStatus.CONVERTED
    });
    allTimeStats = {
      totalLeads: allTimeLeads,
      convertedLeads: allTimeConverted,
      conversionRate: allTimeLeads > 0 ? (allTimeConverted / allTimeLeads) * 100 : 0
    };
  }

  console.log(`[Personal Dashboard] Agent: ${req.agent.name} (${agentId}), Period: ${period}, Total Leads: ${totalLeads}, Responded: ${responseCount}, Converted: ${convertedLeads.length}`);
  if (allTimeStats) {
    console.log(`[Personal Dashboard] All-time stats - Total: ${allTimeStats.totalLeads}, Converted: ${allTimeStats.convertedLeads}`);
  }

  res.json({
    success: true,
    data: {
      totalLeads,
      respondedLeads: responseCount,
      responseRate: Math.round(responseRate * 100) / 100,
      avgResponseTime,
      convertedLeads: convertedLeads.length,
      conversionRate: Math.round(conversionRate * 100) / 100,
      revenue,
      teamAvgConversion: Math.round(teamAvgConversion * 100) / 100,
      weeklyStats,
      allTimeStats,
      period: { start, end }
    }
  });
});

export const getResponseTimeAnalytics = asyncHandler(async (req, res) => {
  if (req.agent.role !== AgentRole.MANAGER && req.agent.role !== AgentRole.OWNER) {
    throw new AppError('Unauthorized. Admin access required.', 403);
  }

  const { period = 'month', startDate, endDate } = req.query;
  
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    end = new Date();
    start = new Date();
    if (period === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(start.getMonth() - 1);
    }
  }

  const respondedLeads = await Lead.find({
    'messages.direction': 'outbound',
    createdAt: { $gte: start, $lte: end }
  }).populate('assignedTo', 'name email').populate('messages.sentBy', 'name email');

  let totalResponseTime = 0;
  let responseCount = 0;
  const responseTimeByAgent = {};
  const responseTimeBySource = {};
  const dailyResponseTime = {};

  respondedLeads.forEach(lead => {
    const firstOutbound = lead.messages.find(m => m.direction === 'outbound');
    if (firstOutbound && firstOutbound.sentAt) {
      const responseTime = (firstOutbound.sentAt - lead.createdAt) / 1000;
      totalResponseTime += responseTime;
      responseCount++;

      if (firstOutbound.sentBy) {
        const agentId = firstOutbound.sentBy._id.toString();
        if (!responseTimeByAgent[agentId]) {
          responseTimeByAgent[agentId] = { total: 0, count: 0, name: firstOutbound.sentBy.name };
        }
        responseTimeByAgent[agentId].total += responseTime;
        responseTimeByAgent[agentId].count += 1;
      }

      const source = lead.source;
      if (!responseTimeBySource[source]) {
        responseTimeBySource[source] = { total: 0, count: 0 };
      }
      responseTimeBySource[source].total += responseTime;
      responseTimeBySource[source].count += 1;

      const dateKey = new Date(firstOutbound.sentAt).toISOString().split('T')[0];
      if (!dailyResponseTime[dateKey]) {
        dailyResponseTime[dateKey] = { total: 0, count: 0 };
      }
      dailyResponseTime[dateKey].total += responseTime;
      dailyResponseTime[dateKey].count += 1;
    }
  });

  Object.keys(responseTimeByAgent).forEach(agentId => {
    responseTimeByAgent[agentId].avg = Math.round(
      responseTimeByAgent[agentId].total / responseTimeByAgent[agentId].count
    );
  });

  Object.keys(responseTimeBySource).forEach(source => {
    responseTimeBySource[source].avg = Math.round(
      responseTimeBySource[source].total / responseTimeBySource[source].count
    );
  });

  const responseTimeTrend = Object.keys(dailyResponseTime)
    .sort()
    .map(date => ({
      date,
      avgResponseTime: Math.round(dailyResponseTime[date].total / dailyResponseTime[date].count)
    }));

  const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;

  const convertedLeads = await Lead.find({
    status: LeadStatus.CONVERTED,
    updatedAt: { $gte: start, $lte: end }
  }).populate('messages.sentBy', 'name email');

  const conversionByResponseTime = {
    under_5min: 0,
    under_15min: 0,
    under_30min: 0,
    under_1hour: 0,
    over_1hour: 0
  };

  convertedLeads.forEach(lead => {
    const firstOutbound = lead.messages.find(m => m.direction === 'outbound');
    if (firstOutbound && firstOutbound.sentAt) {
      const responseTime = (firstOutbound.sentAt - lead.createdAt) / 1000 / 60;
      if (responseTime < 5) conversionByResponseTime.under_5min++;
      else if (responseTime < 15) conversionByResponseTime.under_15min++;
      else if (responseTime < 30) conversionByResponseTime.under_30min++;
      else if (responseTime < 60) conversionByResponseTime.under_1hour++;
      else conversionByResponseTime.over_1hour++;
    }
  });

  res.json({
    success: true,
    data: {
      avgResponseTime,
      responseTimeByAgent: Object.values(responseTimeByAgent),
      responseTimeBySource,
      responseTimeTrend,
      conversionByResponseTime,
      period: { start, end }
    }
  });
});

export const exportAnalytics = asyncHandler(async (req, res) => {
  if (req.agent.role !== AgentRole.MANAGER && req.agent.role !== AgentRole.OWNER) {
    throw new AppError('Unauthorized. Admin access required.', 403);
  }

  const { type, format = 'json', startDate, endDate } = req.query;

  if (!type) {
    throw new AppError('Export type is required', 400);
  }

  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    end = new Date();
    start = new Date();
    start.setMonth(start.getMonth() - 1);
  }

  let data = {};

  switch (type) {
    case 'revenue':
      const revenueData = await getRevenueAnalyticsData(start, end);
      data = revenueData;
      break;
    case 'conversion':
      const conversionData = await getConversionAnalyticsData(start, end);
      data = conversionData;
      break;
    case 'agent_performance':
      const performanceData = await getAgentPerformanceData(start, end);
      data = performanceData;
      break;
    default:
      throw new AppError('Invalid export type', 400);
  }

  if (format === 'json') {
    res.json({
      success: true,
      data,
      period: { start, end }
    });
  } else {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_${start.toISOString()}_${end.toISOString()}.csv"`);
    
    const csv = convertToCSV(data, type);
    res.send(csv);
  }
});

async function getRevenueAnalyticsData(start, end) {
  const convertedLeads = await Lead.find({
    status: LeadStatus.CONVERTED,
    updatedAt: { $gte: start, $lte: end }
  }).populate('assignedTo', 'name email');

  return {
    totalRevenue: convertedLeads.reduce((sum, lead) => {
      return sum + (lead.interest?.budget?.max || lead.interest?.budget?.min || 0);
    }, 0),
    leads: convertedLeads.map(lead => ({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      revenue: lead.interest?.budget?.max || lead.interest?.budget?.min || 0,
      agent: lead.assignedTo?.name || 'Unassigned',
      convertedAt: lead.updatedAt
    }))
  };
}

async function getConversionAnalyticsData(start, end) {
  const allLeads = await Lead.find({
    createdAt: { $gte: start, $lte: end }
  }).populate('assignedTo', 'name email');

  return {
    totalLeads: allLeads.length,
    convertedLeads: allLeads.filter(l => l.status === LeadStatus.CONVERTED).length,
    leads: allLeads.map(lead => ({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      tier: lead.tier,
      status: lead.status,
      agent: lead.assignedTo?.name || 'Unassigned',
      createdAt: lead.createdAt,
      convertedAt: lead.status === LeadStatus.CONVERTED ? lead.updatedAt : null
    }))
  };
}

async function getAgentPerformanceData(start, end) {
  const agents = await Agent.find({ 
    role: { $ne: AgentRole.OWNER },
    isActive: true 
  }).select('name email role');

  const performance = await Promise.all(
    agents.map(async (agent) => {
      const assignedLeads = await Lead.countDocuments({
        assignedTo: agent._id,
        createdAt: { $gte: start, $lte: end }
      });

      const convertedLeads = await Lead.find({
        assignedTo: agent._id,
        status: LeadStatus.CONVERTED,
        updatedAt: { $gte: start, $lte: end }
      });

      const revenue = convertedLeads.reduce((sum, lead) => {
        return sum + (lead.interest?.budget?.max || lead.interest?.budget?.min || 0);
      }, 0);

      return {
        agentName: agent.name,
        agentEmail: agent.email,
        role: agent.role,
        assignedLeads,
        convertedLeads: convertedLeads.length,
        conversionRate: assignedLeads > 0 ? (convertedLeads.length / assignedLeads) * 100 : 0,
        revenue
      };
    })
  );

  return { performance };
}

function convertToCSV(data, type) {
  if (type === 'revenue' && data.leads) {
    const headers = ['Name', 'Email', 'Phone', 'Source', 'Revenue', 'Agent', 'Converted At'];
    const rows = data.leads.map(lead => [
      lead.name,
      lead.email || '',
      lead.phone,
      lead.source,
      lead.revenue,
      lead.agent,
      lead.convertedAt ? new Date(lead.convertedAt).toISOString() : ''
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  return JSON.stringify(data, null, 2);
}
