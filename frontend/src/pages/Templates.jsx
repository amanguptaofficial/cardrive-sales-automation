import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout.jsx';
import { FileText, Plus, Edit, Trash2, Search, Filter, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useUseTemplate } from '../hooks/useTemplates.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/common/ConfirmationModal.jsx';

const Templates = () => {
  const { agent } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    content: '',
    channel: 'all',
    variables: [],
    isPublic: false
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const { data: templates, isLoading } = useTemplates({ category: categoryFilter || undefined });
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();
  const useTemplateMutation = useUseTemplate();

  const filteredTemplates = templates?.filter(template => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return template.name.toLowerCase().includes(query) || 
           template.content.toLowerCase().includes(query);
  }) || [];

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.content) {
      toast.error('Name and content are required');
      return;
    }
    try {
      await createMutation.mutateAsync(formData);
      setShowAddModal(false);
      setFormData({
        name: '',
        category: 'other',
        content: '',
        channel: 'all',
        variables: [],
        isPublic: false
      });
      toast.success('Template created successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create template');
    }
  };

  const handleUpdateTemplate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.content) {
      toast.error('Name and content are required');
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: editingTemplate._id, ...formData });
      setEditingTemplate(null);
      setFormData({
        name: '',
        category: 'other',
        content: '',
        channel: 'all',
        variables: [],
        isPublic: false
      });
      toast.success('Template updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    setTemplateToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      await deleteMutation.mutateAsync(templateToDelete);
      toast.success('Template deleted successfully');
      setShowDeleteModal(false);
      setTemplateToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete template');
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      await useTemplateMutation.mutateAsync(template._id);
      navigator.clipboard.writeText(template.content);
      toast.success('Template copied to clipboard!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to use template');
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content,
      channel: template.channel,
      variables: template.variables || [],
      isPublic: template.isPublic || false
    });
    setShowAddModal(true);
  };

  const getCategoryColor = (category) => {
    const colors = {
      greeting: 'bg-blue-100 text-blue-700',
      follow_up: 'bg-green-100 text-green-700',
      quote: 'bg-purple-100 text-purple-700',
      test_drive: 'bg-orange-100 text-orange-700',
      closing: 'bg-red-100 text-red-700',
      objection_handling: 'bg-yellow-100 text-yellow-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors.other;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-8 h-8 text-accent" />
              Message Templates
            </h1>
            <p className="text-gray-600 mt-1">Create and manage quick reply templates</p>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setFormData({
                name: '',
                category: 'other',
                content: '',
                channel: 'all',
                variables: [],
                isPublic: false
              });
              setShowAddModal(true);
            }}
            className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Template
          </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent appearance-none bg-white"
            >
              <option value="">All Categories</option>
              <option value="greeting">Greeting</option>
              <option value="follow_up">Follow Up</option>
              <option value="quote">Quote</option>
              <option value="test_drive">Test Drive</option>
              <option value="closing">Closing</option>
              <option value="objection_handling">Objection Handling</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
            <p className="text-gray-600">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">Create your first template to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90"
            >
              Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div key={template._id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(template.category)}`}>
                        {template.category.replace('_', ' ')}
                      </span>
                      {template.isPublic && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{template.content}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Used {template.usageCount || 0} times</span>
                  <span>{template.channel === 'all' ? 'All channels' : template.channel}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 text-sm flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Use
                  </button>
                  {(template.createdBy?._id === agent?.id || template.createdBy?._id === agent?._id) && (
                    <>
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title="Edit template"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </h2>
            <form onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g., Welcome Message"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="greeting">Greeting</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="quote">Quote</option>
                    <option value="test_drive">Test Drive</option>
                    <option value="closing">Closing</option>
                    <option value="objection_handling">Objection Handling</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="all">All Channels</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  rows={8}
                  placeholder="Enter your template message. You can use variables like {name}, {model}, etc."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {'{name}'}, {'{model}'}, {'{make}'}, {'{budget}'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="w-4 h-4 text-accent rounded"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make this template public (visible to all agents)
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTemplate(null);
                    setFormData({
                      name: '',
                      category: 'other',
                      content: '',
                      channel: 'all',
                      variables: [],
                      isPublic: false
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingTemplate ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {editingTemplate ? 'Update Template' : 'Create Template'}
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
          setTemplateToDelete(null);
        }}
        onConfirm={confirmDeleteTemplate}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteMutation.isPending}
      />
    </AppLayout>
  );
};

export default Templates;
