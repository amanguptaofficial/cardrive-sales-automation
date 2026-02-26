import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout.jsx';
import { Clock, Plus, CheckCircle2, XCircle, Bell, Calendar, Loader2, Edit, Trash2, Phone, Car } from 'lucide-react';
import { useReminders, useUpcomingReminders, useCreateReminder, useCompleteReminder, useSnoozeReminder, useDeleteReminder } from '../hooks/useReminders.js';
import { useLeads } from '../hooks/useLeads.js';
import toast from 'react-hot-toast';
import { formatTimeAgo } from '../utils/constants.js';
import ConfirmationModal from '../components/common/ConfirmationModal.jsx';
import InputModal from '../components/common/InputModal.jsx';

const Reminders = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    leadId: '',
    title: '',
    description: '',
    reminderDate: '',
    type: 'follow_up',
    priority: 'medium'
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState(null);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [reminderToSnooze, setReminderToSnooze] = useState(null);

  const { data: reminders, isLoading } = useReminders({ status: 'pending' });
  const { data: upcomingReminders } = useUpcomingReminders(5);
  const { data: leadsData } = useLeads({ limit: 100 });
  const createMutation = useCreateReminder();
  const completeMutation = useCompleteReminder();
  const snoozeMutation = useSnoozeReminder();
  const deleteMutation = useDeleteReminder();

  const leads = leadsData?.data || [];
  const reminderList = reminders || [];

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!formData.leadId || !formData.reminderDate) {
      toast.error('Lead and reminder date are required');
      return;
    }
    try {
      await createMutation.mutateAsync(formData);
      setShowAddModal(false);
      setFormData({
        leadId: '',
        title: '',
        description: '',
        reminderDate: '',
        type: 'follow_up',
        priority: 'medium'
      });
      toast.success('Reminder created successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create reminder');
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeMutation.mutateAsync(id);
      toast.success('Reminder marked as completed');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to complete reminder');
    }
  };

  const handleSnooze = async (id, hours = 24) => {
    try {
      await snoozeMutation.mutateAsync({ id, hours });
      toast.success(`Reminder snoozed for ${hours} hours`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to snooze reminder');
    }
  };

  const handleDelete = async (id) => {
    setReminderToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!reminderToDelete) return;
    try {
      await deleteMutation.mutateAsync(reminderToDelete);
      toast.success('Reminder deleted successfully');
      setShowDeleteModal(false);
      setReminderToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete reminder');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'call': return Phone;
      case 'meeting': return Calendar;
      case 'test_drive': return Car;
      default: return Bell;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-8 h-8 text-accent" />
              Reminders
            </h1>
            <p className="text-gray-600 mt-1">Manage your follow-ups and tasks</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Reminder
          </button>
        </div>

        {upcomingReminders && upcomingReminders.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Upcoming Reminders (Next 24 Hours)
            </h3>
            <div className="space-y-2">
              {upcomingReminders.map((reminder) => {
                const TypeIcon = getTypeIcon(reminder.type);
                return (
                  <div key={reminder._id} className="bg-white rounded p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TypeIcon className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-900">{reminder.title}</p>
                        <p className="text-sm text-gray-600">
                          {reminder.leadId?.name || 'Unknown Lead'} • {new Date(reminder.reminderDate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleComplete(reminder._id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Mark as completed"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleSnooze(reminder._id, 24)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Snooze for 24 hours"
                      >
                        <Clock className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200">
          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
              <p className="text-gray-600">Loading reminders...</p>
            </div>
          ) : reminderList.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reminders</h3>
              <p className="text-gray-600 mb-4">Create your first reminder to get started</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90"
              >
                Add Reminder
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reminderList.map((reminder) => {
                const TypeIcon = getTypeIcon(reminder.type);
                const isOverdue = new Date(reminder.reminderDate) < new Date() && reminder.status === 'pending';
                return (
                  <div key={reminder._id} className={`p-4 hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-2 rounded-lg ${getPriorityColor(reminder.priority)}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{reminder.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(reminder.priority)}`}>
                              {reminder.priority}
                            </span>
                          </div>
                          {reminder.description && (
                            <p className="text-sm text-gray-600 mb-2">{reminder.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Lead: {reminder.leadId?.name || 'Unknown'}</span>
                            <span>•</span>
                            <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                              {isOverdue ? 'Overdue: ' : ''}{new Date(reminder.reminderDate).toLocaleString()}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{reminder.type.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleComplete(reminder._id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Mark as completed"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setReminderToSnooze(reminder._id);
                            setShowSnoozeModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Snooze reminder"
                        >
                          <Clock className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(reminder._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete reminder"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create Reminder</h2>
            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead</label>
                <select
                  value={formData.leadId}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, leadId: e.target.value }));
                    const lead = leads.find(l => (l._id || l.id) === e.target.value);
                    if (lead) {
                      setFormData(prev => ({
                        ...prev,
                        title: prev.title || `Follow-up for ${lead.name}`
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                >
                  <option value="">Select a lead</option>
                  {leads.map(lead => (
                    <option key={lead._id || lead.id} value={lead._id || lead.id}>
                      {lead.name} - {lead.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminderDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="follow_up">Follow Up</option>
                    <option value="call">Call</option>
                    <option value="meeting">Meeting</option>
                    <option value="test_drive">Test Drive</option>
                    <option value="quote">Quote</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      leadId: '',
                      title: '',
                      description: '',
                      reminderDate: '',
                      type: 'follow_up',
                      priority: 'medium'
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Reminder
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setReminderToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Reminder"
        message="Are you sure you want to delete this reminder? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Snooze Input Modal */}
      <InputModal
        isOpen={showSnoozeModal}
        onClose={() => {
          setShowSnoozeModal(false);
          setReminderToSnooze(null);
        }}
        onSubmit={(hours) => {
          if (reminderToSnooze) {
            handleSnooze(reminderToSnooze, parseInt(hours) || 24);
            setShowSnoozeModal(false);
            setReminderToSnooze(null);
          }
        }}
        title="Snooze Reminder"
        label="Snooze for how many hours?"
        placeholder="24"
        type="number"
        defaultValue="24"
        submitText="Snooze"
        cancelText="Cancel"
        isLoading={snoozeMutation.isPending}
        required={true}
        validationMessage="Please enter number of hours"
      />
    </AppLayout>
  );
};

export default Reminders;
