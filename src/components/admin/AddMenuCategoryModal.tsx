import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Modal } from '../ui';

interface AddMenuCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded: () => void;
  restaurantId: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  is_active: boolean;
}

const AddMenuCategoryModal: React.FC<AddMenuCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryAdded,
  restaurantId
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch('/api/admin/menu-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          restaurant_id: restaurantId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create category');
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        is_active: true
      });
      
      onCategoryAdded();
      onClose();
    } catch (error: unknown) {
      console.error('Error creating category:', error);
      setError(error instanceof Error ? error.message : 'Failed to create category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        description: '',
        is_active: true
      });
      setError('');
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Add Menu Category"
      showFooter={true}
      cancelText="Cancel"
      actionText={isSubmitting ? "Creating..." : "Create Category"}
      onAction={() => document.querySelector('form')?.requestSubmit()}
      actionDisabled={isSubmitting || !formData.name.trim()}
      actionLoading={isSubmitting}
      actionVariant="primary"
    >
      <div className="space-y-4">

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Category Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Appetizers, Main Course, Desserts"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of this category..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.is_active}
                  onChange={() => setFormData(prev => ({ ...prev, is_active: true }))}
                  disabled={isSubmitting}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={!formData.is_active}
                  onChange={() => setFormData(prev => ({ ...prev, is_active: false }))}
                  disabled={isSubmitting}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Inactive</span>
              </label>
            </div>
          </div>


        </form>
      </div>
    </Modal>
  );
};

export default AddMenuCategoryModal; 