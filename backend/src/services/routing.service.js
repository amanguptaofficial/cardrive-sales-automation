import Agent from '../models/Agent.js';
import { AgentRole, RoutingConditionOperator, RoutingActionType, RoutingAssignTo, LeadTier } from '../enums/index.js';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export const evaluateRules = async (lead, rules) => {
  const sortedRules = rules
    .filter(rule => rule.isActive)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (matchesCondition(lead, rule.condition)) {
      await executeAction(lead, rule.action);
      return rule;
    }
  }
  return null;
};

const matchesCondition = (lead, condition) => {
  const { field, operator, value } = condition;

  switch (field) {
    case 'score':
      return compareScore(lead.score, operator, value);
    case 'tier':
      return lead.tier === value;
    case 'source':
      return lead.source === value;
    case 'noReplyHours':
      const hoursSinceCreation = (Date.now() - new Date(lead.createdAt)) / (1000 * 60 * 60);
      return compareScore(hoursSinceCreation, operator, value);
    default:
      return false;
  }
};

const compareScore = (actual, operator, expected) => {
  switch (operator) {
    case RoutingConditionOperator.GTE:
      return actual >= expected;
    case RoutingConditionOperator.LTE:
      return actual <= expected;
    case RoutingConditionOperator.EQ:
      return actual === expected;
    case RoutingConditionOperator.BETWEEN:
      return actual >= expected.min && actual <= expected.max;
    default:
      return false;
  }
};

const executeAction = async (lead, action) => {
  switch (action.type) {
    case RoutingActionType.ASSIGN_AGENT:
      await assignAgent(lead, action.assignTo);
      break;
    case RoutingActionType.START_DRIP:
      lead.drip = {
        isActive: true,
        sequence: action.dripSequence,
        step: 0,
        nextAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      await lead.save();
      break;
    case RoutingActionType.NOTIFY_MANAGER:
      logger.info(`Manager notification triggered for lead ${lead._id}`);
      break;
    case RoutingActionType.SEND_MESSAGE:
      logger.info(`Auto-send message triggered for lead ${lead._id}`);
      break;
  }
};

const assignAgent = async (lead, assignTo) => {
  let agent = null;

  if (assignTo === RoutingAssignTo.SENIOR) {
    agent = await Agent.findOne({
      role: { $in: [AgentRole.SENIOR_AGENT, AgentRole.MANAGER] },
      isAvailable: true
    });
  } else if (assignTo === RoutingAssignTo.ROUND_ROBIN) {
    agent = await getRoundRobinAgent();
  } else {
    agent = await Agent.findOne({ isAvailable: true });
  }

  if (agent) {
    lead.assignedTo = agent._id;
    await lead.save();
    logger.info(`Lead ${lead._id} assigned to agent ${agent.name}`);
  }
};

const getRoundRobinAgent = async () => {
  const key = 'round_robin_index';
  const currentIndex = await redis.get(key);
  const index = currentIndex ? parseInt(currentIndex) : 0;

  const agents = await Agent.find({ isAvailable: true }).sort({ createdAt: 1 });
  if (agents.length === 0) return null;

  const nextIndex = (index + 1) % agents.length;
  await redis.set(key, nextIndex.toString());

  return agents[index % agents.length];
};
