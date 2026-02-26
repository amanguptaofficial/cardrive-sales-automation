import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';
import LeadTable from '../components/leads/LeadTable.jsx';
import LeadDetailModal from '../components/leads/LeadDetailModal.jsx';
import CSVUpload from '../components/csv/CSVUpload.jsx';
import { Plus, Upload } from 'lucide-react';

const Leads = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);

  useEffect(() => {
    const leadId = searchParams.get('leadId');
    if (leadId) {
      setSelectedLead({ id: leadId });
      setShowLeadDetail(true);
    }
  }, [searchParams]);

  const [showCSVUpload, setShowCSVUpload] = useState(false);

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
    setShowLeadDetail(true);
    navigate(`/leads?leadId=${lead._id || lead.id}`);
  };

  const handleCloseModal = () => {
    setShowLeadDetail(false);
    setSelectedLead(null);
    navigate('/leads');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Leads</h1>
            <p className="text-gray-600 mt-1">Manage and track all your leads</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCSVUpload(!showCSVUpload)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {showCSVUpload ? 'Hide CSV Upload' : 'Upload CSV'}
            </button>
            <button
              onClick={() => navigate('/leads/new')}
              className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Lead
            </button>
          </div>
        </div>

        {showCSVUpload && <CSVUpload />}

        <LeadTable onLeadClick={handleLeadClick} />

        {showLeadDetail && selectedLead && (
          <LeadDetailModal
            leadId={selectedLead._id || selectedLead.id}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Leads;
