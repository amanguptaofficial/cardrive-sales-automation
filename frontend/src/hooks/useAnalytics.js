import { useQuery } from '@tanstack/react-query';
import api from '../services/api.js';

export const useRevenueAnalytics = (period = 'month', startDate, endDate, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'revenue', period, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const { data } = await api.get(`/analytics/revenue?${params.toString()}`);
      return data.data;
    },
    enabled: enabled
  });
};

export const useConversionAnalytics = (period = 'month', startDate, endDate, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'conversion', period, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const { data } = await api.get(`/analytics/conversion?${params.toString()}`);
      return data.data;
    },
    enabled: enabled
  });
};

export const useAgentPerformance = (period = 'month', startDate, endDate, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'agent-performance', period, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const { data } = await api.get(`/analytics/agent-performance?${params.toString()}`);
      return data.data;
    },
    enabled: enabled
  });
};

export const useResponseTimeAnalytics = (period = 'month', startDate, endDate, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'response-time', period, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const { data } = await api.get(`/analytics/response-time?${params.toString()}`);
      return data.data;
    },
    enabled: enabled
  });
};

export const usePersonalDashboard = (period = 'month', startDate, endDate) => {
  return useQuery({
    queryKey: ['analytics', 'personal-dashboard', period, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/analytics/personal-dashboard?${params.toString()}`);
      console.log('[Personal Dashboard] API Response:', response.data);
      return response.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};
