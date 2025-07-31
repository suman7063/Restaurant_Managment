import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Table } from '../types';

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
        body: JSON.stringify({ id: table.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete table');
      }

      setSuccess('Table deleted successfully!');
      
      // Close modal after a short delay
      setTimeout(() => {
        onTableDeleted();
        onClose();
        setSuccess('');
      }, 1500);

    } catch (err: any) {
      console.error('Error deleting table:', err);
      setError(err.message || 'Failed to delete table. Please try again.');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Delete Table</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning Message */}
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800 mb-1">Are you sure?</h3>
            <p className="text-red-700 text-sm">
              You are about to delete <strong>Table {table.table_number}</strong>. 
              This action cannot be undone and will permanently remove the table from your restaurant.
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
            <p><span className="font-medium">Revenue:</span> ₹{table.revenue.toFixed(2)}</p>
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

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Table
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTableModal; 