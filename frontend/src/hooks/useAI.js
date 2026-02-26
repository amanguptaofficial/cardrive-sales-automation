import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';

export const useGenerateResponse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leadId) => {
      const response = await api.post(`/ai/generate/${leadId}`);
      return response.data;
    },
    onSuccess: (_, leadId) => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['ai-inbox'] });
    },
  });
};

export const useSendAIResponse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, messageId, channel }) => {
      const response = await api.post(`/ai/send/${leadId}`, {
        messageId,
        channel,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useRegenerateResponse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, tone = 'friendly' }) => {
      const response = await api.post(`/ai/regen/${leadId}`, { tone });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['ai-inbox'] });
    },
  });
};

export const useScoreLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leadId) => {
      const response = await api.post(`/ai/score/${leadId}`);
      return response.data;
    },
    onSuccess: (_, leadId) => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};
