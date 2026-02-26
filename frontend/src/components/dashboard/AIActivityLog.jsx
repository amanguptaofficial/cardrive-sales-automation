import { useState, useEffect } from 'react';
import { useActivity } from '../../hooks/useDashboard.js';
import { formatTimeAgo } from '../../utils/constants.js';
import { Sparkles, CheckCircle, Flame, TrendingUp, Calendar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const CLEARED_AT_KEY = 'ai_activity_cleared_at';

const AIActivityLog = () => {
  const { data, isLoading } = useActivity();
  const queryClient = useQueryClient();
  const [clearedAt, setClearedAt] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(CLEARED_AT_KEY);
    if (stored) {
      setClearedAt(new Date(stored));
    }
  }, []);

  const handleClear = () => {
    const now = new Date();
    localStorage.setItem(CLEARED_AT_KEY, now.toISOString());
    setClearedAt(now);
    toast.success('Activity log cleared');
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity'] });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const allActivities = data?.data || [];
  
  const activities = clearedAt 
    ? allActivities.filter(activity => {
        const activityTime = new Date(activity.timestamp);
        return activityTime > clearedAt;
      })
    : allActivities;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'reply_sent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'hot_flagged':
        return <Flame className="w-5 h-5 text-red-500" />;
      case 're_scored':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'drip_queued':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-accent" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          AI Activity
        </h3>
        <button 
          onClick={handleClear}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          disabled={activities.length === 0}
        >
          Clear
        </button>
      </div>
      <p className="text-xs text-gray-600 mb-4">Live feed of what AI is doing</p>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            {clearedAt ? 'No new activity since last clear' : 'No activity yet'}
          </p>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
              <div className="flex-shrink-0 mt-0.5">{getActivityIcon(activity.type)}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {activity.type === 'reply_sent' && `Reply sent → ${activity.leadName}`}
                  {activity.type === 'hot_flagged' && `HOT lead flagged → ${activity.leadName}`}
                  {activity.type === 're_scored' && `Re-scored → ${activity.leadName}`}
                  {activity.type === 'drip_queued' && `Drip queued → ${activity.leadName}`}
                </div>
                <div className="text-xs text-gray-600 mt-1">{activity.description}</div>
              </div>
              <div className="text-xs text-gray-500">
                {formatTimeAgo(activity.timestamp)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AIActivityLog;
