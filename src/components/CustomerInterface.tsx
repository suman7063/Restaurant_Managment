"use client"
import React, { useState, useEffect } from 'react';
import { User, MenuItem, CartItem, Order, OrderItem, MenuCustomization, MenuAddOn, Language } from './types';
import { useLanguage } from './LanguageContext';
import { 
  formatCurrency, 
  calculateOrderTotal, 
  getItemStatusColor, 
  getTimeAgo,
  validatePhoneNumber,
  validateSpecialNotes
} from './utils';
import { menuService } from '../lib/database';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  X, 
  Plus, 
  Minus, 
  Edit3,
  User as UserIcon,
  Phone,
  MessageSquare
} from 'lucide-react';

interface CustomerInterfaceProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
  cart: CartItem[];
  loading: boolean;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onAddToCart: (item: MenuItem, customization?: MenuCustomization | null, addOns?: MenuAddOn[], specialNotes?: string) => void;
  onUpdateQuantity: (itemId: number, newQuantity: number) => void;
  onPlaceOrder: () => void;
}

interface CustomizationModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (customization: MenuCustomization | null, addOns: MenuAddOn[], specialNotes: string) => void;
}

const CustomizationModal: React.FC<CustomizationModalProps> = ({ 
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

  const handleAdd = () => {
    onAdd(selectedCustomization, selectedAddOns, specialNotes);
    onClose();
    // Reset form
    setSelectedCustomization(null);
    setSelectedAddOns([]);
    setSpecialNotes('');
    setQuantity(1);
  };

  const toggleAddOn = (addOn: MenuAddOn) => {
    setSelectedAddOns(prev => 
      prev.find(a => a.id === addOn.id)
        ? prev.filter(a => a.id !== addOn.id)
        : [...prev, addOn]
    );
  };

  const calculateItemPrice = () => {
    let price = item.price;
    if (selectedCustomization) {
      price += selectedCustomization.price_variation;
    }
    selectedAddOns.forEach(addOn => {
      price += addOn.price;
    });
    return price * quantity;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {getLocalizedName(item)}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {getTranslation('quantity')}
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <Minus size={16} />
              </button>
              <span className="text-lg font-medium w-8 text-center">{quantity}</span>
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
              <label className="block text-sm font-medium mb-2">
                {getTranslation('customize')}
              </label>
              <div className="space-y-2">
                {item.customizations.map((customization) => (
                  <label key={customization.id} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="customization"
                      value={customization.id}
                      checked={selectedCustomization?.id === customization.id}
                      onChange={() => setSelectedCustomization(customization)}
                      className="text-blue-600"
                    />
                                         <span className="flex-1">
                       {getLocalizedName(customization)}
                     </span>
                    {customization.price_variation > 0 && (
                      <span className="text-sm text-gray-600">
                        +{formatCurrency(customization.price_variation)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.add_ons && item.add_ons.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {getTranslation('add_ons')}
              </label>
              <div className="space-y-2">
                {item.add_ons.map((addOn) => (
                  <label key={addOn.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedAddOns.some(a => a.id === addOn.id)}
                      onChange={() => toggleAddOn(addOn)}
                      className="text-blue-600"
                    />
                                         <span className="flex-1">
                       {getLocalizedName(addOn)}
                     </span>
                    <span className="text-sm text-gray-600">
                      +{formatCurrency(addOn.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Special Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              {getTranslation('special_notes')}
            </label>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="Any special requests? (e.g., less spicy, extra sauce, no onions)"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {specialNotes.length}/200 characters
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{getTranslation('total')}:</span>
              <span className="text-lg font-bold">{formatCurrency(calculateItemPrice())}</span>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {getTranslation('add_to_cart')}
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomerInterface: React.FC<CustomerInterfaceProps> = ({
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
  const { getTranslation, getLocalizedName, getLocalizedDescription, language, setLanguage } = useLanguage();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [customizationModal, setCustomizationModal] = useState<{
    isOpen: boolean;
    item: MenuItem | null;
  }>({ isOpen: false, item: null });
  const [showOrderTracking, setShowOrderTracking] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const items = await menuService.getAllMenuItems();
        setMenuItems(items);
      } catch (error) {
        console.error("Failed to fetch menu items:", error);
        // Optionally, set an error state or display a message to the user
      }
    };

    fetchMenuItems();
  }, []);

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const handleAddToCart = (item: MenuItem) => {
    if (item.customizations || item.add_ons) {
      setCustomizationModal({ isOpen: true, item });
    } else {
      onAddToCart(item);
    }
  };

  const handleCustomizationAdd = (customization: MenuCustomization | null, addOns: MenuAddOn[], specialNotes: string) => {
    if (customizationModal.item) {
      onAddToCart(customizationModal.item, customization, addOns, specialNotes);
    }
  };

  const handleCheckout = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please provide your name and phone number');
      return;
    }
    if (!validatePhoneNumber(customerPhone)) {
      alert('Please enter a valid phone number');
      return;
    }
    setShowCheckout(true);
  };

  const handlePlaceOrder = () => {
    onPlaceOrder();
    setShowCheckout(false);
    setCustomerName('');
    setCustomerPhone('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getTranslation('welcome')}
              </h1>
              <p className="text-gray-600">Table {currentUser.table}</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="kn">ಕನ್ನಡ</option>
              </select>
              
              {/* Cart Icon */}
              <button
                onClick={() => setShowCheckout(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <ShoppingCart size={24} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setCurrentUser(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Category Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
                             {getLocalizedName(category)}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-4xl">🍽️</span>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">
                    {getLocalizedName(item)}
                  </h3>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(item.price)}
                  </span>
                </div>
                                 <p className="text-gray-600 text-sm mb-3">
                   {getLocalizedDescription(item)}
                 </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      ⏱️ {item.prepTime} min
                    </span>
                    {item.popular && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        Popular
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {getTranslation('add_to_cart')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Checkout</h3>
                <button onClick={() => setShowCheckout(false)} className="text-gray-500">
                  <X size={20} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Your cart is empty</p>
                </div>
              ) : (
                <>
                  {/* Customer Details */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      <UserIcon size={16} className="inline mr-2" />
                      Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-3 border text-black border-gray-300 rounded-lg"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      <Phone size={16} className="inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-3 border text-black border-gray-300 rounded-lg"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  {/* Cart Items */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Order Summary</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                                                         <p className="font-medium">{getLocalizedName(item)}</p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                            {item.special_notes && (
                              <p className="text-xs text-gray-500">
                                <MessageSquare size={12} className="inline mr-1" />
                                {item.special_notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Minus size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{getTranslation('total')}:</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(calculateOrderTotal(cart))}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading || !customerName.trim() || !customerPhone.trim()}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                  >
                    {loading ? getTranslation('loading') : getTranslation('place_order')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      <CustomizationModal
        item={customizationModal.item!}
        isOpen={customizationModal.isOpen}
        onClose={() => setCustomizationModal({ isOpen: false, item: null })}
        onAdd={handleCustomizationAdd}
      />
    </div>
  );
};

export default CustomerInterface;