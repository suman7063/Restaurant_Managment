import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui';
import { MenuCategory } from '../types';

interface DeleteMenuCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryDeleted: () => void;
  category: MenuCategory | null;
}

const DeleteMenuCategoryModal: React.FC<DeleteMenuCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryDeleted,
  category
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!category) return;

    try {
      setIsDeleting(true);
      setError('');

      const response = await fetch(`/api/admin/menu-categories/${category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }

      onCategoryDeleted();
      onClose();
    } catch (error: unknown) {
      console.error('Error deleting category:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete category. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setError('');
      onClose();
    }
  };

  if (!category) {
    return null;
  }

  const hasMenuItems = category.menu_items_count && category.menu_items_count > 0;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Delete Category"
      showFooter={true}
      cancelText="Cancel"
      actionText={isDeleting ? "Deleting..." : "Delete Category"}
      onAction={handleDelete}
      actionDisabled={isDeleting}
      actionLoading={isDeleting}
      actionVariant="danger"
    >
      <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Warning Message */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Delete "{category.name}"?
            </h3>
            
            {hasMenuItems ? (
              <div className="space-y-3">
                <p className="text-gray-600">
                  This category contains <strong>{category.menu_items_count} menu item(s)</strong>.
                </p>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <strong>Warning:</strong> Deleting this category will also delete all associated menu items. 
                  This action cannot be undone.
                </div>
              </div>
            ) : (
              <p className="text-gray-600">
                This action cannot be undone. The category will be permanently deleted.
              </p>
            )}
          </div>


        </div>
    </Modal>
  );
};

export default DeleteMenuCategoryModal; 