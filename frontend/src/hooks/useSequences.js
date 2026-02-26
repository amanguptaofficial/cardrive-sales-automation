import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';

export const useSequences = () => {
  return useQuery({
    queryKey: ['sequences'],
    queryFn: async () => {
      const response = await api.get('/sequences');
      return response.data;
    }
  });
};

export const useSequence = (id) => {
  return useQuery({
    queryKey: ['sequence', id],
    queryFn: async () => {
      const response = await api.get(`/sequences/${id}`);
      return response.data;
    },
    enabled: !!id
  });
};

export const useCreateSequence = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/sequences', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
    }
  });
};

export const useUpdateSequence = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/sequences/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      queryClient.invalidateQueries({ queryKey: ['sequence', variables.id] });
    }
  });
};

export const useDeleteSequence = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/sequences/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
    }
  });
};

export const useActivateSequence = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, leadIds }) => {
      const response = await api.post(`/sequences/${id}/activate`, { leadIds });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const usePauseSequence = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/sequences/${id}/pause`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};
