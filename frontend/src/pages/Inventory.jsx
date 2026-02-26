import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout.jsx';
import { Package, Plus, Car, Search } from 'lucide-react';

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const vehicles = [];

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
          <button className="bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-accent/90 flex items-center gap-2">
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

        {vehicles.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Car className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles in inventory</h3>
            <p className="text-gray-600">Add vehicles to start managing your inventory</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900">{vehicle.make} {vehicle.model}</h3>
                <p className="text-sm text-gray-600 mt-1">{vehicle.variant}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Inventory;
