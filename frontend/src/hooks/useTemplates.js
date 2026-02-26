import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';

export const useTemplates = (filters = {}) => {
  return useQuery({
    queryKey: ['templates', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.channel) params.append('channel', filters.channel);
      if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic);
      
      const { data } = await api.get(`/templates?${params.toString()}`);
      return data.data;
    }
  });
};

export const useTemplate = (id) => {
  return useQuery({
    queryKey: ['template', id],
    queryFn: async () => {
      const { data } = await api.get(`/templates/${id}`);
      return data.data;
    },
    enabled: !!id
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (templateData) => {
      const { data } = await api.post('/templates', templateData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }) => {
      const { data } = await api.put(`/templates/${id}`, updateData);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', variables.id] });
    }
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/templates/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });
};

export const useUseTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/templates/${id}/use`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });
};
