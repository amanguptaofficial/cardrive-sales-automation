import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';

export const useLeads = (filters = {}) => {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      const queryString = params.toString();
      const response = await api.get(`/leads${queryString ? `?${queryString}` : ''}`);
      return response.data;
    },
    refetchInterval: 30000,
  });
};

export const useLead = (id) => {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const response = await api.get(`/leads/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/leads', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.patch(`/leads/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, content, channel }) => {
      const response = await api.post(`/leads/${leadId}/messages`, {
        content,
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

export const useLeadNotes = (leadId) => {
  return useQuery({
    queryKey: ['lead', leadId, 'notes'],
    queryFn: async () => {
      const response = await api.get(`/leads/${leadId}/notes`);
      return response.data.data;
    },
    enabled: !!leadId,
  });
};

export const useAddNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, text }) => {
      const response = await api.post(`/leads/${leadId}/notes`, { text });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, noteId, text }) => {
      const response = await api.put(`/leads/${leadId}/notes/${noteId}`, { text });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, noteId }) => {
      const response = await api.delete(`/leads/${leadId}/notes/${noteId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId, 'notes'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
    },
  });
};

export const useQuickAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, action, data }) => {
      const response = await api.post(`/leads/${leadId}/quick-action`, { action, data });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useBulkUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadIds, updates }) => {
      const response = await api.post('/leads/bulk-update', { leadIds, updates });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};
