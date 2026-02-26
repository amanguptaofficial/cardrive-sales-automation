export const LeadSource = {
  WEBSITE: 'website',
  CARDEKHO: 'cardekho',
  CARWALE: 'carwale',
  OLX: 'olx',
  FACEBOOK: 'facebook',
  MANUAL: 'manual',
  WALKIN: 'walkin'
};

export const LeadStatus = {
  NEW: 'new',
  AI_REPLIED: 'ai_replied',
  AGENT_REPLIED: 'agent_replied',
  QUALIFIED: 'qualified',
  TEST_DRIVE_SCHEDULED: 'test_drive_scheduled',
  NEGOTIATION: 'negotiation',
  CONVERTED: 'converted',
  LOST: 'lost',
  NURTURE: 'nurture'
};

export const LeadTier = {
  HOT: 'hot',
  WARM: 'warm',
  COLD: 'cold'
};

export const FuelType = {
  PETROL: 'petrol',
  DIESEL: 'diesel',
  ELECTRIC: 'electric',
  HYBRID: 'hybrid',
  CNG: 'cng'
};

export const MessageDirection = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound'
};

export const MessageChannel = {
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  SMS: 'sms',
  CALL: 'call'
};

export const MessageStatus = {
  DRAFT: 'draft',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

export const AgentRole = {
  AGENT: 'agent',
  SENIOR_AGENT: 'senior_agent',
  MANAGER: 'manager',
  OWNER: 'owner'
};

export const PreferredContact = {
  WHATSAPP: 'whatsapp',
  CALL: 'call',
  EMAIL: 'email'
};

export const Sentiment = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative'
};

export const RoutingConditionField = {
  SCORE: 'score',
  TIER: 'tier',
  SOURCE: 'source',
  NO_REPLY_HOURS: 'noReplyHours'
};

export const RoutingConditionOperator = {
  GTE: 'gte',
  LTE: 'lte',
  EQ: 'eq',
  BETWEEN: 'between'
};

export const RoutingActionType = {
  ASSIGN_AGENT: 'assign_agent',
  START_DRIP: 'start_drip',
  NOTIFY_MANAGER: 'notify_manager',
  SEND_MESSAGE: 'send_message'
};

export const RoutingAssignTo = {
  SENIOR: 'senior',
  ANY: 'any',
  ROUND_ROBIN: 'round_robin'
};

export const DripSequence = {
  WARM_3TOUCH: 'warm-3touch',
  COLD_14DAY: 'cold-14day'
};
