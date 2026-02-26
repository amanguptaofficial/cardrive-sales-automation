import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../services/socket.js';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = getSocket();
    setSocket(socketInstance);

    socketInstance.on('lead:new', (lead) => {
      queryClient.setQueriesData({ queryKey: ['leads'] }, (old) => {
        if (!old) return { data: [lead], pagination: {} };
        return {
          ...old,
          data: [lead, ...(old.data || [])],
        };
      });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`New lead: ${lead.name} - ${lead.interest?.model || 'Vehicle'}`);
    });

    socketInstance.on('lead:scored', ({ leadId, score, tier }) => {
      queryClient.setQueriesData({ queryKey: ['leads'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).map((l) =>
            (l.id === leadId || l._id === leadId || l._id?.toString() === leadId?.toString())
              ? { ...l, score, tier }
              : l
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    });

    socketInstance.on('lead:updated', ({ leadId, updates }) => {
      queryClient.setQueryData(['leads'], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).map((l) =>
            (l.id === leadId || l._id === leadId || l._id?.toString() === leadId?.toString())
              ? { ...l, ...updates }
              : l
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    });

    socketInstance.on('lead:ai-replied', ({ leadId, message, sent, draft }) => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['ai-inbox'] });
      if (draft) {
        toast.success(`AI response generated - ready for review`);
      } else if (sent) {
        toast.success(`AI response sent to lead`);
      }
    });

    socketInstance.on('chat:notification', (data) => {
      const currentPath = window.location.pathname;
      if (currentPath !== '/chat') {
        const messagePreview = data.message.content?.substring(0, 50) || 'New message';
        toast.success(
          `${data.isMention ? '🔔 ' : ''}${data.chatName}: ${messagePreview}`,
          {
            duration: 5000,
            icon: data.isMention ? '🔔' : '💬',
          }
        );
      }
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    });

    socketInstance.on('chat:mention', (data) => {
      toast.success(`🔔 You were mentioned by ${data.mentionedBy} in ${data.chatName}`, {
        duration: 6000,
        icon: '🔔',
      });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat', data.chatId] });
    });

    return () => {
      socketInstance.off('lead:new');
      socketInstance.off('lead:scored');
      socketInstance.off('lead:updated');
      socketInstance.off('lead:ai-replied');
      socketInstance.off('chat:notification');
      socketInstance.off('chat:mention');
    };
  }, [queryClient]);

  return socket;
};
