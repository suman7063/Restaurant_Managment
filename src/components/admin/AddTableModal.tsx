import React, { useState } from 'react';
import { Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { createTable, generateQRCode } from '../../lib/database';
import { Input, Modal } from '../ui';

interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableAdded: () => void;
  restaurantId: string;
}

const AddTableModal: React.FC<AddTableModalProps> = ({
  isOpen,
  onClose,
  onTableAdded,
  restaurantId
}) => {
  const [tableNumber, setTableNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableNumber.trim()) {
      setError('Table number is required');
      return;
    }

    const number = parseInt(tableNumber);
    if (isNaN(number) || number <= 0) {
      setError('Table number must be a positive number');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Generate QR code
      const qrCode = generateQRCode(number, restaurantId);

      // Create table (duplicate checking will be handled by the API)
      await createTable({
        table_number: number,
        qr_code: qrCode,
        restaurant_id: restaurantId,
        status: 'available',
        guests: 0,
        revenue: 0
      });

      setSuccess(`Table ${number} created successfully!`);
      setTableNumber('');
      
      // Close modal after a short delay
      setTimeout(() => {
        onTableAdded();
        onClose();
        setSuccess('');
      }, 1500);

    } catch (err) {
      console.error('Error creating table:', err);
      setError('Failed to create table. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setTableNumber('');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Table"
      disabled={isLoading}
      maxWidth="md"
      showFooter={true}
      cancelText="Cancel"
      actionText={isLoading ? "Creating..." : "Create Table"}
      onAction={() => document.querySelector('form')?.requestSubmit()}
      actionDisabled={isLoading || !tableNumber.trim()}
      actionLoading={isLoading}
      actionVariant="primary"
    >
      <div className="p-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Table Number Input */}
          <Input
            type="number"
            label="Table Number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="Enter table number"
            disabled={isLoading}
            min="1"
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


        </form>
      </div>
    </Modal>
  );
};

export default AddTableModal; 