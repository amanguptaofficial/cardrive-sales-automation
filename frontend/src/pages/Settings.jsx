import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../components/layout/AppLayout.jsx';
import { Settings as SettingsIcon, User, Bell, Shield, Key, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import toast from 'react-hot-toast';

const Settings = () => {
  const { agent, refreshAuth } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    newLeadAlerts: true,
    hotLeadNotifications: true,
    emailNotifications: false,
    chatNotifications: true,
    mentionNotifications: true
  });

  useEffect(() => {
    if (agent) {
      setFormData(prev => ({
        ...prev,
        name: agent.name || '',
        phone: agent.phone || ''
      }));
      if (agent.notificationPreferences) {
        setNotificationPrefs({
          newLeadAlerts: agent.notificationPreferences.newLeadAlerts ?? true,
          hotLeadNotifications: agent.notificationPreferences.hotLeadNotifications ?? true,
          emailNotifications: agent.notificationPreferences.emailNotifications ?? false,
          chatNotifications: agent.notificationPreferences.chatNotifications ?? true,
          mentionNotifications: agent.notificationPreferences.mentionNotifications ?? true
        });
      }
    }
  }, [agent]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.patch('/auth/profile', data);
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Profile updated successfully');
      await refreshAuth();
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.patch('/auth/password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update password');
    }
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (preferences) => {
      const response = await api.patch('/auth/notifications', preferences);
      return response.data;
    },
    onSuccess: async () => {
      toast.success('Notification preferences updated successfully');
      await refreshAuth();
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update notification preferences');
    }
  });

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    updateProfileMutation.mutate({
      name: formData.name.trim(),
      phone: formData.phone.trim() || undefined
    });
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });
  };

  const handleNotificationToggle = (key) => {
    const updatedPrefs = {
      ...notificationPrefs,
      [key]: !notificationPrefs[key]
    };
    setNotificationPrefs(updatedPrefs);
    updateNotificationsMutation.mutate({ [key]: updatedPrefs[key] });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-8 h-8 text-accent" />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>

        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'notifications'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'security'
                ? 'border-accent text-accent'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Security
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-accent" />
                <h3 className="font-semibold text-gray-900">Profile Settings</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={agent?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="+91 9876543210"
                />
              </div>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="bg-accent text-white px-6 py-2 rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-accent" />
                <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">New Lead Alerts</p>
                    <p className="text-sm text-gray-600">Get notified when new leads arrive</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.newLeadAlerts}
                    onChange={() => handleNotificationToggle('newLeadAlerts')}
                    disabled={updateNotificationsMutation.isPending}
                    className="w-5 h-5 text-accent rounded focus:ring-2 focus:ring-accent cursor-pointer disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Hot Lead Notifications</p>
                    <p className="text-sm text-gray-600">Alert for high-scoring leads</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.hotLeadNotifications}
                    onChange={() => handleNotificationToggle('hotLeadNotifications')}
                    disabled={updateNotificationsMutation.isPending}
                    className="w-5 h-5 text-accent rounded focus:ring-2 focus:ring-accent cursor-pointer disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Chat Notifications</p>
                    <p className="text-sm text-gray-600">Get notified for new chat messages</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.chatNotifications}
                    onChange={() => handleNotificationToggle('chatNotifications')}
                    disabled={updateNotificationsMutation.isPending}
                    className="w-5 h-5 text-accent rounded focus:ring-2 focus:ring-accent cursor-pointer disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Mention Notifications</p>
                    <p className="text-sm text-gray-600">Get notified when you're mentioned in chats</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.mentionNotifications}
                    onChange={() => handleNotificationToggle('mentionNotifications')}
                    disabled={updateNotificationsMutation.isPending}
                    className="w-5 h-5 text-accent rounded focus:ring-2 focus:ring-accent cursor-pointer disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive email summaries</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.emailNotifications}
                    onChange={() => handleNotificationToggle('emailNotifications')}
                    disabled={updateNotificationsMutation.isPending}
                    className="w-5 h-5 text-accent rounded focus:ring-2 focus:ring-accent cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>
              {updateNotificationsMutation.isPending && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving preferences...
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-accent" />
                <h3 className="font-semibold text-gray-900">Security Settings</h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={updatePasswordMutation.isPending}
                className="bg-accent text-white px-6 py-2 rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updatePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Update Password
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
