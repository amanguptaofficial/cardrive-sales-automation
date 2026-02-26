import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout.jsx';
import { Link2, Check, X, RefreshCw, Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
  useRefreshIntegration,
  useWebhookUrl
} from '../hooks/useIntegrations.js';

const Integrations = () => {
  const { data: integrations, isLoading } = useIntegrations();
  const connectMutation = useConnectIntegration();
  const disconnectMutation = useDisconnectIntegration();
  const refreshMutation = useRefreshIntegration();
  const [refreshing, setRefreshing] = useState({});

  const handleRefresh = async (integration) => {
    setRefreshing(prev => ({ ...prev, [integration._id]: true }));
    try {
      await refreshMutation.mutateAsync(integration._id);
      toast.success(`${integration.name} stats refreshed`);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to refresh');
    } finally {
      setRefreshing(prev => ({ ...prev, [integration._id]: false }));
    }
  };

  const handleConnect = async (integration) => {
    try {
      await connectMutation.mutateAsync({ id: integration._id });
      toast.success(`${integration.name} connected successfully`);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to connect');
    }
  };

  const handleDisconnect = async (integration) => {
    if (!window.confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      return;
    }
    try {
      await disconnectMutation.mutateAsync(integration._id);
      toast.success(`${integration.name} disconnected successfully`);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to disconnect');
    }
  };

  const copyWebhookUrl = (integration) => {
    const baseUrl = window.location.origin.replace(':5173', ':5003');
    const fullUrl = `${baseUrl}${integration.webhookUrl}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Webhook URL copied to clipboard');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
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
              <Link2 className="w-8 h-8 text-accent" />
              Integrations
            </h1>
            <p className="text-gray-600 mt-1">Manage your lead source integrations</p>
          </div>
        </div>

        {!integrations || integrations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Link2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No integrations found</h3>
            <p className="text-gray-600 mb-6">Run the seed script to initialize default integrations</p>
            <p className="text-sm text-gray-500">
              Run: <code className="bg-gray-100 px-2 py-1 rounded">node backend/src/scripts/seed.js</code>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.map((integration) => {
              const stats = integration.stats || {};
              const isRefreshing = refreshing[integration._id];
              const isConnecting = connectMutation.isPending;
              const isDisconnecting = disconnectMutation.isPending;

              return (
                <div key={integration._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                      {integration.description && (
                        <p className="text-xs text-gray-500 mt-1">{integration.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRefresh(integration)}
                        disabled={isRefreshing || isConnecting || isDisconnecting}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                        title="Refresh stats"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                      <span
                        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                          integration.status === 'connected'
                            ? 'bg-green-100 text-green-700'
                            : integration.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {integration.status === 'connected' ? (
                          <>
                            <Check className="w-3 h-3" />
                            Connected
                          </>
                        ) : integration.status === 'pending' ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Pending
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            Disconnected
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Leads</span>
                      <span className="font-semibold text-gray-900">{stats.totalLeads || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Today</span>
                      <span className="font-semibold text-gray-900">{stats.leadsToday || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">This Week</span>
                      <span className="font-semibold text-gray-900">{stats.leadsThisWeek || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">This Month</span>
                      <span className="font-semibold text-gray-900">{stats.leadsThisMonth || 0}</span>
                    </div>
                  </div>

                  {/* Webhook URL */}
                  {integration.webhookUrl && (
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Webhook URL</label>
                      <div className="p-3 bg-gray-50 rounded text-xs font-mono text-gray-600 break-all border border-gray-200">
                        {window.location.origin.replace(':5173', ':5003')}{integration.webhookUrl}
                      </div>
                      <button
                        onClick={() => copyWebhookUrl(integration)}
                        className="mt-2 text-xs text-accent hover:text-accent/80 font-medium"
                      >
                        Copy URL
                      </button>
                    </div>
                  )}

                  {/* Last Sync */}
                  {integration.lastSyncAt && (
                    <p className="text-xs text-gray-500 mb-4">
                      Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
                    </p>
                  )}

                  {/* Connect/Disconnect Button */}
                  <button
                    onClick={() => {
                      if (integration.status === 'connected') {
                        handleDisconnect(integration);
                      } else {
                        handleConnect(integration);
                      }
                    }}
                    disabled={isConnecting || isDisconnecting}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      integration.status === 'connected'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-accent text-white hover:bg-accent/90'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isConnecting || isDisconnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isConnecting ? 'Connecting...' : 'Disconnecting...'}
                      </>
                    ) : integration.status === 'connected' ? (
                      'Disconnect'
                    ) : (
                      'Connect'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Integrations;
