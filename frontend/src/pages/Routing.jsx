import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/layout/AppLayout.jsx';
import { Settings, Plus, Edit, Trash2, ToggleLeft, ToggleRight, X, Save } from 'lucide-react';
import api from '../services/api.js';
import toast from 'react-hot-toast';

const Routing = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    priority: 0,
    isActive: true,
    conditions: {
      field: 'score',
      operator: 'gte',
      value: 85
    },
    actions: {
      type: 'assign_agent',
      assignTo: 'senior'
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: async () => {
      const response = await api.get('/rules');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/rules', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      toast.success('Rule created successfully');
      setShowForm(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create rule');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.patch(`/rules/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      toast.success('Rule updated successfully');
      setEditingRule(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update rule');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/rules/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      toast.success('Rule deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete rule');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      const response = await api.patch(`/rules/${id}`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      toast.success('Rule updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update rule');
    },
  });

  const rules = data?.data || [];

  const resetForm = () => {
    setFormData({
      name: '',
      priority: 0,
      isActive: true,
      conditions: {
        field: 'score',
        operator: 'gte',
        value: 85
      },
      actions: {
        type: 'assign_agent',
        assignTo: 'senior'
      }
    });
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name || '',
      priority: rule.priority || 0,
      isActive: rule.isActive !== undefined ? rule.isActive : true,
      conditions: rule.conditions || {
        field: 'score',
        operator: 'gte',
        value: 85
      },
      actions: rule.actions || {
        type: 'assign_agent',
        assignTo: 'senior'
      }
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRule) {
      updateMutation.mutate({ id: editingRule._id || editingRule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggle = (id, currentStatus) => {
    toggleMutation.mutate({ id, isActive: !currentStatus });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-8 h-8 text-accent" />
              Routing Rules
            </h1>
            <p className="text-gray-600 mt-1">Configure automated lead routing</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingRule(null);
              setShowForm(!showForm);
            }}
            className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Rule
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editingRule ? 'Edit Rule' : 'Create New Rule'}</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingRule(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., Hot Lead to Senior Agent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Higher priority rules are evaluated first</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition Field</label>
                  <select
                    value={formData.conditions.field}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      conditions: { ...prev.conditions, field: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="score">Score</option>
                    <option value="tier">Tier</option>
                    <option value="source">Source</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Operator</label>
                  <select
                    value={formData.conditions.operator}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      conditions: { ...prev.conditions, operator: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="gte">Greater than or equal</option>
                    <option value="lte">Less than or equal</option>
                    <option value="eq">Equals</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                  <input
                    type="text"
                    value={formData.conditions.value}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      conditions: { ...prev.conditions, value: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="85"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <select
                  value={formData.actions.type}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    actions: { ...prev.actions, type: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="assign_agent">Assign Agent</option>
                  <option value="start_drip">Start Drip Campaign</option>
                  <option value="notify_manager">Notify Manager</option>
                </select>
              </div>
              {formData.actions.type === 'assign_agent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                  <select
                    value={formData.actions.assignTo}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      actions: { ...prev.actions, assignTo: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="senior">Senior Agent</option>
                    <option value="any">Any Available Agent</option>
                    <option value="round_robin">Round Robin</option>
                  </select>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-accent"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRule(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {editingRule ? 'Update' : 'Create'} Rule
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : rules.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No routing rules configured</h3>
            <p className="text-gray-600">Create your first routing rule to automate lead assignment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule._id || rule.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{rule.name || 'Unnamed Rule'}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        rule.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                        Priority: {rule.priority || 0}
                      </span>
                    </div>
                    {rule.conditions && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Condition:</span> {rule.conditions.field} {rule.conditions.operator} {rule.conditions.value}
                      </p>
                    )}
                    {rule.actions && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Action:</span> {rule.actions.type} {rule.actions.assignTo && `→ ${rule.actions.assignTo}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(rule._id || rule.id, rule.isActive)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                      title={rule.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {rule.isActive ? (
                        <ToggleRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(rule)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule._id || rule.id)}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Routing;
