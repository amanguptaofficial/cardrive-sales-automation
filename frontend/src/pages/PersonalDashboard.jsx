import React, { useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout.jsx';
import { usePersonalDashboard } from '../hooks/useAnalytics.js';
import { useAuth } from '../context/AuthContext.jsx';
import { TrendingUp, Users, MessageCircle, DollarSign, Clock, Target, Award, BarChart3, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PersonalDashboard = () => {
  const { agent } = useAuth();
  const [period, setPeriod] = useState('week');

  const { data, isLoading, error, refetch } = usePersonalDashboard(period);

  useEffect(() => {
    if (data) {
      console.log('[Personal Dashboard] Data received:', data);
    }
  }, [data]);

  useEffect(() => {
    refetch();
  }, [period, refetch]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-red-600">Error loading data. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
          >
            Retry
          </button>
        </div>
      </AppLayout>
    );
  }

  const dashboardData = data || {
    totalLeads: 0,
    respondedLeads: 0,
    responseRate: 0,
    avgResponseTime: 0,
    convertedLeads: 0,
    conversionRate: 0,
    revenue: 0,
    teamAvgConversion: 0,
    weeklyStats: [],
    allTimeStats: null
  };

  const hasNoPeriodData = dashboardData.totalLeads === 0 && dashboardData.allTimeStats && dashboardData.allTimeStats.totalLeads > 0;
  
  const displayData = hasNoPeriodData && dashboardData.allTimeStats ? {
    ...dashboardData,
    totalLeads: dashboardData.allTimeStats.totalLeads || 0,
    respondedLeads: dashboardData.allTimeStats.respondedLeads || 0,
    responseRate: dashboardData.allTimeStats.responseRate || 0,
    convertedLeads: dashboardData.allTimeStats.convertedLeads || 0,
    conversionRate: dashboardData.allTimeStats.conversionRate || 0
  } : dashboardData;

  const chartData = dashboardData.weeklyStats && dashboardData.weeklyStats.length > 0 
    ? dashboardData.weeklyStats 
    : Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          leads: 0,
          converted: 0
        };
      });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-8 h-8 text-accent" />
              My Performance Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Track your performance metrics and goals</p>
            {hasNoPeriodData && (
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm text-blue-700">
                <p>No activity in selected period. Showing all-time stats: {dashboardData.allTimeStats.totalLeads} leads, {dashboardData.allTimeStats.convertedLeads} converted ({dashboardData.allTimeStats.conversionRate.toFixed(1)}%)</p>
              </div>
            )}
            {!hasNoPeriodData && dashboardData.allTimeStats && dashboardData.allTimeStats.totalLeads === 0 && (
              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-sm text-yellow-700">
                <p>No leads assigned yet. Assign leads to see your performance metrics.</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{displayData.totalLeads || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {displayData.responseRate?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {displayData.respondedLeads || 0} responded
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {displayData.conversionRate?.toFixed(1) || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Team avg: {displayData.teamAvgConversion?.toFixed(1) || 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Generated</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{((displayData.revenue || 0) / 100000).toFixed(1)}L
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {displayData.convertedLeads || 0} conversions
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Average Response Time
            </h3>
            <div className="text-center py-8">
              <p className="text-4xl font-bold text-gray-900">
                {displayData.avgResponseTime ? `${Math.round(displayData.avgResponseTime / 60)}m` : 'N/A'}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {displayData.respondedLeads || 0} leads responded
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              Performance vs Team
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Your Conversion Rate</span>
                  <span className="font-semibold">{displayData.conversionRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(displayData.conversionRate || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Team Average</span>
                  <span className="font-semibold">{displayData.teamAvgConversion?.toFixed(1) || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(displayData.teamAvgConversion || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
              {displayData.conversionRate > displayData.teamAvgConversion && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  You're performing above team average!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Stats Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              Weekly Performance Trend
            </h3>
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value, name) => [value, name === 'leads' ? 'Leads Assigned' : 'Converted']}
              />
              <Bar dataKey="leads" fill="#0088FE" name="Leads Assigned" />
              <Bar dataKey="converted" fill="#00C49F" name="Converted" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Leads Assigned</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{displayData.totalLeads || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Conversions</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{displayData.convertedLeads || 0}</p>
                <p className="text-xs text-green-600 mt-1">
                  {displayData.conversionRate?.toFixed(1) || 0}% conversion rate
                </p>
              </div>
              <Award className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">
                  ₹{((displayData.revenue || 0) / 100000).toFixed(1)}L
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  From {displayData.convertedLeads || 0} deals
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PersonalDashboard;
