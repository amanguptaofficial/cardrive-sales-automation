import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout.jsx';
import { Package, Plus, Car, Search, Edit, Trash2, MapPin } from 'lucide-react';
import { useVehicles, useDeleteVehicle } from '../hooks/useVehicles.js';
import AddVehicleModal from '../components/inventory/AddVehicleModal.jsx';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/common/ConfirmationModal.jsx';

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  const { data, isLoading } = useVehicles({ search: searchQuery });
  const deleteVehicleMutation = useDeleteVehicle();

  const vehicles = data?.data || [];

  const handleDeleteClick = (vehicle) => {
    setVehicleToDelete(vehicle);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;
    try {
      await deleteVehicleMutation.mutateAsync(vehicleToDelete._id);
      toast.success('Vehicle deleted successfully');
      setShowDeleteModal(false);
      setVehicleToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete vehicle');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-gray-100 text-gray-800';
      case 'service':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-8 h-8 text-accent" />
              Inventory
            </h1>
            <p className="text-gray-600 mt-1">Manage your car inventory</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Vehicle
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles in inventory</h3>
            <p className="text-gray-600">Add vehicles to start managing your inventory</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <div key={vehicle._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{vehicle.make} {vehicle.model}</h3>
                    <p className="text-sm text-gray-600 mt-1">{vehicle.variant} • {vehicle.year}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Fuel:</span>
                    <span className="capitalize">{vehicle.fuelType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Color:</span>
                    <span>{vehicle.color}</span>
                  </div>
                  {vehicle.location?.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{vehicle.location.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Price:</span>
                    <span className="text-accent font-semibold">₹{vehicle.price?.toLocaleString('en-IN')}</span>
                  </div>
                  {vehicle.mileage > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Mileage:</span>
                      <span>{vehicle.mileage.toLocaleString('en-IN')} km</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                  <button
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(vehicle)}
                    className="flex-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddVehicleModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setVehicleToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete ${vehicleToDelete?.make} ${vehicleToDelete?.model}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleteVehicleMutation.isPending}
      />
    </AppLayout>
  );
};

export default Inventory;
