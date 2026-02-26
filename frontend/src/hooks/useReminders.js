import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';

export const useReminders = (filters = {}) => {
  return useQuery({
    queryKey: ['reminders', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const { data } = await api.get(`/reminders?${params.toString()}`);
      return data.data;
    }
  });
};

export const useUpcomingReminders = (limit = 10) => {
  return useQuery({
    queryKey: ['reminders', 'upcoming', limit],
    queryFn: async () => {
      const { data } = await api.get(`/reminders/upcoming?limit=${limit}`);
      return data.data;
    }
  });
};

export const useReminder = (id) => {
  return useQuery({
    queryKey: ['reminder', id],
    queryFn: async () => {
      const { data } = await api.get(`/reminders/${id}`);
      return data.data;
    },
    enabled: !!id
  });
};

export const useCreateReminder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reminderData) => {
      const { data } = await api.post('/reminders', reminderData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });
};

export const useUpdateReminder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }) => {
      const { data } = await api.put(`/reminders/${id}`, updateData);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminder', variables.id] });
    }
  });
};

export const useCompleteReminder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/reminders/${id}/complete`);
      return data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminder', id] });
    }
  });
};

export const useSnoozeReminder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, hours }) => {
      const { data } = await api.post(`/reminders/${id}/snooze`, { hours });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminder', variables.id] });
    }
  });
};

export const useDeleteReminder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/reminders/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });
};
