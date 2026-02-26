import { useState, useEffect, useRef } from 'react';
import { useGenerateResponse, useSendAIResponse, useRegenerateResponse } from '../../hooks/useAI.js';
import { useLead, useLeads } from '../../hooks/useLeads.js';
import { Sparkles, RefreshCw, Send, Edit, Mail, Search, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AIComposer = ({ leadId }) => {
  const [selectedLeadId, setSelectedLeadId] = useState(leadId);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { data: leadData, isLoading: isLoadingLead } = useLead(selectedLeadId);
  const { data: leadsData, isLoading: isLoadingLeads } = useLeads({ 
    search: searchQuery || undefined, 
    limit: 20 
  });
  const generateMutation = useGenerateResponse();
  const sendMutation = useSendAIResponse();
  const regenMutation = useRegenerateResponse();

  useEffect(() => {
    if (leadId) {
      setSelectedLeadId(leadId);
    }
  }, [leadId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLeadDropdown(false);
      }
    };

    if (showLeadDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLeadDropdown]);

  const lead = leadData?.data;
  const leads = leadsData?.data || [];
  const lastMessage = lead?.messages?.[lead.messages.length - 1];
  const isAIDraft = lastMessage?.isAI && lastMessage?.status === 'draft';

  const filteredLeads = searchQuery
    ? leads.filter(l => 
        l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.phone?.includes(searchQuery)
      )
    : leads; // Show all leads if no search query

  const handleGenerate = async () => {
    if (!selectedLeadId) {
      toast.error('Please select a lead');
      return;
    }
    try {
      await generateMutation.mutateAsync(selectedLeadId);
      toast.success('AI response generated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate response');
    }
  };

  const handleSend = async (channel) => {
    if (!lastMessage?._id) {
      toast.error('No message to send');
      return;
    }
    try {
      await sendMutation.mutateAsync({
        leadId: selectedLeadId,
        messageId: lastMessage._id,
        channel,
      });
      toast.success('Message sent successfully');
      setSelectedLeadId(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    }
  };

  const handleRegen = async () => {
    if (!selectedLeadId) return;
    try {
      await regenMutation.mutateAsync({ leadId: selectedLeadId });
      toast.success('Response regenerated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to regenerate');
    }
  };

  const handleLeadSelect = (lead) => {
    setSelectedLeadId(lead._id || lead.id);
    setSearchQuery('');
    setShowLeadDropdown(false);
    toast.success(`Selected: ${lead.name}`);
  };

  const handleClearLead = () => {
    setSelectedLeadId(null);
    setSearchQuery('');
    setShowLeadDropdown(true);
  };

  if (!selectedLeadId) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-accent" />
          AI Response Composer
        </h3>
        
        {/* Lead Search/Selection */}
        <div className="relative mb-4" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowLeadDropdown(true);
              }}
              onFocus={() => {
                setShowLeadDropdown(true);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowLeadDropdown(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {showLeadDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
              {isLoadingLeads ? (
                <div className="p-4 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-accent mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Searching leads...</p>
                </div>
              ) : filteredLeads.length > 0 ? (
                <>
                  <div className="p-2 bg-gray-50 border-b border-gray-200 sticky top-0">
                    <p className="text-xs font-medium text-gray-600">
                      {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead._id || lead.id}
                      onClick={() => handleLeadSelect(lead)}
                      className="p-4 hover:bg-accent/5 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">{lead.name}</div>
                          <div className="text-sm text-gray-600 mb-1">
                            {lead.email && <span>{lead.email}</span>}
                            {lead.email && lead.phone && <span className="mx-2">•</span>}
                            {lead.phone && <span>{lead.phone}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            {lead.interest?.model && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {lead.interest.model}
                              </span>
                            )}
                            {lead.score !== null && lead.score !== undefined && (
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                lead.score >= 85 ? 'bg-red-100 text-red-700' : 
                                lead.score >= 55 ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-gray-100 text-gray-700'
                              }`}>
                                Score: {lead.score}
                              </span>
                            )}
                            {lead.status && (
                              <span className="text-xs text-gray-500 capitalize">
                                {lead.status.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-3">
                          {lead.preferredContact === 'whatsapp' && (
                            <span className="text-green-600 text-lg">💬</span>
                          )}
                          {lead.preferredContact === 'email' && (
                            <span className="text-blue-600 text-lg">📧</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : searchQuery.length >= 2 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500 mb-2">No leads found</p>
                  <p className="text-xs text-gray-400">Try a different search term</p>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500 mb-2">Start typing to search leads</p>
                  <p className="text-xs text-gray-400">Search by name, email, or phone number</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <p className="text-gray-500 text-sm">Search and select a lead to compose a response</p>
      </div>
    );
  }

  if (isLoadingLead) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            AI Response Composer
          </h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">GPT-4o</span>
        </div>

        {/* Lead Selection/Info */}
        <div className="mb-4">
          <div className="relative">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{lead.name}</div>
                  <div className="text-sm text-gray-500">{lead.email || lead.phone}</div>
                </div>
                <button
                  onClick={handleClearLead}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Change lead"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded text-xs font-bold border ${
                  lead.score >= 85 ? 'bg-red-100 text-red-700 border-red-300' : 
                  lead.score >= 55 ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 
                  'bg-blue-100 text-blue-700 border-blue-300'
                }`}>
                  Score {lead.score || 'N/A'}
                </span>
                {lead.score >= 85 && <span>🔥</span>}
                <span className="text-xs text-gray-500">• {lead.interest?.model || 'N/A'}</span>
                <span className="text-xs text-gray-500 capitalize">• {lead.preferredContact || 'whatsapp'}</span>
              </div>
            </div>
          </div>
        </div>

      {isAIDraft ? (
        <div className="mb-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3 relative min-h-[100px]">
            {regenMutation.isPending ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 rounded w-4/6"></div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{lastMessage.content}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {lastMessage.tags?.map((tag, i) => (
              <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRegen}
              disabled={regenMutation.isPending || sendMutation.isPending}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-opacity"
            >
              {regenMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </>
              )}
            </button>
            <button
              onClick={() => handleSend('whatsapp')}
              disabled={sendMutation.isPending || regenMutation.isPending}
              className="flex-1 bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send WhatsApp
                </>
              )}
            </button>
            <button
              onClick={() => handleSend('email')}
              disabled={sendMutation.isPending || regenMutation.isPending}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              title="Send Email"
            >
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || regenMutation.isPending}
            className="w-full bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating AI Response...
              </>
            ) : (
              'Generate AI Response'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AIComposer;
