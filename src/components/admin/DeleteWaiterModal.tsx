import React, { useState } from 'react';
import { X, AlertTriangle, User } from 'lucide-react';

interface Waiter {
  id: string;
  name: string;
  email: string;
  tableCount: number;
}

interface DeleteWaiterModalProps {
  waiter: Waiter;
  onClose: () => void;
  onDelete: (waiterId: string) => Promise<void>;
}

const DeleteWaiterModal: React.FC<DeleteWaiterModalProps> = ({ waiter, onClose, onDelete }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(waiter.id);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Delete Waiter</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure you want to delete this waiter?
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              This action cannot be undone. The waiter will be permanently removed from your system.
            </p>

            {/* Waiter Details */}
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {waiter.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{waiter.name}</p>
                  <p className="text-sm text-gray-600">{waiter.email}</p>
                  <p className="text-sm text-gray-600">
                    {waiter.tableCount} table{waiter.tableCount !== 1 ? 's' : ''} assigned
                  </p>
                </div>
              </div>
            </div>

            {waiter.tableCount > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This waiter is currently assigned to {waiter.tableCount} table{waiter.tableCount !== 1 ? 's' : ''}. 
                  These tables will be unassigned when the waiter is deleted.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                loading
                  ? 'bg-red-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Waiter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteWaiterModal;