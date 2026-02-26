import AppLayout from '../components/layout/AppLayout.jsx';
import { useAIScoring } from '../hooks/useDashboard.js';
import { Target, Flame, Sun, Snowflake } from 'lucide-react';

const AIScoring = () => {
  const { data, isLoading } = useAIScoring();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-8 h-8 text-accent" />
              AI Scoring
            </h1>
            <p className="text-gray-600 mt-1">AI-powered lead scoring analytics</p>
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-8 h-8 text-accent" />
            AI Scoring
          </h1>
          <p className="text-gray-600 mt-1">AI-powered lead scoring analytics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Hot Leads</h3>
              <Flame className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.hot || 0}</p>
            <p className="text-sm text-gray-600 mt-2">Score ≥ 85</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Warm Leads</h3>
              <Sun className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.warm || 0}</p>
            <p className="text-sm text-gray-600 mt-2">Score 55-84</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Cold Leads</h3>
              <Snowflake className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.cold || 0}</p>
            <p className="text-sm text-gray-600 mt-2">Score &lt; 55</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIScoring;
