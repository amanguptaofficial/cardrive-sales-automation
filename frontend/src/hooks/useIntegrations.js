import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';

export const useIntegrations = () => {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data } = await api.get('/integrations');
      return data.data;
    }
  });
};

export const useIntegration = (id) => {
  return useQuery({
    queryKey: ['integration', id],
    queryFn: async () => {
      const { data } = await api.get(`/integrations/${id}`);
      return data.data;
    },
    enabled: !!id
  });
};

export const useCreateIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (integrationData) => {
      const { data } = await api.post('/integrations', integrationData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    }
  });
};

export const useUpdateIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }) => {
      const { data } = await api.put(`/integrations/${id}`, updateData);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['integration', variables.id] });
    }
  });
};

export const useConnectIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, config }) => {
      const { data } = await api.post(`/integrations/${id}/connect`, { config });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['integration', variables.id] });
    }
  });
};

export const useDisconnectIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/integrations/${id}/disconnect`);
      return data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['integration', id] });
    }
  });
};

export const useRefreshIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/integrations/${id}/refresh`);
      return data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['integration', id] });
    }
  });
};

export const useDeleteIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/integrations/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    }
  });
};

export const useWebhookUrl = (id) => {
  return useQuery({
    queryKey: ['webhook-url', id],
    queryFn: async () => {
      const { data } = await api.get(`/integrations/${id}/webhook-url`);
      return data.data;
    },
    enabled: !!id
  });
};
