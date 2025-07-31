import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, ChefHat, Mail, Phone, Users } from 'lucide-react';
import AddChefModal from './AddChefModal';
import EditChefModal from './EditChefModal';
import DeleteChefModal from './DeleteChefModal';
import SimpleToast from './SimpleToast';

interface Chef {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  kitchen_station?: {
    id: string;
    name: string;
    cuisine_types: string[];
  };
  kitchen_station_name: string;
  specialty: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive';
}

interface ChefFormData {
  name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  kitchen_station_id?: string;
  specialty?: string;
  id?: string;
  password?: string;
}

interface ChefManagementPageProps {
  restaurantId: string;
}

const ChefManagementPage: React.FC<ChefManagementPageProps> = ({ restaurantId }) => {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(false); // Start with false
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const fetchChefs = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!restaurantId || restaurantId.trim() === '') {
        setChefs([]);
        setHasLoadedOnce(true);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/chefs?restaurantId=${restaurantId}`);
      
      if (response.ok) {
        const data = await response.json();
        setChefs(data.chefs || []);
      } else {
        setChefs([]);
        setNotification({
          message: 'Failed to load chefs. Please try again.',
          type: 'error'
        });
      }
    } catch (error: unknown) {
      console.error('Error fetching chefs:', error);
      setChefs([]);
      setNotification({
        message: error instanceof Error ? error.message : 'Failed to load chefs. Please try again.',
        type: 'error'
      });
    } finally {
      setHasLoadedOnce(true);
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId && restaurantId.trim() !== '') {
      fetchChefs();
    } else {
      setHasLoadedOnce(true);
      setLoading(false);
    }
  }, [restaurantId, fetchChefs]);

  const handleAddChef = async (chefData: ChefFormData) => {
    try {
      const response = await fetch('/api/admin/chefs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...chefData,
          restaurant_id: restaurantId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create chef');
      }

      const result = await response.json();
      setChefs(prev => [...prev, result.chef]);
      setShowAddModal(false);
      setNotification({
        message: 'Chef added successfully!',
        type: 'success'
      });
    } catch (error: unknown) {
      console.error('Error adding chef:', error);
      setNotification({
        message: error instanceof Error ? error.message : 'Failed to add chef. Please try again.',
        type: 'error'
      });
    }
  };

  const handleEditChef = async (chefData: ChefFormData) => {
    try {
      const response = await fetch('/api/admin/chefs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chefData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update chef');
      }

      const result = await response.json();
      setChefs(prev => prev.map(c => c.id === result.chef.id ? result.chef : c));
      setShowEditModal(false);
      setSelectedChef(null);
      setNotification({
        message: 'Chef updated successfully!',
        type: 'success'
      });
    } catch (error: unknown) {
      console.error('Error updating chef:', error);
      setNotification({
        message: error instanceof Error ? error.message : 'Failed to update chef. Please try again.',
        type: 'error'
      });
    }
  };

  const handleDeleteChef = async (chefId: string) => {
    try {
      const response = await fetch(`/api/admin/chefs?id=${chefId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete chef');
      }

      setChefs(prev => prev.filter(c => c.id !== chefId));
      setShowDeleteModal(false);
      setSelectedChef(null);
      setNotification({
        message: 'Chef removed successfully!',
        type: 'success'
      });
    } catch (error: unknown) {
      console.error('Error deleting chef:', error);
      setNotification({
        message: error instanceof Error ? error.message : 'Failed to delete chef. Please try again.',
        type: 'error'
      });
    }
  };

  if (loading && !hasLoadedOnce) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Chef Management</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-32"></div>
                    <div className="h-3 bg-gray-300 rounded w-24"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-6 bg-gray-300 rounded w-16"></div>
                  <div className="h-8 bg-gray-300 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Chef Management</h2>
          <p className="text-gray-600 mt-1">{chefs.length} chef{chefs.length !== 1 ? 's' : ''} total</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-all flex items-center space-x-2 cursor-pointer"
        >
          <Plus size={18} />
          <span>Add New Chef</span>
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        {chefs.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No chefs found</h3>
            <p className="text-gray-600 mb-4">Add your first chef to start managing kitchen staff</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-4 py-2 rounded-lg transition-all cursor-pointer"
            >
              Add First Chef
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {chefs.map((chef) => (
              <div key={chef.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {chef.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{chef.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Mail size={14} />
                        <span>{chef.email}</span>
                      </div>
                      {chef.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone size={14} />
                          <span>{chef.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users size={14} />
                        <span>Station: {chef.kitchen_station_name}</span>
                      </div>
                      <span>•</span>
                      <span>Specialty: {chef.specialty}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    chef.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {chef.status}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedChef(chef);
                        setShowEditModal(true);
                      }}
                      className="text-orange-600 hover:text-orange-800 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                      title="Edit chef"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedChef(chef);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete chef"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddChefModal
        isOpen={showAddModal}
        restaurantId={restaurantId}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddChef}
      />

      {selectedChef && (
        <EditChefModal
          isOpen={showEditModal}
          chef={selectedChef}
          restaurantId={restaurantId}
          onClose={() => {
            setShowEditModal(false);
            setSelectedChef(null);
          }}
          onUpdate={handleEditChef}
        />
      )}

      {selectedChef && (
        <DeleteChefModal
          isOpen={showDeleteModal}
          chef={selectedChef}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedChef(null);
          }}
          onDelete={handleDeleteChef}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <SimpleToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default ChefManagementPage; 