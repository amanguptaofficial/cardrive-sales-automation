import AppLayout from '../components/layout/AppLayout.jsx';
import { usePipeline } from '../hooks/useDashboard.js';
import { TrendingUp, DollarSign, Calendar, Users } from 'lucide-react';

const Pipeline = () => {
  const { data, isLoading } = usePipeline();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-accent" />
              Sales Pipeline
            </h1>
            <p className="text-gray-600 mt-1">Track your sales pipeline and revenue</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const stats = data?.data || {};
  const pipelineValueCr = ((stats.pipelineValue || 0) / 10000000).toFixed(1);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-accent" />
            Sales Pipeline
          </h1>
          <p className="text-gray-600 mt-1">Track your sales pipeline and revenue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Qualified Leads</h3>
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.qualified || 0}</p>
            <p className="text-sm text-gray-600 mt-2">Ready for follow-up</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Test Drives</h3>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.testDrives || 0}</p>
            <p className="text-sm text-gray-600 mt-2">Scheduled</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Pipeline Value</h3>
              <DollarSign className="w-5 h-5 text-accent" />
            </div>
            <p className="text-3xl font-bold text-gray-900">₹{pipelineValueCr}cr</p>
            <p className="text-sm text-gray-600 mt-2">Total potential revenue</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Pipeline;
