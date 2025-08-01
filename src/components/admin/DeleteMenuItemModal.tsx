import React, { useState } from 'react';
import { Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { deleteMenuItem } from '../../lib/database';
import { MenuItem } from '../types';
import { Modal } from '../ui';
import { formatCurrency } from '../utils';

interface DeleteMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMenuItemDeleted: () => void;
  menuItem: MenuItem | null;
}

const DeleteMenuItemModal: React.FC<DeleteMenuItemModalProps> = ({
  isOpen,
  onClose,
  onMenuItemDeleted,
  menuItem
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDelete = async () => {
    if (!menuItem) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await deleteMenuItem(menuItem.id);

      setSuccess('Menu item deleted successfully!');
      
      // Wait a bit to show success message, then close and refresh
      setTimeout(() => {
        onMenuItemDeleted();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error deleting menu item:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete menu item');
    } finally {
      setIsLoading(false);
    }
  };

  if (!menuItem) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Delete Menu Item"
      showFooter={!success}
      cancelText="Cancel"
      actionText={isLoading ? "Deleting..." : "Delete Menu Item"}
      onAction={handleDelete}
      actionDisabled={isLoading}
      actionLoading={isLoading}
      actionVariant="danger"
    >
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Warning and Menu Item Details */}
        {!success && (
          <>
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800">Are you sure you want to delete this menu item?</h3>
                <p className="text-red-700 text-sm mt-1">
                  This action cannot be undone. The menu item will be permanently removed from your menu.
                </p>
              </div>
            </div>

            {/* Menu Item Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu Item Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-medium text-gray-900">{menuItem.name}</p>
                </div>

                <div>
                  <span className="text-gray-600">Category:</span>
                  <p className="font-medium text-gray-900">{menuItem.category?.name || menuItem.category_id}</p>
                </div>

                <div>
                  <span className="text-gray-600">Price:</span>
                  <p className="font-medium text-gray-900">{formatCurrency(menuItem.price)}</p>
                </div>

                <div>
                  <span className="text-gray-600">Prep Time:</span>
                  <p className="font-medium text-gray-900">{menuItem.prepTime} minutes</p>
                </div>

                <div>
                  <span className="text-gray-600">Type:</span>
                  <p className="font-medium text-gray-900">
                    {menuItem.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
                  </p>
                </div>

                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className="font-medium text-gray-900">
                    {menuItem.available ? 'Available' : 'Not Available'}
                  </p>
                </div>
              </div>

              {menuItem.description && (
                <div className="mt-4">
                  <span className="text-gray-600">Description:</span>
                  <p className="font-medium text-gray-900 mt-1">{menuItem.description}</p>
                </div>
              )}

              {menuItem.popular && (
                <div className="mt-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Popular Item
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Form Actions */}

      </div>
    </Modal>
  );
};

export default DeleteMenuItemModal;