import { useState } from 'react';
import { X, Mail, Phone, MapPin, Car, DollarSign, Calendar, User, MessageSquare, TrendingUp, Tag, FileText, CheckCircle, Clock, Plus, Edit, Trash2, Zap, Loader2, CheckCircle2, XCircle, Calendar as CalendarIcon, UserPlus } from 'lucide-react';
import { useLead, useLeadNotes, useAddNote, useUpdateNote, useDeleteNote, useQuickAction } from '../../hooks/useLeads.js';
import { useAgents } from '../../hooks/useChat.js';
import { getTierColor, getStatusColor, formatTimeAgo, LeadSource } from '../../utils/constants.js';
import toast from 'react-hot-toast';
import ConfirmationModal from '../common/ConfirmationModal.jsx';

const LeadDetailModal = ({ leadId, onClose }) => {
  const { data, isLoading } = useLead(leadId);
  const { data: notesData } = useLeadNotes(leadId);
  const addNoteMutation = useAddNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const quickActionMutation = useQuickAction();
  const { data: agentsData } = useAgents();
  const agents = agentsData?.data || [];
  
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [showTestDriveModal, setShowTestDriveModal] = useState(false);
  const [testDriveDate, setTestDriveDate] = useState('');
  const [testDriveCar, setTestDriveCar] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showDeleteNoteModal, setShowDeleteNoteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  
  const lead = data?.data;
  const notes = notesData || [];

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast.error('Note text is required');
      return;
    }
    try {
      await addNoteMutation.mutateAsync({ leadId, text: noteText });
      setNoteText('');
      setShowAddNote(false);
      toast.success('Note added successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add note');
    }
  };

  const handleUpdateNote = async (noteId) => {
    if (!editNoteText.trim()) {
      toast.error('Note text is required');
      return;
    }
    try {
      await updateNoteMutation.mutateAsync({ leadId, noteId, text: editNoteText });
      setEditingNoteId(null);
      setEditNoteText('');
      toast.success('Note updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    setNoteToDelete(noteId);
    setShowDeleteNoteModal(true);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    try {
      await deleteNoteMutation.mutateAsync({ leadId, noteId: noteToDelete });
      toast.success('Note deleted successfully');
      setShowDeleteNoteModal(false);
      setNoteToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete note');
    }
  };

  const handleQuickAction = async (action, data = {}) => {
    try {
      await quickActionMutation.mutateAsync({ leadId, action, data });
      toast.success('Action completed successfully');
      if (action === 'schedule_test_drive') {
        setShowTestDriveModal(false);
        setTestDriveDate('');
        setTestDriveCar('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to perform action');
    }
  };

  const handleScheduleTestDrive = () => {
    if (!testDriveDate) {
      toast.error('Please select a date');
      return;
    }
    handleQuickAction('schedule_test_drive', { 
      date: testDriveDate,
      carAssigned: testDriveCar || null
    });
  };

  const handleAssignLead = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }
    try {
      await quickActionMutation.mutateAsync({ 
        leadId, 
        action: 'reassign', 
        data: { agentId: selectedAgent } 
      });
      toast.success('Lead assigned successfully');
      setShowAssignModal(false);
      setSelectedAgent('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign lead');
    }
  };

  if (!leadId) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Lead Not Found</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600">The lead you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{lead.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatTimeAgo(lead.createdAt)} • Last updated {formatTimeAgo(lead.updatedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </h3>
              <div className="space-y-3">
                {lead.email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{lead.phone}</span>
                  </div>
                )}
                {lead.preferredContact && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="text-sm capitalize">Preferred: {lead.preferredContact}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Lead Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status?.replace('_', ' ') || 'New'}
                  </span>
                </div>
                {lead.score !== null && lead.score !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded text-sm font-bold border ${getTierColor(lead.tier)}`}>
                      Score: {lead.score} ({lead.tier?.toUpperCase() || 'N/A'})
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag className="w-4 h-4" />
                  <span>Source: {lead.source || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Assigned to: {lead.assignedTo?.name || 'Unassigned'}</span>
                    {lead.assignedTo?.role && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {lead.assignedTo.role === 'senior_agent' ? 'Senior' : lead.assignedTo.role === 'manager' ? 'Manager' : lead.assignedTo.role === 'owner' ? 'Owner' : 'Agent'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAgent(lead.assignedTo?._id || lead.assignedTo?.id || '');
                      setShowAssignModal(true);
                    }}
                    className="text-xs px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    {lead.assignedTo ? 'Reassign' : 'Assign'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Car Interest */}
          {lead.interest && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Car Interest
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.interest.make && (
                    <div>
                      <span className="text-xs text-gray-500">Make</span>
                      <p className="text-sm font-medium text-gray-900">{lead.interest.make}</p>
                    </div>
                  )}
                  {lead.interest.model && (
                    <div>
                      <span className="text-xs text-gray-500">Model</span>
                      <p className="text-sm font-medium text-gray-900">{lead.interest.model}</p>
                    </div>
                  )}
                  {lead.interest.variant && (
                    <div>
                      <span className="text-xs text-gray-500">Variant</span>
                      <p className="text-sm font-medium text-gray-900">{lead.interest.variant}</p>
                    </div>
                  )}
                  {lead.interest.fuelType && (
                    <div>
                      <span className="text-xs text-gray-500">Fuel Type</span>
                      <p className="text-sm font-medium text-gray-900">{lead.interest.fuelType}</p>
                    </div>
                  )}
                  {lead.interest.bodyType && (
                    <div>
                      <span className="text-xs text-gray-500">Body Type</span>
                      <p className="text-sm font-medium text-gray-900">{lead.interest.bodyType}</p>
                    </div>
                  )}
                  {lead.interest.isNew !== undefined && (
                    <div>
                      <span className="text-xs text-gray-500">Type</span>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.interest.isNew ? 'New Car' : 'Used Car'}
                      </p>
                    </div>
                  )}
                  {lead.interest.budget && (
                    <div className="md:col-span-2">
                      <span className="text-xs text-gray-500">Budget</span>
                      <div className="flex items-center gap-2 mt-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900">
                          {lead.interest.budget.min ? `₹${lead.interest.budget.min.toLocaleString()}` : 'Not specified'} - 
                          {lead.interest.budget.max ? ` ₹${lead.interest.budget.max.toLocaleString()}` : ' Not specified'}
                        </p>
                      </div>
                    </div>
                  )}
                  {lead.interest.financeRequired !== undefined && (
                    <div>
                      <span className="text-xs text-gray-500">Finance Required</span>
                      <p className="text-sm font-medium text-gray-900">
                        {lead.interest.financeRequired ? 'Yes' : 'No'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          {lead.location && (lead.location.city || lead.location.area || lead.location.pincode) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {lead.location.city && (
                    <div>
                      <span className="text-xs text-gray-500">City</span>
                      <p className="text-sm font-medium text-gray-900">{lead.location.city}</p>
                    </div>
                  )}
                  {lead.location.area && (
                    <div>
                      <span className="text-xs text-gray-500">Area</span>
                      <p className="text-sm font-medium text-gray-900">{lead.location.area}</p>
                    </div>
                  )}
                  {lead.location.pincode && (
                    <div>
                      <span className="text-xs text-gray-500">Pincode</span>
                      <p className="text-sm font-medium text-gray-900">{lead.location.pincode}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* First Message */}
          {lead.firstMessage && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Initial Message
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.firstMessage}</p>
              </div>
            </div>
          )}

          {/* AI Signals & Sentiment */}
          {(lead.aiSignals?.length > 0 || lead.sentiment) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                AI Analysis
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {lead.sentiment && (
                  <div>
                    <span className="text-xs text-gray-500">Sentiment</span>
                    <p className="text-sm font-medium text-gray-900 capitalize">{lead.sentiment}</p>
                  </div>
                )}
                {lead.aiSignals?.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500">Signals</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {lead.aiSignals.map((signal, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Score History */}
          {lead.scoreHistory?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Score History
              </h3>
              <div className="space-y-2">
                {lead.scoreHistory.map((entry, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${getTierColor(entry.tier)}`}>
                          {entry.score}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{entry.tier}</span>
                      </div>
                      {entry.reason && (
                        <p className="text-xs text-gray-600 mt-1">{entry.reason}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(entry.scoredAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {lead.tags?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {lead.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Test Drive */}
          {lead.testDrive && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Test Drive
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {lead.testDrive.scheduled ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {lead.testDrive.scheduled ? 'Scheduled' : 'Not Scheduled'}
                    </span>
                  </div>
                  {lead.testDrive.date && (
                    <div className="text-sm text-gray-600">
                      Date: {new Date(lead.testDrive.date).toLocaleDateString()}
                    </div>
                  )}
                  {lead.testDrive.carAssigned && (
                    <div className="text-sm text-gray-600">
                      Car: {lead.testDrive.carAssigned}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notes ({notes.length})
              </h3>
              {!showAddNote && (
                <button
                  onClick={() => setShowAddNote(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Note
                </button>
              )}
            </div>
            
            {showAddNote && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter your note..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent mb-3"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNote}
                    disabled={addNoteMutation.isPending}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm flex items-center gap-2"
                  >
                    {addNoteMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Note
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddNote(false);
                      setNoteText('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {notes.length === 0 && !showAddNote && (
                <p className="text-sm text-gray-500 text-center py-4">No notes yet. Add your first note above.</p>
              )}
              {notes.map((note) => (
                <div key={note._id || note.id} className="bg-gray-50 rounded-lg p-4">
                  {editingNoteId === (note._id || note.id) ? (
                    <div>
                      <textarea
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent mb-2"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateNote(note._id || note.id)}
                          disabled={updateNoteMutation.isPending}
                          className="px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditNoteText('');
                          }}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {note.addedBy?.name || 'Unknown'} • {formatTimeAgo(note.addedAt)}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingNoteId(note._id || note.id);
                              setEditNoteText(note.text);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Edit note"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note._id || note.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.text}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          {lead.messages?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Messages ({lead.messages.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {lead.messages.map((message, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 capitalize">
                          {message.direction === 'outbound' ? 'Outbound' : 'Inbound'}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {message.channel}
                        </span>
                        {message.isAI && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                            AI
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(message.sentAt || message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</p>
                    {message.status && (
                      <span className={`text-xs mt-2 inline-block px-2 py-0.5 rounded ${
                        message.status === 'sent' ? 'bg-green-100 text-green-800' :
                        message.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        message.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {message.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Quick Actions</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickAction('mark_qualified')}
              disabled={quickActionMutation.isPending || lead.status === 'qualified'}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Qualified
            </button>
            <button
              onClick={() => setShowTestDriveModal(true)}
              disabled={quickActionMutation.isPending}
              className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              Schedule Test Drive
            </button>
            <button
              onClick={() => handleQuickAction('mark_converted')}
              disabled={quickActionMutation.isPending || lead.status === 'converted'}
              className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Mark Converted
            </button>
            <button
              onClick={() => {
                setConfirmAction(() => () => handleQuickAction('mark_lost'));
                setShowConfirmModal(true);
              }}
              disabled={quickActionMutation.isPending || lead.status === 'lost'}
              className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Mark Lost
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Test Drive Schedule Modal */}
      {showTestDriveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-accent" />
                Schedule Test Drive
              </h3>
              <button
                onClick={() => {
                  setShowTestDriveModal(false);
                  setTestDriveDate('');
                  setTestDriveCar('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Drive Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={testDriveDate}
                  onChange={(e) => setTestDriveDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select date and time for the test drive
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Car Model (Optional)
                </label>
                <input
                  type="text"
                  value={testDriveCar}
                  onChange={(e) => setTestDriveCar(e.target.value)}
                  placeholder="e.g., Tata Punch 2022"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Specify which car model for test drive
                </p>
              </div>

              {lead?.interest?.model && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    <strong>Lead's Interest:</strong> {lead.interest.make} {lead.interest.model}
                    {lead.interest.variant && ` - ${lead.interest.variant}`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowTestDriveModal(false);
                  setTestDriveDate('');
                  setTestDriveCar('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleTestDrive}
                disabled={quickActionMutation.isPending || !testDriveDate}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {quickActionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4" />
                    Schedule Test Drive
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Mark Lost */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction();
            setShowConfirmModal(false);
            setConfirmAction(null);
          }
        }}
        title="Mark Lead as Lost"
        message="Are you sure you want to mark this lead as lost? This action cannot be undone."
        confirmText="Yes, Mark as Lost"
        cancelText="Cancel"
        type="danger"
        isLoading={quickActionMutation.isPending}
      />

      {/* Confirmation Modal for Delete Note */}
      <ConfirmationModal
        isOpen={showDeleteNoteModal}
        onClose={() => {
          setShowDeleteNoteModal(false);
          setNoteToDelete(null);
        }}
        onConfirm={confirmDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteNoteMutation.isPending}
      />

      {/* Assign Lead Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Assign Lead to Agent</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Agent
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Choose an agent...</option>
                {/* Senior Agents First */}
                <optgroup label="👔 Senior Agents & Managers">
                  {agents
                    .filter(a => a.role === 'senior_agent' || a.role === 'manager' || a.role === 'owner')
                    .map(agent => (
                      <option key={agent._id || agent.id} value={agent._id || agent.id}>
                        {agent.name} ({agent.email}) - {agent.role === 'senior_agent' ? 'Senior Agent' : agent.role === 'manager' ? 'Manager' : 'Owner'}
                      </option>
                    ))}
                </optgroup>
                {/* Regular Agents */}
                <optgroup label="👤 Agents">
                  {agents
                    .filter(a => a.role === 'agent' || (!a.role))
                    .map(agent => (
                      <option key={agent._id || agent.id} value={agent._id || agent.id}>
                        {agent.name} ({agent.email})
                      </option>
                    ))}
                </optgroup>
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
                onClick={handleAssignLead}
                disabled={quickActionMutation.isPending || !selectedAgent}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
              >
                {quickActionMutation.isPending ? (
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
    </div>
  );
};

export default LeadDetailModal;
