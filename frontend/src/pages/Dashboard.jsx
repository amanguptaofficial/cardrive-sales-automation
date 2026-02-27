import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout.jsx';
import KPICard from '../components/dashboard/KPICard.jsx';
import LeadTable from '../components/leads/LeadTable.jsx';
import LeadDetailModal from '../components/leads/LeadDetailModal.jsx';
import AIComposer from '../components/ai/AIComposer.jsx';
import ConversionFunnel from '../components/dashboard/ConversionFunnel.jsx';
import AIActivityLog from '../components/dashboard/AIActivityLog.jsx';
import { useDashboardStats } from '../hooks/useDashboard.js';
import { useSocket } from '../hooks/useSocket.js';
import { Zap, Clock, DollarSign, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const { data: statsData } = useDashboardStats();
  useSocket();

  const stats = statsData?.data || {};

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
    setShowLeadDetail(true);
  };

  const handleCloseModal = () => {
    setShowLeadDetail(false);
    setSelectedLead(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Leads This Month"
            value={stats.totalLeads || 0}
            trend={24}
            icon={Zap}
            color="accent"
          />
          <KPICard
            title="AI Response Rate"
            value={`${(stats.aiResponseRate || 0).toFixed(0)}%`}
            trend={6}
            icon={Zap}
            color="blue"
          />
          <KPICard
            title="Avg. First Response"
            value={`${Math.round((stats.avgFirstResponseSec || 0) / 60)}m`}
            trend={-88}
            icon={Clock}
            color="yellow"
          />
          <KPICard
            title="Monthly Sales Value"
            value={`₹${((stats.monthlySalesValue || 0) / 10000000).toFixed(1)}cr`}
            trend={31}
            icon={DollarSign}
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeadTable onLeadClick={handleLeadClick} isCompact={true} />
          <AIComposer leadId={selectedLead?._id || selectedLead?.id} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ConversionFunnel />
          <div className="lg:col-span-2">
            <AIActivityLog />
          </div>
        </div>
      </div>

      {showLeadDetail && selectedLead && (
        <LeadDetailModal
          leadId={selectedLead._id || selectedLead.id}
          onClose={handleCloseModal}
        />
      )}
    </AppLayout>
  );
};

export default Dashboard;
