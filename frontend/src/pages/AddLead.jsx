import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/layout/AppLayout.jsx';
import api from '../services/api.js';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { LeadSource } from '../utils/constants.js';

const AddLead = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: LeadSource.MANUAL,
    interest: {
      make: '',
      model: '',
      variant: '',
      fuelType: '',
      bodyType: '',
      budget: { min: '', max: '' },
      isNew: true,
      financeRequired: false
    },
    firstMessage: '',
    preferredContact: 'whatsapp',
    location: {
      city: '',
      area: '',
      pincode: ''
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/leads', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Lead created successfully');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/dashboard');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create lead');
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('interest.')) {
      const field = name.replace('interest.', '');
      if (field === 'budget.min' || field === 'budget.max') {
        setFormData(prev => ({
          ...prev,
          interest: {
            ...prev.interest,
            budget: {
              ...prev.interest.budget,
              [field === 'budget.min' ? 'min' : 'max']: value ? parseInt(value) : null
            }
          }
        }));
      } else if (field === 'isNew' || field === 'financeRequired') {
        setFormData(prev => ({
          ...prev,
          interest: {
            ...prev.interest,
            [field]: checked
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          interest: {
            ...prev.interest,
            [field]: value
          }
        }));
      }
    } else if (name.startsWith('location.')) {
      const field = name.replace('location.', '');
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const sanitizedData = {
      ...formData,
      email: formData.email || null,
      firstMessage: formData.firstMessage || null,
      interest: {
        ...formData.interest,
        make: formData.interest.make || null,
        model: formData.interest.model || null,
        variant: formData.interest.variant || null,
        fuelType: formData.interest.fuelType || null,
        bodyType: formData.interest.bodyType || null,
        budget: {
          min: formData.interest.budget.min || null,
          max: formData.interest.budget.max || null
        }
      },
      location: {
        city: formData.location.city || null,
        area: formData.location.area || null,
        pincode: formData.location.pincode || null
      }
    };
    
    createMutation.mutate(sanitizedData);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Lead</h1>
            <p className="text-gray-600 mt-1">Create a new lead manually</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value={LeadSource.MANUAL}>Manual</option>
                <option value={LeadSource.WEBSITE}>Website</option>
                <option value={LeadSource.WALKIN}>Walk-in</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Car Interest</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                <input
                  type="text"
                  name="interest.make"
                  value={formData.interest.make}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <input
                  type="text"
                  name="interest.model"
                  value={formData.interest.model}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Min (₹)</label>
                <input
                  type="number"
                  name="interest.budget.min"
                  value={formData.interest.budget.min}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Max (₹)</label>
                <input
                  type="number"
                  name="interest.budget.max"
                  value={formData.interest.budget.max}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                <input
                  type="text"
                  name="location.area"
                  value={formData.location.area}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                <input
                  type="text"
                  name="location.pincode"
                  value={formData.location.pincode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Message</label>
            <textarea
              name="firstMessage"
              value={formData.firstMessage}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 flex items-center gap-2 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default AddLead;
