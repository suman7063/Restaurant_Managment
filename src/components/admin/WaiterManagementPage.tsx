import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Mail, Phone, AlertCircle } from 'lucide-react';
import AddWaiterModal from './AddWaiterModal';
import EditWaiterModal from './EditWaiterModal';
import DeleteWaiterModal from './DeleteWaiterModal';
import SimpleToast from './SimpleToast';


interface Waiter {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  tableCount: number;
  assignedTables: any[];
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive';
}

interface WaiterManagementPageProps {
  restaurantId: string;
}

const WaiterManagementPage: React.FC<WaiterManagementPageProps> = ({ restaurantId }) => {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const fetchWaiters = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/waiters?restaurantId=${restaurantId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch waiters: ${response.statusText}`);
      }

      const data = await response.json();
      setWaiters(data.waiters || []);
    } catch (error) {
      console.error('Error fetching waiters:', error);
      setNotification({
        message: 'Failed to load waiters. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchWaiters();
    }
  }, [restaurantId]);

  const handleAddWaiter = async (waiterData: any) => {
    try {
      const response = await fetch('/api/admin/waiters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...waiterData,
          restaurant_id: restaurantId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create waiter');
      }

      const result = await response.json();
      setWaiters(prev => [...prev, result.waiter]);
      setShowAddModal(false);
      setNotification({
        message: 'Waiter added successfully!',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error adding waiter:', error);
      setNotification({
        message: error.message || 'Failed to add waiter. Please try again.',
        type: 'error'
      });
    }
  };

  const handleEditWaiter = async (waiterData: any) => {
    try {
      const response = await fetch('/api/admin/waiters', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(waiterData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update waiter (${response.status})`);
      }

      const result = await response.json();
      setWaiters(prev => prev.map(w => w.id === result.waiter.id ? { 
        ...w, 
        ...result.waiter,
        // If waiter is made inactive, reset table count to 0
        tableCount: result.waiter.is_active ? w.tableCount : 0,
        status: result.waiter.is_active ? 'active' : 'inactive'
      } : w));
      setShowEditModal(false);
      setSelectedWaiter(null);
      setNotification({
        message: 'Waiter updated successfully!',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error updating waiter:', error);
      setNotification({
        message: error.message || 'Failed to update waiter. Please try again.',
        type: 'error'
      });
    }
  };

  const handleDeleteWaiter = async (waiterId: string) => {
    try {
      const response = await fetch(`/api/admin/waiters?id=${waiterId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete waiter');
      }

      setWaiters(prev => prev.filter(w => w.id !== waiterId));
      setShowDeleteModal(false);
      setSelectedWaiter(null);
      setNotification({
        message: 'Waiter removed successfully!',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error deleting waiter:', error);
      setNotification({
        message: error.message || 'Failed to delete waiter. Please try again.',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Waiter Management</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
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
          <h2 className="text-3xl font-bold text-gray-900">Waiter Management</h2>
          <p className="text-gray-600 mt-1">{waiters.length} waiter{waiters.length !== 1 ? 's' : ''} total</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Add New Waiter</span>
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        {waiters.length === 0 ? (
          <div className="text-center py-12">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No waiters found</h3>
            <p className="text-gray-600 mb-4">Add your first waiter to start managing staff</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              Add First Waiter
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {waiters.map((waiter) => (
              <div key={waiter.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {waiter.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{waiter.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Mail size={14} />
                        <span>{waiter.email}</span>
                      </div>
                      {waiter.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone size={14} />
                          <span>{waiter.phone}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{waiter.tableCount} table{waiter.tableCount !== 1 ? 's' : ''} assigned</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    waiter.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {waiter.status}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedWaiter(waiter);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Edit waiter"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedWaiter(waiter);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete waiter"
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
      {showAddModal && (
        <AddWaiterModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddWaiter}
        />
      )}

      {showEditModal && selectedWaiter && (
        <EditWaiterModal
          waiter={selectedWaiter}
          onClose={() => {
            setShowEditModal(false);
            setSelectedWaiter(null);
          }}
          onUpdate={handleEditWaiter}
        />
      )}

      {showDeleteModal && selectedWaiter && (
        <DeleteWaiterModal
          waiter={selectedWaiter}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedWaiter(null);
          }}
          onDelete={handleDeleteWaiter}
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

export default WaiterManagementPage; 