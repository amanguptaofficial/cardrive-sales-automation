import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout.jsx';
import { BarChart3, TrendingUp, DollarSign, Users, Clock, Download, Calendar, MessageCircle } from 'lucide-react';
import { useVolume } from '../hooks/useDashboard.js';
import { useRevenueAnalytics, useConversionAnalytics, useAgentPerformance, useResponseTimeAnalytics } from '../hooks/useAnalytics.js';
import { useAuth } from '../context/AuthContext.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api.js';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { agent } = useAuth();
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isAdmin = agent?.role === 'manager' || agent?.role === 'owner';

  const { data: volumeData } = useVolume(7);
  
  const { data: revenueData, isLoading: revenueLoading } = useRevenueAnalytics(
    period, 
    startDate || undefined, 
    endDate || undefined,
    isAdmin
  );
  const { data: conversionData, isLoading: conversionLoading } = useConversionAnalytics(
    period, 
    startDate || undefined, 
    endDate || undefined,
    isAdmin
  );
  const { data: agentPerformanceData, isLoading: agentLoading } = useAgentPerformance(
    period, 
    startDate || undefined, 
    endDate || undefined,
    isAdmin
  );
  const { data: responseTimeData, isLoading: responseTimeLoading } = useResponseTimeAnalytics(
    period, 
    startDate || undefined, 
    endDate || undefined,
    isAdmin
  );

  const handleExport = async (type) => {
    try {
      const params = new URLSearchParams();
      params.append('type', type);
      params.append('format', 'csv');
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/analytics/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const COLORS = ['#d4410b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-accent" />
              Analytics
            </h1>
            <p className="text-gray-600 mt-1">Detailed analytics and insights</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
            {isAdmin && (
              <button
                onClick={() => handleExport('revenue')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>

        {!isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-800 font-medium mb-2">Agent Analytics</p>
            <p className="text-blue-600 text-sm">
              You're viewing basic analytics. For advanced analytics (Revenue, Conversion, Agent Performance), 
              please contact your manager or administrator.
            </p>
            <p className="text-blue-600 text-sm mt-2">
              View your personal performance dashboard <a href="/my-dashboard" className="underline font-medium">here</a>.
            </p>
          </div>
        )}

        {isAdmin && (
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'revenue'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveTab('conversion')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'conversion'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Conversion
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'agents'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Agent Performance
            </button>
            <button
              onClick={() => setActiveTab('response-time')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'response-time'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Response Time
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'leaderboard'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Leaderboard
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Lead Volume (Last 7 Days)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={volumeData?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#d4410b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {isAdmin && activeTab === 'revenue' && (
          <div className="space-y-6">
            {revenueLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
              </div>
            ) : revenueData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          ₹{(revenueData.totalRevenue / 10000000).toFixed(2)}cr
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Revenue Sources</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {Object.keys(revenueData.revenueBySource || {}).length}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Agents</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {revenueData.revenueByAgent?.length || 0}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Revenue by Source</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(revenueData.revenueBySource || {}).map(([source, revenue]) => ({
                      source,
                      revenue: revenue / 100000
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value}L`} />
                      <Bar dataKey="revenue" fill="#d4410b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData.revenueTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${(value / 100000).toFixed(1)}L`} />
                      <Line type="monotone" dataKey="revenue" stroke="#d4410b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Revenue by Agent</h3>
                  <div className="space-y-3">
                    {revenueData.revenueByAgent?.slice(0, 10).map((agent, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-gray-900">{agent.name}</p>
                          <p className="text-sm text-gray-600">{agent.count} conversions</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          ₹{(agent.revenue / 100000).toFixed(1)}L
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {isAdmin && activeTab === 'conversion' && (
          <div className="space-y-6">
            {conversionLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
              </div>
            ) : conversionData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <p className="text-sm text-gray-600">Overall Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {conversionData.overallConversionRate?.toFixed(2) || 0}%
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <p className="text-sm text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {conversionData.totalLeads || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <p className="text-sm text-gray-600">Converted Leads</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {conversionData.convertedLeads || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Conversion Rate by Source</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(conversionData.conversionBySource || {}).map(([source, data]) => ({
                      source,
                      rate: data.rate || 0,
                      converted: data.converted || 0,
                      total: data.total || 0
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="source" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="rate" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Conversion Rate by Tier</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(conversionData.conversionByTier || {}).map(([tier, data]) => ({
                          name: tier,
                          value: data.rate || 0,
                          converted: data.converted || 0,
                          total: data.total || 0
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.keys(conversionData.conversionByTier || {}).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Performing Agents</h3>
                  <div className="space-y-3">
                    {conversionData.conversionByAgent?.slice(0, 10).sort((a, b) => b.rate - a.rate).map((agent, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-gray-900">{agent.name}</p>
                          <p className="text-sm text-gray-600">
                            {agent.converted} / {agent.total} leads
                          </p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {agent.rate?.toFixed(1) || 0}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {isAdmin && activeTab === 'agents' && (
          <div className="space-y-6">
            {agentLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
              </div>
            ) : agentPerformanceData && (
              <>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Team Leaderboard - Revenue</h3>
                  <div className="space-y-3">
                    {agentPerformanceData.leaderboard?.revenue?.map((agent, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                            idx === 1 ? 'bg-gray-100 text-gray-700' :
                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{agent.name}</p>
                            <p className="text-sm text-gray-600">{agent.convertedLeads} conversions</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          ₹{(agent.revenue / 100000).toFixed(1)}L
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Agent Performance Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Agent</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Assigned</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Responded</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Response Rate</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Response</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Converted</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Conversion Rate</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agentPerformanceData.performance?.map((agent, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{agent.name}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{agent.assignedLeads}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{agent.respondedLeads}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{agent.responseRate?.toFixed(1) || 0}%</td>
                            <td className="py-3 px-4 text-right text-gray-700">
                              {agent.avgResponseTime ? `${Math.round(agent.avgResponseTime / 60)}m` : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-700">{agent.convertedLeads}</td>
                            <td className="py-3 px-4 text-right text-gray-700">{agent.conversionRate?.toFixed(1) || 0}%</td>
                            <td className="py-3 px-4 text-right font-bold text-gray-900">
                              ₹{(agent.revenue / 100000).toFixed(1)}L
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {isAdmin && activeTab === 'leaderboard' && (
          <div className="space-y-6">
            {agentLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
              </div>
            ) : agentPerformanceData?.leaderboard && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Revenue Leaderboard */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Top Revenue Generators
                    </h3>
                    <div className="space-y-3">
                      {agentPerformanceData.leaderboard.revenue?.slice(0, 5).map((agent, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                              idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-gray-300'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{agent.name}</p>
                              <p className="text-xs text-gray-500">{agent.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₹{(agent.revenue / 100000).toFixed(1)}L</p>
                            <p className="text-xs text-gray-500">{agent.convertedLeads} deals</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conversion Leaderboard */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      Top Converters
                    </h3>
                    <div className="space-y-3">
                      {agentPerformanceData.leaderboard.conversion?.slice(0, 5).map((agent, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                              idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-gray-300'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{agent.name}</p>
                              <p className="text-xs text-gray-500">{agent.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{agent.conversionRate?.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">{agent.convertedLeads}/{agent.assignedLeads}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Response Rate Leaderboard */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                      Top Responders
                    </h3>
                    <div className="space-y-3">
                      {agentPerformanceData.leaderboard.responseRate?.slice(0, 5).map((agent, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                              idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-gray-300'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{agent.name}</p>
                              <p className="text-xs text-gray-500">{agent.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{agent.responseRate?.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">{agent.respondedLeads} responded</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {isAdmin && activeTab === 'response-time' && (
          <div className="space-y-6">
            {responseTimeLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
              </div>
            ) : responseTimeData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Average Response Time</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {Math.round((responseTimeData.avgResponseTime || 0) / 60)} minutes
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Response Time Impact</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Faster responses = Higher conversions
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Response Time Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={responseTimeData.responseTimeTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value} seconds`} />
                      <Line type="monotone" dataKey="avgResponseTime" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Conversion by Response Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { range: '< 5 min', conversions: responseTimeData.conversionByResponseTime?.under_5min || 0 },
                      { range: '5-15 min', conversions: responseTimeData.conversionByResponseTime?.under_15min || 0 },
                      { range: '15-30 min', conversions: responseTimeData.conversionByResponseTime?.under_30min || 0 },
                      { range: '30-60 min', conversions: responseTimeData.conversionByResponseTime?.under_1hour || 0 },
                      { range: '> 1 hour', conversions: responseTimeData.conversionByResponseTime?.over_1hour || 0 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="conversions" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Analytics;
