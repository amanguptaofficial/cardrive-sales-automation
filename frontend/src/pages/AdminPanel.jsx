import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api.js';
import { UserCheck, X, Check, Trash2, Mail, Phone, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users', filter],
    queryFn: async () => {
      const endpoint = filter === 'pending' ? '/admin/users/pending' : '/admin/users';
      const response = await api.get(endpoint);
      return response.data;
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      const response = await api.patch(`/admin/users/${userId}/verify`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    },
  });

  const users = usersData?.data || [];

  const handleVerify = (userId, isVerified) => {
    if (!userId) {
      toast.error('Invalid user ID');
      return;
    }
    verifyMutation.mutate({ userId, data: { isVerified } });
  };

  const handleActivate = (userId, isActive) => {
    if (!userId) {
      toast.error('Invalid user ID');
      return;
    }
    verifyMutation.mutate({ userId, data: { isActive } });
  };

  const handleDelete = (userId) => {
    if (!userId) {
      toast.error('Invalid user ID');
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(userId);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-accent" />
              Admin Panel
            </h1>
            <p className="text-gray-600 mt-1">Manage users and permissions</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-accent text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-accent text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending Verification
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => {
                    const userId = user.id || user._id;
                    return (
                    <tr key={userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded capitalize">
                          {user.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                              user.isVerified
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {user.isVerified ? (
                              <>
                                <Check className="w-3 h-3" />
                                Verified
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3" />
                                Pending
                              </>
                            )}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                              user.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {!user.isVerified && (
                            <button
                              onClick={() => handleVerify(userId, true)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Verify User"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {user.isVerified && (
                            <button
                              onClick={() => handleActivate(userId, !user.isActive)}
                              className={`p-2 rounded transition-colors ${
                                user.isActive
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {user.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(userId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminPanel;
