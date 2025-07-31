import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, User, Mail, Phone } from 'lucide-react';
import AddWaiterModal from './AddWaiterModal';
import EditWaiterModal from './EditWaiterModal';
import DeleteWaiterModal from './DeleteWaiterModal';
import SimpleToast from './SimpleToast';


interface AssignedTable {
  id: string;
  table_number: number;
  status: 'available' | 'occupied' | 'needs_reset';
}

interface Waiter {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  tableCount: number;
  assignedTables: AssignedTable[];
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive';
}

interface WaiterFormData {
  name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  id?: string;
  password?: string;
}

interface WaiterManagementPageProps {
  restaurantId: string;
}

const WaiterManagementPage: React.FC<WaiterManagementPageProps> = ({ restaurantId }) => {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const fetchWaiters = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!restaurantId || restaurantId.trim() === '') {
        setWaiters([]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/waiters?restaurantId=${restaurantId}`);
      
      if (response.ok) {
        const data = await response.json();
        setWaiters(data.waiters || []);
      } else {
        setWaiters([]);
        setNotification({
          message: 'Failed to load waiters. Please try again.',
          type: 'error'
        });
      }
    } catch (error: unknown) {
      console.error('Error fetching waiters:', error);
      setWaiters([]);
      setNotification({
        message: error instanceof Error ? error.message : 'Failed to load waiters. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId && restaurantId.trim() !== '') {
      fetchWaiters();
    } else {
      setIsLoading(false);
    }
  }, [restaurantId, fetchWaiters]);

  const handleAddWaiter = async (waiterData: WaiterFormData) => {
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
    } catch (error: unknown) {
      console.error('Error adding waiter:', error);
      setNotification({
        message: error instanceof Error ? error.message : 'Failed to add waiter. Please try again.',
        type: 'error'
      });
    }
  };

  const handleEditWaiter = async (waiterData: WaiterFormData) => {
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
    } catch (error: unknown) {
      console.error('Error updating waiter:', error);
      setNotification({
        message: error instanceof Error ? error.message : 'Failed to update waiter. Please try again.',
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
    } catch (error: unknown) {
      console.error('Error deleting waiter:', error);
      setNotification({
        message: error instanceof Error ? error.message : 'Failed to delete waiter. Please try again.',
        type: 'error'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Waiter Management</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/>
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
          className="bg-gradient-to-r from-purple-400 to-purple-600  text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
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
              className="mt-4 bg-gradient-to-r from-purple-400 to-purple-600 shadow-lg text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Add Your First Waiter
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {waiters.map((waiter) => (
              <div key={waiter.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
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
                      ? 'bg-purple-100 text-purple-600' 
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
                      className="text-purple-600 hover:text-purple-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
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
      <AddWaiterModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddWaiter}
      />

      {selectedWaiter && (
        <EditWaiterModal
          isOpen={showEditModal}
          waiter={selectedWaiter}
          onClose={() => {
            setShowEditModal(false);
            setSelectedWaiter(null);
          }}
          onUpdate={handleEditWaiter}
        />
      )}

      {selectedWaiter && (
        <DeleteWaiterModal
          isOpen={showDeleteModal}
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