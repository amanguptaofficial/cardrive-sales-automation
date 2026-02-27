import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLeads, useBulkUpdate } from '../../hooks/useLeads.js';
import { useAgents } from '../../hooks/useChat.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getTierColor, getStatusColor, formatTimeAgo, LeadSource, LeadStatus, LeadTier } from '../../utils/constants.js';
import { Sparkles, Globe, Car, Truck, MessageCircle, Mail, Smartphone, Flame, Filter, X, CheckSquare, Square, UserPlus, Tag, Trash2, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../common/ConfirmationModal.jsx';

const LeadTable = ({ onLeadClick, isCompact = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { agent } = useAuth();
  const [filters, setFilters] = useState({
    tier: '',
    status: '',
    source: '',
    search: searchParams.get('search') || ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const bulkUpdateMutation = useBulkUpdate();
  const { data: agentsData } = useAgents();
  const agents = agentsData?.data || [];
  const isAdmin = agent?.role === 'manager' || agent?.role === 'owner';

  useEffect(() => {
    const search = searchParams.get('search');
    const page = searchParams.get('page');
    if (search) {
      setFilters(prev => ({ ...prev, search }));
    }
    if (page) {
      setCurrentPage(parseInt(page));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isCompact) {
      setCurrentPage(1);
    }
  }, [filters.tier, filters.status, filters.source, filters.search, isCompact]);

  const queryParams = {
    limit: isCompact ? 50 : pageSize,
    page: isCompact ? 1 : currentPage
  };

  if (filters.tier) queryParams.tier = filters.tier;
  if (filters.status) queryParams.status = filters.status;
  if (filters.source) queryParams.source = filters.source;
  if (filters.search) queryParams.search = filters.search;

  const { data, isLoading } = useLeads(queryParams);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      tier: '',
      status: '',
      source: '',
      search: ''
    });
  };

  const hasActiveFilters = filters.tier || filters.status || filters.source || filters.search;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(new Set(leads.map(l => l._id || l.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const handleSelectLead = (leadId) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  useEffect(() => {
    if (selectedLeads.size > 0) {
      setShowBulkActions(true);
    } else {
      setShowBulkActions(false);
    }
  }, [selectedLeads.size]);

  const handleBulkAssign = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }
    try {
      await bulkUpdateMutation.mutateAsync({
        leadIds: Array.from(selectedLeads),
        updates: { assignedTo: selectedAgent }
      });
      toast.success(`${selectedLeads.size} leads assigned successfully`);
      setSelectedLeads(new Set());
      setShowAssignModal(false);
      setSelectedAgent('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign leads');
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }
    try {
      await bulkUpdateMutation.mutateAsync({
        leadIds: Array.from(selectedLeads),
        updates: { status: selectedStatus }
      });
      toast.success(`${selectedLeads.size} leads updated successfully`);
      setSelectedLeads(new Set());
      setShowStatusModal(false);
      setSelectedStatus('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update leads');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkUpdateMutation.mutateAsync({
        leadIds: Array.from(selectedLeads),
        updates: { status: LeadStatus.LOST }
      });
      toast.success(`${selectedLeads.size} leads marked as lost`);
      setSelectedLeads(new Set());
      setShowDeleteModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update leads');
    }
  };

  const handleBulkExport = () => {
    const selectedLeadsData = leads.filter(l => selectedLeads.has(l._id || l.id));
    const csv = [
      ['Name', 'Email', 'Phone', 'Source', 'Status', 'Score', 'Tier', 'Model', 'Created At'].join(','),
      ...selectedLeadsData.map(lead => [
        lead.name || '',
        lead.email || '',
        lead.phone || '',
        lead.source || '',
        lead.status || '',
        lead.score || '',
        lead.tier || '',
        lead.interest?.model || '',
        new Date(lead.createdAt).toLocaleDateString()
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${selectedLeads.size} leads exported successfully`);
    setSelectedLeads(new Set());
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const allLeads = data?.data || [];
  const leads = isCompact && !showAll ? allLeads.slice(0, 8) : allLeads;
  const pagination = data?.pagination || {};
  const totalPages = pagination.pages || 1;
  const totalLeads = pagination.total || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Live Lead Queue
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            AI-scored • real-time updates via Socket.io
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <Filter className="w-4 h-4" />
            Filter
            {hasActiveFilters && (
              <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">
                {[filters.tier, filters.status, filters.source, filters.search].filter(Boolean).length}
              </span>
            )}
          </button>
          {isCompact ? (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-accent hover:text-accent/80 font-medium"
            >
              {showAll ? 'Show Less' : `View All (${allLeads.length}) →`}
            </button>
          ) : (
            <button
              onClick={() => navigate('/leads')}
              className="text-sm text-accent hover:text-accent/80 font-medium"
            >
              View All →
            </button>
          )}
        </div>
      </div>

      {isAdmin && showBulkActions && selectedLeads.size > 0 && (
        <div className="bg-accent/10 border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedLeads(new Set())}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear selection
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAssignModal(true)}
              disabled={bulkUpdateMutation.isPending}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Assign
            </button>
            <button
              onClick={() => setShowStatusModal(true)}
              disabled={bulkUpdateMutation.isPending}
              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm flex items-center gap-2"
            >
              <Tag className="w-4 h-4" />
              Update Status
            </button>
            <button
              onClick={handleBulkExport}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={bulkUpdateMutation.isPending}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Mark Lost
            </button>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Name, email, phone..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tier</label>
              <select
                value={filters.tier}
                onChange={(e) => handleFilterChange('tier', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All Tiers</option>
                <option value={LeadTier.HOT}>Hot</option>
                <option value={LeadTier.WARM}>Warm</option>
                <option value={LeadTier.COLD}>Cold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All Status</option>
                <option value={LeadStatus.NEW}>New</option>
                <option value={LeadStatus.AI_REPLIED}>AI Replied</option>
                <option value={LeadStatus.AGENT_REPLIED}>Agent Replied</option>
                <option value={LeadStatus.QUALIFIED}>Qualified</option>
                <option value={LeadStatus.CONVERTED}>Converted</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">All Sources</option>
                <option value={LeadSource.WEBSITE}>Website</option>
                <option value={LeadSource.CARDEKHO}>CarDekho</option>
                <option value={LeadSource.CARWALE}>CarWale</option>
                <option value={LeadSource.MANUAL}>Manual</option>
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {isAdmin && (
                <th className="px-4 py-3 text-left w-12">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {selectedLeads.size === leads.length && leads.length > 0 ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">LEAD</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CAR INTEREST</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CHANNEL</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SCORE</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STATUS</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">TIME</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                  No leads found
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const leadId = lead._id || lead.id;
                const isSelected = selectedLeads.has(leadId);
                return (
                  <tr
                    key={leadId}
                    onClick={(e) => {
                      if (isAdmin && e.target.type !== 'checkbox') {
                        onLeadClick?.(lead);
                      }
                    }}
                    className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''} ${onLeadClick ? 'cursor-pointer' : ''}`}
                  >
                    {isAdmin && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleSelectLead(leadId)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-accent" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{lead.name}</div>
                      <div className="text-sm text-gray-500">{lead.email || lead.phone}</div>
                    </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">
                      {lead.interest?.model || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {lead.preferredContact === 'whatsapp' && <MessageCircle className="w-5 h-5 text-green-600" title="WhatsApp" />}
                    {lead.preferredContact === 'email' && <Mail className="w-5 h-5 text-blue-600" title="Email" />}
                    {lead.preferredContact === 'call' && <Smartphone className="w-5 h-5 text-gray-600" title="Call" />}
                    {!lead.preferredContact && (
                      <>
                        {lead.source === LeadSource.WEBSITE && <Globe className="w-5 h-5 text-gray-600" title="Website" />}
                        {lead.source === LeadSource.CARDEKHO && <Car className="w-5 h-5 text-gray-600" title="CarDekho" />}
                        {lead.source === LeadSource.CARWALE && <Truck className="w-5 h-5 text-gray-600" title="CarWale" />}
                        {!lead.source && <Smartphone className="w-5 h-5 text-gray-600" title="Unknown" />}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.score !== null && lead.score !== undefined ? (
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${getTierColor(lead.tier)}`}>
                          {lead.score}
                        </span>
                        {lead.score >= 85 && <Flame className="w-4 h-4 text-red-500" />}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(lead.status)}`}>
                      • {lead.status?.replace('_', ' ') || 'New'}
                    </span>
                  </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatTimeAgo(lead.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isCompact && totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalLeads)} of {totalLeads} leads
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="ml-4 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newPage = Math.max(1, currentPage - 1);
                setCurrentPage(newPage);
                navigate(`/leads?page=${newPage}${filters.search ? `&search=${filters.search}` : ''}`);
              }}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      navigate(`/leads?page=${pageNum}${filters.search ? `&search=${filters.search}` : ''}`);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-accent text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                const newPage = Math.min(totalPages, currentPage + 1);
                setCurrentPage(newPage);
                navigate(`/leads?page=${newPage}${filters.search ? `&search=${filters.search}` : ''}`);
              }}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Assign Leads to Agent</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Agent ({selectedLeads.size} leads)
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Choose an agent...</option>
                {agents.map(agent => (
                  <option key={agent._id || agent.id} value={agent._id || agent.id}>
                    {agent.name} ({agent.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedAgent('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={bulkUpdateMutation.isPending || !selectedAgent}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
              >
                {bulkUpdateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Update Lead Status</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Status ({selectedLeads.size} leads)
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Choose a status...</option>
                <option value={LeadStatus.NEW}>New</option>
                <option value={LeadStatus.AI_REPLIED}>AI Replied</option>
                <option value={LeadStatus.AGENT_REPLIED}>Agent Replied</option>
                <option value={LeadStatus.QUALIFIED}>Qualified</option>
                <option value={LeadStatus.TEST_DRIVE_SCHEDULED}>Test Drive Scheduled</option>
                <option value={LeadStatus.CONVERTED}>Converted</option>
                <option value={LeadStatus.LOST}>Lost</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedStatus('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={bulkUpdateMutation.isPending || !selectedStatus}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
              >
                {bulkUpdateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Mark Leads as Lost"
        message={`Are you sure you want to mark ${selectedLeads.size} lead${selectedLeads.size > 1 ? 's' : ''} as lost? This action cannot be undone.`}
        confirmText="Mark as Lost"
        cancelText="Cancel"
        type="danger"
        isLoading={bulkUpdateMutation.isPending}
      />
    </div>
  );
};

export default LeadTable;
