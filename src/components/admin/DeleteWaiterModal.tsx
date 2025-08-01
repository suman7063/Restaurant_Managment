import React, { useState } from 'react';
import { AlertTriangle, User } from 'lucide-react';
import { Modal } from '../ui';

interface Waiter {
  id: string;
  name: string;
  email: string;
  tableCount: number;
}

interface DeleteWaiterModalProps {
  isOpen: boolean;
  waiter: Waiter;
  onClose: () => void;
  onDelete: (waiterId: string) => Promise<void>;
}

const DeleteWaiterModal: React.FC<DeleteWaiterModalProps> = ({ isOpen, waiter, onClose, onDelete }) => {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Waiter"
      disabled={loading}
      showFooter={true}
      cancelText="Cancel"
      actionText={loading ? "Deleting..." : "Delete Waiter"}
      onAction={handleDelete}
      actionDisabled={loading}
      actionLoading={loading}
      actionVariant="danger"
    >
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


        </div>
    </Modal>
  );
};

export default DeleteWaiterModal;