import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Search, Plus, Circle, Menu } from 'lucide-react';
import NotificationPanel from '../notifications/NotificationPanel.jsx';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api.js';

const Topbar = ({ onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { agent } = useAuth();

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { data: [] };
      const response = await api.get('/leads', {
        params: { search: searchQuery, limit: 5 }
      });
      return response.data;
    },
    enabled: searchQuery.length >= 2,
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery) {
      navigate(`/leads?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLeadClick = (lead) => {
    navigate(`/leads?leadId=${lead._id || lead.id}`);
    setSearchQuery('');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Command Center</h1>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">
              <span className="hidden sm:inline">CarDrive Motors • </span>
              {currentDate} • {currentTime} IST
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads, cars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent w-64"
            />
            {searchQuery && searchResults?.data && searchResults.data.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchResults.data.map((lead) => (
                  <div
                    key={lead._id || lead.id}
                    onClick={() => handleLeadClick(lead)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    <div className="font-medium text-gray-900">{lead.name}</div>
                    <div className="text-sm text-gray-500">{lead.email || lead.phone}</div>
                    {lead.interest?.model && (
                      <div className="text-xs text-gray-400 mt-1">{lead.interest.model}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </form>

          <div className="flex items-center gap-2 bg-green-100 text-green-700 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium">
            <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
            <span className="hidden sm:inline">AI Active</span>
          </div>

          <NotificationPanel />

          <button
            onClick={() => navigate('/leads/new')}
            className="bg-accent text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-accent/90 transition-colors text-sm sm:text-base flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
