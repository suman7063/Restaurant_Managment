import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Table } from '../types';
import { Input, Select, Modal } from '../ui';

interface EditTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableUpdated: () => void;
  table: Table | null;
  restaurantId: string;
}

const EditTableModal: React.FC<EditTableModalProps> = ({
  isOpen,
  onClose,
  onTableUpdated,
  table,
  restaurantId
}) => {
  const [formData, setFormData] = useState({
    table_number: '',
    status: 'available' as 'available' | 'occupied' | 'needs_reset',
    waiter_id: '',
    guests: 0,
    revenue: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update form data when table prop changes
  useEffect(() => {
    if (table) {
      setFormData({
        table_number: table.table_number.toString(),
        status: table.status,
        waiter_id: table.waiter_id || '',
        guests: table.guests,
        revenue: table.revenue
      });
    }
  }, [table]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!table) return;

    const number = parseInt(formData.table_number);
    if (isNaN(number) || number <= 0) {
      setError('Table number must be a positive number');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/tables', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: table.id,
          table_number: number,
          status: formData.status,
          waiter_id: formData.waiter_id || null,
          guests: formData.guests,
          revenue: formData.revenue
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update table');
      }

      setSuccess('Table updated successfully!');
      
      // Close modal after a short delay
      setTimeout(() => {
        onTableUpdated();
        onClose();
        setSuccess('');
      }, 1500);

    } catch (err: any) {
      console.error('Error updating table:', err);
      setError(err.message || 'Failed to update table. Please try again.');
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

  const handleResetTable = async () => {
    if (!table) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/tables', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: table.id,
          status: 'available',
          waiter_id: null,
          guests: 0,
          revenue: 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset table');
      }

      setSuccess('Table reset successfully!');
      setFormData(prev => ({
        ...prev,
        status: 'available',
        waiter_id: '',
        guests: 0,
        revenue: 0
      }));
      
      setTimeout(() => {
        onTableUpdated();
        setSuccess('');
      }, 1500);

    } catch (err: any) {
      console.error('Error resetting table:', err);
      setError(err.message || 'Failed to reset table. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !table) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit Table ${table.table_number}`}
      disabled={isLoading}
      maxWidth="md"
      showFooter={true}
      cancelText="Cancel"
      actionText={isLoading ? "Saving..." : "Save Changes"}
      onAction={() => document.querySelector('form')?.requestSubmit()}
      actionDisabled={isLoading}
      actionLoading={isLoading}
      actionVariant="primary"
    >
      <div className="p-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Table Number */}
          <Input  
            type="number"
            label="Table Number"
            value={formData.table_number}
            onChange={(e) => setFormData(prev => ({ ...prev, table_number: e.target.value }))}
            disabled={isLoading}
            min="1"
          />

          {/* Status */}
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
            disabled={isLoading}
          >
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="needs_reset">Needs Reset</option>
          </Select>

          {/* Waiter Assignment */}
          <Input
            type="text"
            label="Assigned Waiter"
            value={formData.waiter_id}
            onChange={(e) => setFormData(prev => ({ ...prev, waiter_id: e.target.value }))}
            placeholder="Enter waiter ID or leave empty"
            disabled={isLoading}
          />

          {/* Guests */}
          <Input
            type="number"
            label="Number of Guests"
            value={formData.guests}
            onChange={(e) => setFormData(prev => ({ ...prev, guests: parseInt(e.target.value) || 0 }))}
            disabled={isLoading}
            min="0"
          />

          {/* Revenue */}
          <Input
            type="number"
            label="Revenue (₹)"
            value={formData.revenue}
            onChange={(e) => setFormData(prev => ({ ...prev, revenue: parseFloat(e.target.value) || 0 }))}
            disabled={isLoading}
            min="0"
            step="0.01"
          />

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          {/* Reset Button */}
          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={handleResetTable}
              disabled={isLoading}
              className="px-6 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Table
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditTableModal; 