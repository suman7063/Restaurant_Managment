import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { Modal } from '../ui';
import { Table } from '../types';
import { formatCurrency } from '../utils';

interface DeleteTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableDeleted: () => void;
  table: Table | null;
}

const DeleteTableModal: React.FC<DeleteTableModalProps> = ({
  isOpen,
  onClose,
  onTableDeleted,
  table
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDelete = async () => {
    if (!table) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/tables', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: table.id, action: 'delete' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete table');
      }

      setSuccess('Table archived successfully!');
      
      // Close modal after a short delay
      setTimeout(() => {
        onTableDeleted();
        onClose();
        setSuccess('');
      }, 1500);

    } catch (err: unknown) {
      console.error('Error deleting table:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete table. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError('');
      setSuccess('');
      onClose();
    }
  };

  if (!isOpen || !table) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Archive Table"
      disabled={isLoading}
      maxWidth="md"
      showFooter={true}
      cancelText="Cancel"
      actionText={isLoading ? "Archiving..." : "Archive Table"}
      onAction={handleDelete}
      actionDisabled={isLoading}
      actionLoading={isLoading}
      actionVariant="secondary"
    >
      <div className="p-6">
        {/* Warning Message */}
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg mb-6">
          <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-800 mb-1">Archive Table</h3>
            <p className="text-orange-700 text-sm">
              You are about to archive <strong>Table {table.table_number}</strong>. 
              The table will be hidden but can be restored later if needed. This is a safe operation.
            </p>
          </div>
        </div>

        {/* Table Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Table Details:</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Number:</span> {table.table_number}</p>
            <p><span className="font-medium">Status:</span> {table.status}</p>
            <p><span className="font-medium">Guests:</span> {table.guests}</p>
            <p><span className="font-medium">Revenue:</span> {formatCurrency(table.revenue)}</p>
            {table.waiter_name && (
              <p><span className="font-medium">Waiter:</span> {table.waiter_name}</p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}


      </div>
    </Modal>
  );
};

export default DeleteTableModal; 