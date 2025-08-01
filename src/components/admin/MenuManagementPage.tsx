import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, RefreshCw, Trash2, ChefHat, Timer, Star, Utensils } from 'lucide-react';
import { fetchMenuItems } from '../../lib/database';
import { AddMenuItemModal, EditMenuItemModal, DeleteMenuItemModal } from './';
import { Input } from '../ui';
import { MenuItem as MenuItemType } from '../types';
import { formatCurrency } from '../utils';

interface MenuManagementPageProps {
  restaurantId: string;
}

const MenuManagementPage: React.FC<MenuManagementPageProps> = ({ restaurantId }) => {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItemType | null>(null);
  const [error, setError] = useState('');

  const loadMenuItems = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      const items = await fetchMenuItems(restaurantId);
      setMenuItems(items);
    } catch (err) {
      console.error('Error loading menu items:', err);
      setError('Failed to load menu items');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  const handleMenuItemAdded = useCallback(() => {
    loadMenuItems(true);
  }, [loadMenuItems]);

  const handleMenuItemUpdated = useCallback(() => {
    loadMenuItems(true);
  }, [loadMenuItems]);

  const handleMenuItemDeleted = useCallback(() => {
    loadMenuItems(true);
  }, [loadMenuItems]);

  const handleEditMenuItem = (menuItem: MenuItemType) => {
    setSelectedMenuItem(menuItem);
    setIsEditModalOpen(true);
  };

  const handleDeleteMenuItem = (menuItem: MenuItemType) => {
    setSelectedMenuItem(menuItem);
    setIsDeleteModalOpen(true);
  };

  // Extract unique categories from menu items
  const categories = Array.from(new Set(menuItems.map(item => item.category?.name || item.category_id))).sort();

  // Filter menu items based on search and filters
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category?.name === categoryFilter || item.category_id === categoryFilter;
    const matchesAvailability = availabilityFilter === 'all' || 
                               (availabilityFilter === 'available' && item.available) ||
                               (availabilityFilter === 'unavailable' && !item.available);
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Group items by category for display
  const groupedItems = filteredMenuItems.reduce((groups, item) => {
    const categoryName = item.category?.name || item.category_id;
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(item);
    return groups;
  }, {} as Record<string, MenuItemType[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">Manage your restaurant menu items</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => loadMenuItems(true)}
            disabled={isRefreshing}
            className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Loading...' : 'Refresh'}
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Add Menu Item
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          >
            <option value="all">All Items</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="space-y-6">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 text-gray-300 mx-auto mb-4 flex items-center justify-center">
              <Utensils className="w-16 h-16" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                {category} ({items.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {/* Item Image */}
                    {item.image && (
                      <div className="mb-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {item.name}
                        </h3>
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(item.price)}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm line-clamp-2">
                        {item.description}
                      </p>

                      {/* Item Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Timer className="w-4 h-4" />
                          <span>{item.prepTime} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          <span>{item.rating.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ChefHat className="w-4 h-4" />
                          <span>{item.cuisine_type}</span>
                        </div>
                      </div>

                      {/* Item Tags */}
                      <div className="flex flex-wrap gap-2">
                        {item.is_veg && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Vegetarian
                          </span>
                        )}
                        {item.popular && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Popular
                          </span>
                        )}
                        {!item.available && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Unavailable
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleEditMenuItem(item)}
                          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-1 text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-1 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <AddMenuItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onMenuItemAdded={handleMenuItemAdded}
        restaurantId={restaurantId}
      />

      <EditMenuItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onMenuItemUpdated={handleMenuItemUpdated}
        menuItem={selectedMenuItem}
        restaurantId={restaurantId}
      />

      <DeleteMenuItemModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onMenuItemDeleted={handleMenuItemDeleted}
        menuItem={selectedMenuItem}
      />
    </div>
  );
};

export default MenuManagementPage; 