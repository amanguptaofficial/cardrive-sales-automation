import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
    refetchInterval: 30000,
  });
};

export const useFunnel = () => {
  return useQuery({
    queryKey: ['dashboard', 'funnel'],
    queryFn: async () => {
      const response = await api.get('/dashboard/funnel');
      return response.data;
    },
    refetchInterval: 30000,
  });
};

export const useActivity = () => {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: async () => {
      const response = await api.get('/dashboard/activity');
      return response.data;
    },
    refetchInterval: 30000,
  });
};

export const useVolume = (days = 7) => {
  return useQuery({
    queryKey: ['dashboard', 'volume', days],
    queryFn: async () => {
      const response = await api.get(`/dashboard/volume?days=${days}`);
      return response.data;
    },
    refetchInterval: 30000,
  });
};

export const useAIInbox = (filters = {}) => {
  return useQuery({
    queryKey: ['ai-inbox', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await api.get(`/leads/ai-inbox/list?${params.toString()}`);
      return response.data;
    },
    refetchInterval: 30000,
  });
};

export const usePipeline = () => {
  return useQuery({
    queryKey: ['pipeline', 'stats'],
    queryFn: async () => {
      const response = await api.get('/leads/pipeline/stats');
      return response.data;
    },
    refetchInterval: 30000,
  });
};

export const useAIScoring = () => {
  return useQuery({
    queryKey: ['ai-scoring', 'stats'],
    queryFn: async () => {
      const response = await api.get('/leads/scoring/stats');
      return response.data;
    },
    refetchInterval: 30000,
  });
};
