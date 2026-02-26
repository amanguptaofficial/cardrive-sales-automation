import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Car,
  LayoutDashboard,
  Users,
  Bot,
  TrendingUp,
  Package,
  Target,
  PenTool,
  Calendar,
  BarChart3,
  Link2,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  Clock,
  FileText,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { agent, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const mainNav = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/my-dashboard', label: 'My Performance', icon: Award },
    { path: '/leads', label: 'All Leads', icon: Users },
    { path: '/ai-inbox', label: 'AI Inbox', icon: Bot },
    { path: '/pipeline', label: 'Pipeline', icon: TrendingUp },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/reminders', label: 'Reminders', icon: Clock },
    { path: '/templates', label: 'Templates', icon: FileText },
  ];

  const intelligenceNav = [
    { path: '/ai-scoring', label: 'AI Scoring', icon: Target },
    { path: '/compose', label: 'Compose', icon: PenTool },
    { path: '/sequences', label: 'Sequences', icon: Calendar },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const settingsNav = [
    { path: '/integrations', label: 'Integrations', icon: Link2 },
    { path: '/routing', label: 'Routing Rules', icon: Settings },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className={`bg-gray-900 text-white min-h-screen flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} relative`}>
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-2xl">
            <Car className="w-6 h-6 text-accent" />
          </div>
          {!isCollapsed && (
            <>
              <div className="font-bold text-lg">CarDrive</div>
              <span className="text-xs bg-accent px-2 py-0.5 rounded">AI</span>
            </>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        <div>
          {!isCollapsed && (
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-2">MAIN</div>
          )}
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg mb-1 transition-colors group ${
                  isActive(item.path)
                    ? 'bg-accent text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div>
          {!isCollapsed && (
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-2">INTELLIGENCE</div>
          )}
          {isCollapsed && <div className="h-2"></div>}
          {intelligenceNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg mb-1 transition-colors group ${
                  isActive(item.path)
                    ? 'bg-accent text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div>
          {!isCollapsed && (
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-2">SETTINGS</div>
          )}
          {isCollapsed && <div className="h-2"></div>}
          {settingsNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg mb-1 transition-colors group ${
                  isActive(item.path)
                    ? 'bg-accent text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} mb-3`}>
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold flex-shrink-0">
            {agent?.name?.charAt(0) || 'A'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{agent?.name || 'Agent'}</div>
              <div className="text-xs text-gray-400 capitalize truncate">
                {agent?.role?.replace('_', ' ') || 'Agent'}
              </div>
            </div>
          )}
        </div>
        {!isCollapsed ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full p-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:block absolute -right-3 top-20 bg-gray-800 hover:bg-gray-700 text-white p-1.5 rounded-full border border-gray-700 transition-colors z-10 shadow-lg"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default Sidebar;
