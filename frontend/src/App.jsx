import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import AIInbox from './pages/AIInbox.jsx';
import Pipeline from './pages/Pipeline.jsx';
import Inventory from './pages/Inventory.jsx';
import AIScoring from './pages/AIScoring.jsx';
import Compose from './pages/Compose.jsx';
import Sequences from './pages/Sequences.jsx';
import Analytics from './pages/Analytics.jsx';
import Integrations from './pages/Integrations.jsx';
import Routing from './pages/Routing.jsx';
import Settings from './pages/Settings.jsx';
import Chat from './pages/Chat.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AddLead from './pages/AddLead.jsx';
import CSVUpload from './components/csv/CSVUpload.jsx';
import Reminders from './pages/Reminders.jsx';
import Templates from './pages/Templates.jsx';
import PersonalDashboard from './pages/PersonalDashboard.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const { agent, loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!token && !agent) {
    return <Navigate to="/login" replace />;
  }

  return agent ? children : (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="text-lg text-gray-600">Verifying authentication...</div>
      </div>
    </div>
  );
};

const AdminProtectedRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const adminAgent = localStorage.getItem('adminAgent');

  if (!adminToken || !adminAgent) {
    return <Navigate to="/admin/login" />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/new"
              element={
                <ProtectedRoute>
                  <AddLead />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads"
              element={
                <ProtectedRoute>
                  <Leads />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-inbox"
              element={
                <ProtectedRoute>
                  <AIInbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pipeline"
              element={
                <ProtectedRoute>
                  <Pipeline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Inventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-scoring"
              element={
                <ProtectedRoute>
                  <AIScoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/compose"
              element={
                <ProtectedRoute>
                  <Compose />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sequences"
              element={
                <ProtectedRoute>
                  <Sequences />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations"
              element={
                <ProtectedRoute>
                  <Integrations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/routing"
              element={
                <ProtectedRoute>
                  <Routing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reminders"
              element={
                <ProtectedRoute>
                  <Reminders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <Templates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-dashboard"
              element={
                <ProtectedRoute>
                  <PersonalDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
