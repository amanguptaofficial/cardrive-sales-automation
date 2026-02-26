import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import { useAIInbox } from '../hooks/useDashboard.js';
import { Bot, Mail, MessageSquare, CheckCircle, X, Send, Edit, Loader2 } from 'lucide-react';
import { formatTimeAgo, getTierColor } from '../utils/constants.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import toast from 'react-hot-toast';

const AIInbox = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useAIInbox({ limit: 50 });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [regeneratingLeadId, setRegeneratingLeadId] = useState(null);
  const [sendingLeadId, setSendingLeadId] = useState(null);

  const sendMutation = useMutation({
    mutationFn: async ({ leadId, messageId, channel }) => {
      setSendingLeadId(leadId);
      const response = await api.post(`/ai/send/${leadId}`, { messageId, channel });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Message sent successfully');
      setSelectedMessage(null);
      setSendingLeadId(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to send message');
      setSendingLeadId(null);
    }
  });

  const regenerateMutation = useMutation({
    mutationFn: async ({ leadId, tone }) => {
      setRegeneratingLeadId(leadId);
      const response = await api.post(`/ai/regen/${leadId}`, { tone });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-inbox'] });
      toast.success('Response regenerated');
      setRegeneratingLeadId(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to regenerate');
      setRegeneratingLeadId(null);
    }
  });

  const leads = data?.data || [];

  const getAIMessages = (lead) => {
    return lead.messages?.filter(m => m.isAI && (m.status === 'draft' || m.status === 'failed')) || [];
  };

  const handleSend = (lead, message) => {
    const leadId = lead._id || lead.id;
    const messageId = message._id || message.id;
    
    if (!leadId) {
      toast.error('Lead ID is missing');
      return;
    }
    
    if (!messageId) {
      toast.error('Message ID is missing. Please regenerate the message.');
      return;
    }
    
    if (sendingLeadId === leadId.toString()) {
      return;
    }
    
    sendMutation.mutate({
      leadId: leadId.toString(),
      messageId: messageId.toString(),
      channel: message.channel
    });
  };

  const handleRegenerate = (lead, tone = 'friendly') => {
    const leadId = lead._id || lead.id;
    
    if (!leadId) {
      toast.error('Lead ID is missing');
      return;
    }
    
    if (regeneratingLeadId === leadId.toString()) {
      return;
    }
    
    regenerateMutation.mutate({
      leadId: leadId.toString(),
      tone
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Bot className="w-8 h-8 text-accent" />
              AI Inbox
            </h1>
            <p className="text-gray-600 mt-1">AI-generated responses awaiting review</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const allMessages = leads.flatMap(lead => 
    getAIMessages(lead).map(msg => ({ lead, message: msg }))
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-8 h-8 text-accent" />
            AI Inbox
          </h1>
          <p className="text-gray-600 mt-1">
            {allMessages.length} AI-generated responses awaiting review
          </p>
        </div>

        {allMessages.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No AI responses pending</h3>
            <p className="text-gray-600">All AI-generated responses have been reviewed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {allMessages.map(({ lead, message }, idx) => (
                <div
                  key={`${lead._id || lead.id}-${message._id || idx}`}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedMessage({ lead, message })}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                      <p className="text-sm text-gray-500">{lead.email || lead.phone}</p>
                      {lead.interest?.model && (
                        <p className="text-xs text-gray-400 mt-1">
                          Interested in: {lead.interest.model}
                        </p>
                      )}
                    </div>
                    {lead.score !== null && lead.score !== undefined && (
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${getTierColor(lead.tier)}`}>
                        {lead.score}
                      </span>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded p-3 mb-3 relative">
                    {regeneratingLeadId === (lead._id || lead.id)?.toString() ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-3 bg-gray-300 rounded w-full"></div>
                        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                        <div className="h-3 bg-gray-300 rounded w-4/6"></div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 line-clamp-3">{message.content}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="w-3 h-3" />
                      {message.channel}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSend(lead, message);
                        }}
                        disabled={sendingLeadId === (lead._id || lead.id)?.toString() || regeneratingLeadId === (lead._id || lead.id)?.toString()}
                        className="px-3 py-1.5 bg-accent text-white text-xs rounded hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-opacity"
                      >
                        {sendingLeadId === (lead._id || lead.id)?.toString() ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            Send
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegenerate(lead);
                        }}
                        disabled={regeneratingLeadId === (lead._id || lead.id)?.toString() || sendingLeadId === (lead._id || lead.id)?.toString()}
                        className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-opacity"
                      >
                        {regeneratingLeadId === (lead._id || lead.id)?.toString() ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <Edit className="w-3 h-3" />
                            Regenerate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedMessage && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Review Message</h3>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Lead</p>
                    <p className="text-gray-900">{selectedMessage.lead.name}</p>
                    <p className="text-sm text-gray-500">{selectedMessage.lead.email || selectedMessage.lead.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Channel</p>
                    <p className="text-gray-900 capitalize">{selectedMessage.message.channel}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Message</p>
                    <div className="bg-gray-50 rounded p-4 relative min-h-[100px]">
                      {regeneratingLeadId === (selectedMessage.lead._id || selectedMessage.lead.id)?.toString() ? (
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 bg-gray-300 rounded w-full"></div>
                          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                          <div className="h-4 bg-gray-300 rounded w-4/6"></div>
                          <div className="h-4 bg-gray-300 rounded w-3/6"></div>
                        </div>
                      ) : (
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message.content}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSend(selectedMessage.lead, selectedMessage.message)}
                      disabled={sendMutation.isPending || sendingLeadId === (selectedMessage.lead._id || selectedMessage.lead.id)?.toString() || regeneratingLeadId === (selectedMessage.lead._id || selectedMessage.lead.id)?.toString()}
                      className="flex-1 bg-accent text-white py-2 rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
                    >
                      {sendingLeadId === (selectedMessage.lead._id || selectedMessage.lead.id)?.toString() ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Now
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRegenerate(selectedMessage.lead)}
                      disabled={regenerateMutation.isPending || regeneratingLeadId === (selectedMessage.lead._id || selectedMessage.lead.id)?.toString() || sendingLeadId === (selectedMessage.lead._id || selectedMessage.lead.id)?.toString()}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-opacity"
                    >
                      {regeneratingLeadId === (selectedMessage.lead._id || selectedMessage.lead.id)?.toString() ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4" />
                          Regenerate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AIInbox;
