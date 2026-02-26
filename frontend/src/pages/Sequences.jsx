import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout.jsx';
import { Calendar, Plus, Play, Pause, Edit, Trash2, X } from 'lucide-react';
import { 
  useSequences, 
  useCreateSequence, 
  useUpdateSequence, 
  useDeleteSequence,
  useActivateSequence,
  usePauseSequence
} from '../hooks/useSequences.js';
import toast from 'react-hot-toast';

const Sequences = () => {
  const { data, isLoading } = useSequences();
  const createMutation = useCreateSequence();
  const updateMutation = useUpdateSequence();
  const deleteMutation = useDeleteSequence();
  const activateMutation = useActivateSequence();
  const pauseMutation = usePauseSequence();

  const [showForm, setShowForm] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetTier: 'cold',
    messages: [{ day: 1, content: '', subject: '' }]
  });

  const sequences = data?.data || [];
  const activeSequences = sequences.filter(s => s.isActive).length;

  const handleCreate = () => {
    setEditingSequence(null);
    setFormData({
      name: '',
      description: '',
      targetTier: 'cold',
      messages: [{ day: 1, content: '', subject: '' }]
    });
    setShowForm(true);
  };

  const handleEdit = (sequence) => {
    setEditingSequence(sequence);
    setFormData({
      name: sequence.name,
      description: sequence.description || '',
      targetTier: sequence.targetTier || 'cold',
      messages: sequence.messages.length > 0 
        ? sequence.messages 
        : [{ day: 1, content: '', subject: '' }]
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || formData.messages.length === 0) {
      toast.error('Name and at least one message are required');
      return;
    }

    try {
      if (editingSequence) {
        await updateMutation.mutateAsync({
          id: editingSequence._id,
          data: formData
        });
        toast.success('Sequence updated successfully');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Sequence created successfully');
      }
      setShowForm(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save sequence');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sequence?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Sequence deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete sequence');
    }
  };

  const handleActivate = async (id) => {
    try {
      const result = await activateMutation.mutateAsync({ id });
      toast.success(result.message || 'Sequence activated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to activate sequence');
    }
  };

  const handlePause = async (id) => {
    try {
      const result = await pauseMutation.mutateAsync(id);
      toast.success(result.message || 'Sequence paused');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to pause sequence');
    }
  };

  const addMessage = () => {
    const lastDay = formData.messages[formData.messages.length - 1]?.day || 0;
    setFormData({
      ...formData,
      messages: [...formData.messages, { day: lastDay + 1, content: '', subject: '' }]
    });
  };

  const removeMessage = (index) => {
    setFormData({
      ...formData,
      messages: formData.messages.filter((_, i) => i !== index)
    });
  };

  const updateMessage = (index, field, value) => {
    const newMessages = [...formData.messages];
    newMessages[index] = { ...newMessages[index], [field]: value };
    setFormData({ ...formData, messages: newMessages });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading sequences...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-accent" />
              Sequences
            </h1>
            <p className="text-gray-600 mt-1">
              Automated email and message sequences • {activeSequences} active
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Sequence
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingSequence ? 'Edit Sequence' : 'Create New Sequence'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sequence Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Tier
                </label>
                <select
                  value={formData.targetTier}
                  onChange={(e) => setFormData({ ...formData, targetTier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                  <option value="all">All</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Messages *
                </label>
                {formData.messages.map((msg, index) => (
                  <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Message {index + 1}</span>
                      {formData.messages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMessage(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <input
                        type="number"
                        placeholder="Day"
                        value={msg.day}
                        onChange={(e) => updateMessage(index, 'day', parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Subject (optional)"
                        value={msg.subject || ''}
                        onChange={(e) => updateMessage(index, 'subject', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <textarea
                      placeholder="Message content *"
                      value={msg.content}
                      onChange={(e) => updateMessage(index, 'content', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
                      rows="3"
                      required
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMessage}
                  className="text-accent hover:text-accent/80 text-sm font-medium"
                >
                  + Add Message
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingSequence
                    ? 'Update Sequence'
                    : 'Create Sequence'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {sequences.length === 0 && !showForm ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No sequences created</h3>
            <p className="text-gray-600 mb-4">Create your first automated sequence</p>
            <button
              onClick={handleCreate}
              className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90"
            >
              Create Sequence
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sequences.map((sequence) => (
              <div key={sequence._id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{sequence.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      sequence.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {sequence.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {sequence.description || `${sequence.messages?.length || 0} messages for ${sequence.targetTier} leads`}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-500">
                    {sequence.enrolledLeads || 0} leads enrolled
                  </span>
                </div>
                <div className="flex gap-2">
                  {sequence.isActive ? (
                    <button
                      onClick={() => handlePause(sequence._id)}
                      disabled={pauseMutation.isPending}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(sequence._id)}
                      disabled={activateMutation.isPending}
                      className="flex-1 px-3 py-2 bg-accent text-white rounded hover:bg-accent/90 text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(sequence)}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(sequence._id)}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 text-sm disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Sequences;
