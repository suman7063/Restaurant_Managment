import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import { updateMenuItem, UpdateMenuItemData } from '../../lib/database';
import { Input, Modal, Select } from '../ui';
import { MenuItem, MenuCategory } from '../types';

interface EditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMenuItemUpdated: () => void;
  menuItem: MenuItem | null;
  restaurantId: string;
}

const EditMenuItemModal: React.FC<EditMenuItemModalProps> = ({
  isOpen,
  onClose,
  onMenuItemUpdated,
  menuItem,
  restaurantId
}) => {
  const [formData, setFormData] = useState<Partial<UpdateMenuItemData>>({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    prep_time: 15,
    image: '',
    popular: false,
    available: true,
    is_veg: false,
    cuisine_type: 'Indian'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const cuisineTypes = ['Indian', 'Chinese', 'Continental', 'Italian', 'Mexican', 'Thai', 'Other'];

  // Populate form when menuItem changes
  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/admin/menu-categories?restaurantId=${restaurantId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setCategories(result.categories || []);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [restaurantId]);

  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price, // No conversion needed - prices are stored as rupees
        category_id: menuItem.category_id,
        prep_time: menuItem.prepTime,
        image: menuItem.image || '',
        popular: menuItem.popular || false,
        available: menuItem.available,
        is_veg: menuItem.is_veg || false,
        cuisine_type: menuItem.cuisine_type || 'Indian'
      });
    }
  }, [menuItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!menuItem) {
      setError('No menu item selected');
      return;
    }

    if (!formData.name?.trim()) {
      setError('Menu item name is required');
      return;
    }

    if (!formData.description?.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.category_id) {
      setError('Category is required');
      return;
    }

    if (!formData.price || formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (!formData.prep_time || formData.prep_time <= 0) {
      setError('Preparation time must be greater than 0');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // No price conversion needed - prices are stored as rupees
      const updateData: UpdateMenuItemData = {
        ...formData as UpdateMenuItemData
      };

      await updateMenuItem(menuItem.id, updateData);

      setSuccess('Menu item updated successfully!');
      
      // Wait a bit to show success message, then close and refresh
      setTimeout(() => {
        onMenuItemUpdated();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error updating menu item:', err);
      setError(err instanceof Error ? err.message : 'Failed to update menu item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateMenuItemData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!menuItem) {
    return null;
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Menu Item" 
      maxWidth="xl"
      showFooter={true}
      cancelText="Cancel"
      actionText={isLoading ? "Updating..." : "Update Menu Item"}
      onAction={() => document.querySelector('form')?.requestSubmit()}
      actionDisabled={isLoading}
      actionLoading={isLoading}
      actionVariant="primary"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Menu Item Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name *
              </label>
              <Input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter item name in English"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <Select
                value={formData.category_id || ''}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                required
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter item description in English"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              required
            />
          </div>
        </div>

        {/* Pricing and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (₹) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.price || ''}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prep Time (minutes) *
            </label>
            <Input
              type="number"
              min="1"
              value={formData.prep_time || ''}
              onChange={(e) => handleInputChange('prep_time', parseInt(e.target.value) || 15)}
              placeholder="15"
              required
            />
          </div>
        </div>

        {/* Additional Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cuisine Type
            </label>
            <Select
              value={formData.cuisine_type || 'Indian'}
              onChange={(e) => handleInputChange('cuisine_type', e.target.value)}
            >
              {cuisineTypes.map(cuisine => (
                <option key={cuisine} value={cuisine}>{cuisine}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <Input
              type="url"
              value={formData.image || ''}
              onChange={(e) => handleInputChange('image', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_veg || false}
              onChange={(e) => handleInputChange('is_veg', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Vegetarian</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.popular || false}
              onChange={(e) => handleInputChange('popular', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Popular Item</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.available !== false}
              onChange={(e) => handleInputChange('available', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Available</span>
          </label>
        </div>


      </form>
    </Modal>
  );
};

export default EditMenuItemModal;