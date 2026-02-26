import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';

export const useChats = () => {
  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const response = await api.get('/chat');
      return response.data;
    },
    refetchInterval: 30000,
  });
};

export const useChat = (chatId) => {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const response = await api.get(`/chat/${chatId}`);
      return response.data;
    },
    enabled: !!chatId,
    refetchInterval: 10000,
  });
};

export const useAgents = () => {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await api.get('/chat/agents');
      return response.data;
    },
  });
};

export const useCreateDirectChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      const response = await api.post('/chat/direct', { userId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

export const useCreateGroupChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/chat/group', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ chatId, content, mentions, file }) => {
      const formData = new FormData();
      formData.append('content', content || '');
      if (mentions && mentions.length > 0) {
        formData.append('mentions', JSON.stringify(mentions));
      }
      if (file) {
        formData.append('file', file);
      }

      const response = await api.post(`/chat/${chatId}/message`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

export const useAddMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ chatId, memberIds }) => {
      const response = await api.post(`/chat/${chatId}/members`, { memberIds });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ chatId, memberId }) => {
      const response = await api.delete(`/chat/${chatId}/members/${memberId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};
