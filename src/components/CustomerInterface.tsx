"use client"
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, MenuItem, CartItem, MenuCustomization, MenuAddOn } from './types';
import { useLanguage } from './LanguageContext';
import { 
  formatCurrency, 
  calculateOrderTotal, 
  debounce,
  searchItems,
  sortItems
} from './utils';
import { menuService } from '../lib/database';
import { Input, Select } from './ui';
import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  User as UserIcon,
  Search,
  Filter
} from 'lucide-react';

interface CustomerInterfaceProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
  cart: CartItem[];
  loading: boolean;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onAddToCart: (item: MenuItem, customization?: MenuCustomization | null, addOns?: MenuAddOn[], specialNotes?: string) => void;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onPlaceOrder: () => void;
}

interface CustomizationModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (customization: MenuCustomization | null, addOns: MenuAddOn[], specialNotes: string) => void;
}

// Memoized CustomizationModal component
const CustomizationModal: React.FC<CustomizationModalProps> = React.memo(({ 
  item, 
  isOpen, 
  onClose, 
  onAdd 
}) => {
  const { getTranslation, getLocalizedName, language } = useLanguage();
  const [selectedCustomization, setSelectedCustomization] = useState<MenuCustomization | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<MenuAddOn[]>([]);
  const [specialNotes, setSpecialNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedCustomization(null);
      setSelectedAddOns([]);
      setSpecialNotes('');
      setQuantity(1);
    }
  }, [isOpen]);

  const handleAdd = useCallback(() => {
    onAdd(selectedCustomization, selectedAddOns, specialNotes);
    onClose();
  }, [selectedCustomization, selectedAddOns, specialNotes, onAdd, onClose]);

  const toggleAddOn = useCallback((addOn: MenuAddOn) => {
    setSelectedAddOns(prev => 
      prev.find(a => a.id === addOn.id)
        ? prev.filter(a => a.id !== addOn.id)
        : [...prev, addOn]
    );
  }, []);

  const calculateItemPrice = useMemo(() => {
    let price = item.price;
    if (selectedCustomization) {
      price += selectedCustomization.price_variation;
    }
    selectedAddOns.forEach(addOn => {
      price += addOn.price;
    });
    return price * quantity;
  }, [item.price, selectedCustomization, selectedAddOns, quantity]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {getLocalizedName({ name: item.name, name_hi: item.name_hi || '', name_kn: item.name_kn || '' })}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>

          {/* Quantity Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getTranslation('quantity')}
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <Minus size={16} />
              </button>
              <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Customizations */}
          {item.customizations && item.customizations.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getTranslation('customizations')}
              </label>
              <div className="space-y-2">
                {item.customizations.map((customization) => (
                  <label key={customization.id} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="customization"
                      value={customization.id}
                      checked={selectedCustomization?.id === customization.id}
                      onChange={() => setSelectedCustomization(customization)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">
                      {getLocalizedName({ name: customization.name, name_hi: customization.name_hi || '', name_kn: customization.name_kn || '' })} 
                      {customization.price_variation > 0 && (
                        <span className="text-green-600 ml-1">
                          (+{formatCurrency(customization.price_variation)})
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.add_ons && item.add_ons.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getTranslation('addOns')}
              </label>
              <div className="space-y-2">
                {item.add_ons.map((addOn) => (
                  <label key={addOn.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedAddOns.some(a => a.id === addOn.id)}
                      onChange={() => toggleAddOn(addOn)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">
                      {getLocalizedName({ name: addOn.name, name_hi: addOn.name_hi || '', name_kn: addOn.name_kn || '' })} 
                      <span className="text-green-600 ml-1">
                        (+{formatCurrency(addOn.price)})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Special Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getTranslation('specialNotes')}
            </label>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder={getTranslation('specialNotesPlaceholder')}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {specialNotes.length}/200
            </div>
          </div>

          {/* Total Price */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-semibold">{getTranslation('total')}:</span>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(calculateItemPrice)}
            </span>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {getTranslation('addToCart')}
          </button>
        </div>
      </div>
    </div>
  );
});

CustomizationModal.displayName = 'CustomizationModal';

// Memoized CustomerInterface component
const CustomerInterface: React.FC<CustomerInterfaceProps> = React.memo(({
  currentUser,
  setCurrentUser,
  cart,
  loading,
  selectedCategory,
  setSelectedCategory,
  onAddToCart,
  onUpdateQuantity,
  onPlaceOrder
}) => {
  const { getTranslation, getLocalizedName } = useLanguage();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Memoized cart total
  const cartTotal = useMemo(() => calculateOrderTotal(cart), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  // Memoized categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(menuItems.map(item => item.category))];
    return cats.sort();
  }, [menuItems]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const items = await menuService.getAllMenuItems();
        setMenuItems(items);
        setFilteredItems(items);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };

    fetchMenuItems();
  }, []);

  // Filter and sort items
  useEffect(() => {
    let filtered = menuItems;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = searchItems(filtered, searchTerm, ['name', 'description']);
    }

    // Sort items
    filtered = sortItems(filtered, sortBy, sortDirection);

    setFilteredItems(filtered);
  }, [menuItems, selectedCategory, searchTerm, sortBy, sortDirection]);

  // Handle add to cart
  const handleAddToCart = useCallback((item: MenuItem) => {
    if (item.customizations && item.customizations.length > 0 || 
        item.add_ons && item.add_ons.length > 0) {
      setSelectedItem(item);
      setShowCustomizationModal(true);
    } else {
      onAddToCart(item);
    }
  }, [onAddToCart]);

  // Handle customization add
  const handleCustomizationAdd = useCallback((customization: MenuCustomization | null, addOns: MenuAddOn[], specialNotes: string) => {
    if (selectedItem) {
      onAddToCart(selectedItem, customization, addOns, specialNotes);
    }
  }, [selectedItem, onAddToCart]);

  // Handle checkout
  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      return;
    }
    setShowCheckout(true);
  }, [cart]);

  // Handle place order
  const handlePlaceOrder = useCallback(() => {
    onPlaceOrder();
    setShowCheckout(false);
  }, [onPlaceOrder]);

  // Handle logout
  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, [setCurrentUser]);

  // Memoized cart items
  const cartItems = useMemo(() => 
    cart.map(item => (
      <div key={item.id} className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex-1">
          <h4 className="font-semibold">{getLocalizedName({ name: item.name, name_hi: item.name_hi || '', name_kn: item.name_kn || '' })}</h4>
          <p className="text-sm text-gray-600">
            {formatCurrency(item.price)} x {item.quantity}
          </p>
          {item.special_notes && (
            <p className="text-xs text-gray-500 mt-1">{item.special_notes}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    )), [cart, getLocalizedName, onUpdateQuantity]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {getTranslation('restaurantName')}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <UserIcon size={16} />
                <span>{currentUser.name}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-800"
            >
              {getTranslation('logout')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={20} />
                    <Input
                      type="text"
                      placeholder={getTranslation('searchMenu')}
                      onChange={(e) => debouncedSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {getTranslation(category)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={`${sortBy}-${sortDirection}`}
                    onChange={(e) => {
                      const [sort, direction] = e.target.value.split('-') as [typeof sortBy, typeof sortDirection];
                      setSortBy(sort);
                      setSortDirection(direction);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="name-asc">{getTranslation('sortByName')}</option>
                    <option value="price-asc">{getTranslation('sortByPriceLow')}</option>
                    <option value="price-desc">{getTranslation('sortByPriceHigh')}</option>
                    <option value="rating-desc">{getTranslation('sortByRating')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={getLocalizedName({ name: item.name, name_hi: item.name_hi || '', name_kn: item.name_kn || '' })}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{getLocalizedName({ name: item.name, name_hi: item.name_hi || '', name_kn: item.name_kn || '' })}</h3>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {getLocalizedName({ name: item.description, name_hi: item.description_hi || '', name_kn: item.description_kn || '' })}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          ⭐ {item.rating}
                        </span>
                        <span className="text-sm text-gray-500">
                          ⏱️ {item.prepTime}min
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {getTranslation('add')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">{getTranslation('noItemsFound')}</p>
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm sticky top-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{getTranslation('yourOrder')}</h2>
                  <div className="flex items-center space-x-2">
                    <ShoppingCart size={20} />
                    <span className="text-sm text-gray-600">({cartItemCount})</span>
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {cartItems}
              </div>

              <div className="p-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">{getTranslation('total')}:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? getTranslation('processing') : getTranslation('placeOrder')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {selectedItem && (
        <CustomizationModal
          item={selectedItem}
          isOpen={showCustomizationModal}
          onClose={() => {
            setShowCustomizationModal(false);
            setSelectedItem(null);
          }}
          onAdd={handleCustomizationAdd}
        />
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">{getTranslation('confirmOrder')}</h3>
              <div className="space-y-2 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{getLocalizedName({ name: item.name, name_hi: item.name_hi || '', name_kn: item.name_kn || '' })} x {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between font-semibold">
                  <span>{getTranslation('total')}:</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  {getTranslation('cancel')}
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? getTranslation('processing') : getTranslation('confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

CustomerInterface.displayName = 'CustomerInterface';

export default CustomerInterface;