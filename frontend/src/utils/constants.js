import { env } from '../config/env.js';

export const API_URL = env.API_URL;
export const SOCKET_URL = env.SOCKET_URL;

export const LeadTier = {
  HOT: 'hot',
  WARM: 'warm',
  COLD: 'cold'
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

export const LeadSource = {
  WEBSITE: 'website',
  CARDEKHO: 'cardekho',
  CARWALE: 'carwale',
  OLX: 'olx',
  FACEBOOK: 'facebook',
  MANUAL: 'manual',
  WALKIN: 'walkin'
};

export const MessageChannel = {
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  SMS: 'sms',
  CALL: 'call'
};

export const getTierColor = (tier) => {
  switch (tier) {
    case LeadTier.HOT:
      return 'bg-red-100 text-red-700 border-red-300';
    case LeadTier.WARM:
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case LeadTier.COLD:
      return 'bg-blue-100 text-blue-700 border-blue-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case LeadStatus.NEW:
      return 'bg-gray-100 text-gray-700';
    case LeadStatus.AI_REPLIED:
      return 'bg-blue-100 text-blue-700';
    case LeadStatus.QUALIFIED:
      return 'bg-green-100 text-green-700';
    case LeadStatus.TEST_DRIVE_SCHEDULED:
      return 'bg-purple-100 text-purple-700';
    case LeadStatus.CONVERTED:
      return 'bg-green-200 text-green-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};


export const formatTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};
