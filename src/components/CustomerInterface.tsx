"use client"
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, MenuItem, CartItem, MenuCustomization, MenuAddOn, Session, SessionCustomer, Order } from './types';

import { 
  formatCurrency, 
  calculateOrderTotal, 
  debounce,
  searchItems,
  sortItems
} from './utils';
import { menuService, sessionService } from '../lib/database';
import { supabase } from '../lib/supabase';
import { Input, Select, Modal } from './ui';
import { GroupOrderDisplay } from './GroupOrderDisplay';
import { SessionInfoHeader } from './SessionInfoHeader';
import { ParticipantsList } from './ParticipantsList';
import { SessionTotal } from './SessionTotal';
import SessionOrdersDisplay from './SessionOrdersDisplay';
import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  User as UserIcon,
  Search,
  Filter,
  Trash2,
  Leaf,
  Beef,
  Users,
  Clock,
  RefreshCw,
  Eye,
  Menu as MenuIcon,
  Group,
  DollarSign,
  Package
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
  // Session management props
  session?: Session | null;
  currentCustomer?: SessionCustomer | null;
  sessionOrders?: Order[];
  sessionParticipants?: SessionCustomer[];
  onJoinSession?: (otp: string, customerData: { name: string; phone: string }) => Promise<boolean>;
  onRegenerateOTP?: () => Promise<void>;
  onRequestBill?: () => Promise<void>;
  onCloseSession?: () => Promise<void>;
  onRefreshSession?: () => Promise<void>;
  onCopyOTP?: () => Promise<void>;
  onShareSession?: () => Promise<void>;
  onShareBill?: () => Promise<void>;
  onDownloadBill?: () => Promise<void>;
  onPrintBill?: () => Promise<void>;
  onExitSession?: () => Promise<void>;
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.name}
      maxWidth="md"
    >
      <div className="p-6">

          {/* Quantity Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
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
                Customizations
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
                      {customization.name} 
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
                Add-ons
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
                      {addOn.name} 
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
              Special Notes
            </label>
            <textarea
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="Any special requests or notes..."
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
            <span className="text-lg font-semibold">Total:</span>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(calculateItemPrice)}
            </span>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Add to Cart
          </button>
        </div>
    </Modal>
  );
});

CustomizationModal.displayName = 'CustomizationModal';

// CustomerInterface component
const CustomerInterface: React.FC<CustomerInterfaceProps> = ({
  currentUser,
  setCurrentUser,
  cart,
  loading,
  selectedCategory,
  setSelectedCategory,
  onAddToCart,
  onUpdateQuantity,
  onPlaceOrder,
  session,
  currentCustomer,
  sessionOrders = [],
  sessionParticipants = [],
  onJoinSession,
  onRegenerateOTP,
  onRequestBill,
  onCloseSession,
  onRefreshSession,
  onCopyOTP,
  onShareSession,
  onShareBill,
  onDownloadBill,
  onPrintBill,
  onExitSession
}) => {

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Session and view management
  const [currentView, setCurrentView] = useState<'menu' | 'group' | 'orders'>('menu');
  const [sessionLoading, setSessionLoading] = useState(false);
  const [showSessionInfo, setShowSessionInfo] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Show 12 items per page
  const [showLoadMore, setShowLoadMore] = useState(false); // Alternative to pagination
  const [showMobileCart, setShowMobileCart] = useState(false); // Mobile cart drawer

  // Memoized cart total
  const cartTotal = useMemo(() => calculateOrderTotal(cart), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  
  // Session-related computed values
  const isInSession = useMemo(() => !!session && !!currentCustomer, [session, currentCustomer]);
  const sessionDuration = useMemo(() => {
    if (!session || !session.created_at) return '';
    const now = new Date();
    const createdAt = typeof session.created_at === 'string' 
      ? new Date(session.created_at) 
      : session.created_at;
    const diff = now.getTime() - createdAt.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }, [session]);

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);
  
  // Load more logic (alternative to pagination)
  const itemsToShow = showLoadMore ? filteredItems : currentItems;

  // State for categories and filters
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (currentUser?.restaurant_id) {
        try {
          const { data, error } = await supabase
            .from('restaurant_menu_categories')
            .select('id, name')
            .eq('restaurant_id', currentUser.restaurant_id)
            .is('deleted_at', null)
            .order('name', { ascending: true });

          if (error) {
            console.error('Error fetching categories:', error);
            return;
          }

          console.log('Fetched categories:', data);
          setCategories(data || []);
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      }
    };

    fetchCategories();
  }, [currentUser?.restaurant_id]);

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
        // Use restaurant-specific menu items if we have a restaurant ID
        if (currentUser?.restaurant_id) {
          const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', currentUser.restaurant_id)
            .eq('available', true)
            .is('deleted_at', null)
            .order('category_id', { ascending: true });

          if (error) {
            console.error('Error fetching menu items:', error);
            return;
          }

          const items = data?.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            price: item.price,
            category_id: item.category_id,
            prepTime: item.prep_time,
            rating: item.rating,
            image: item.image,
            popular: item.popular,
            available: item.available,
            kitchen_stations: item.kitchen_stations || [],
            is_veg: item.is_veg || false,
            cuisine_type: item.cuisine_type || 'Indian',
            customizations: item.customizations || [],
            add_ons: item.add_ons || []
          })) || [];

          setMenuItems(items);
          setFilteredItems(items);
        } else {
          // Fallback to all menu items if no restaurant ID
          const items = await menuService.getAllMenuItems();
          setMenuItems(items);
          setFilteredItems(items);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      }
    };

    fetchMenuItems();
  }, [currentUser?.restaurant_id]);

  // Filter and sort items
  useEffect(() => {
    let filtered = menuItems;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category_id === selectedCategory);
    }

    // Filter by veg/non-veg
    if (vegFilter !== 'all') {
      if (vegFilter === 'veg') {
        filtered = filtered.filter(item => item.is_veg === true);
      } else if (vegFilter === 'non-veg') {
        filtered = filtered.filter(item => item.is_veg === false);
      }
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = searchItems(filtered, searchTerm, ['name', 'description']);
    }

    // Sort items
    filtered = sortItems(filtered, sortBy, sortDirection);

    setFilteredItems(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [menuItems, selectedCategory, vegFilter, searchTerm, sortBy, sortDirection]);

  // Handle add to cart
  const handleAddToCart = useCallback((item: MenuItem) => {
    if (item.customizations && item.customizations.length > 0 || 
        item.add_ons && item.add_ons.length > 0) {
      setSelectedItem(item);
      setShowCustomizationModal(true);
    } else {
      // Check if item already exists in cart
      const existingItem = cart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        // Update quantity of existing item
        onUpdateQuantity(item.id, existingItem.quantity + 1);
      } else {
        // Add new item
        onAddToCart(item);
      }
    }
  }, [onAddToCart, onUpdateQuantity, cart]);

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
  
  // Session management handlers
  const handleViewToggle = useCallback(() => {
    setCurrentView(prev => prev === 'menu' ? 'group' : 'menu');
  }, []);
  
  const handleRefreshSession = useCallback(async () => {
    if (onRefreshSession) {
      setSessionLoading(true);
      try {
        await onRefreshSession();
      } catch (error) {
        console.error('Error refreshing session:', error);
      } finally {
        setSessionLoading(false);
      }
    }
  }, [onRefreshSession]);
  
  const handleRegenerateOTP = useCallback(async () => {
    if (onRegenerateOTP) {
      setSessionLoading(true);
      try {
        await onRegenerateOTP();
      } catch (error) {
        console.error('Error regenerating OTP:', error);
      } finally {
        setSessionLoading(false);
      }
    }
  }, [onRegenerateOTP]);
  
  const handleRequestBill = useCallback(async () => {
    if (onRequestBill) {
      setSessionLoading(true);
      try {
        await onRequestBill();
      } catch (error) {
        console.error('Error requesting bill:', error);
      } finally {
        setSessionLoading(false);
      }
    }
  }, [onRequestBill]);
  
  const handleCloseSession = useCallback(async () => {
    if (onCloseSession) {
      setSessionLoading(true);
      try {
        await onCloseSession();
      } catch (error) {
        console.error('Error closing session:', error);
      } finally {
        setSessionLoading(false);
      }
    }
  }, [onCloseSession]);

  // Memoized cart items
  const cartItems = useMemo(() => 
    cart.map(item => (
      <div key={item.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
        {/* Item Image */}
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-gray-400 text-xl">🍽️</span>
        </div>
        
        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
            {isInSession && currentCustomer && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {currentCustomer.name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{item.description || 'Fresh and delicious'}</p>
          {item.special_notes && (
            <p className="text-xs text-gray-400 mt-1">📝 {item.special_notes}</p>
          )}
        </div>
        
        {/* Price */}
        <div className="text-right flex-shrink-0">
          <span className="text-sm font-bold text-green-600">{formatCurrency(item.price * item.quantity)}</span>
          <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
        </div>
        
        {/* Quantity Controls */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
        
        {/* Remove Button */}
        <button
          onClick={() => onUpdateQuantity(item.id, 0)}
          className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
        >
          <Trash2 size={16} />
        </button>
      </div>
    )), [cart, onUpdateQuantity, isInSession, currentCustomer]
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Session Header - Show when in session */}
      {isInSession && session && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                session.status === 'active' ? 'bg-green-500' : 
                session.status === 'billed' ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                {session.status.toUpperCase()}
              </span>
              <span className="text-sm opacity-90">Session Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Session Total: {formatCurrency(session.total_amount / 100)}</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4 mb-3 md:mb-0">
              <div className="flex items-center space-x-2">
                <Group className="h-5 w-5" />
                <span className="font-semibold">Group Order Session</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm">OTP:</span>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg font-mono text-lg">
                  {session.session_otp}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{sessionDuration}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">{currentCustomer?.name}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefreshSession}
                disabled={sessionLoading}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-colors flex items-center text-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${sessionLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setCurrentView('orders')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-colors flex items-center text-sm"
              >
                <Package className="h-4 w-4 mr-1" />
                View Orders
              </button>
              <button
                onClick={handleViewToggle}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-lg transition-colors flex items-center text-sm"
              >
                {currentView === 'menu' ? (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    View Group
                  </>
                ) : (
                  <>
                    <MenuIcon className="h-4 w-4 mr-1" />
                    View Menu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile-First Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Menu Section - Mobile First */}
        <div className="flex-1 flex flex-col">
          {/* Show Session Management Components when in group view */}
          {isInSession && currentView === 'group' && session && (
            <div className="flex-1 p-4 space-y-6">
              {/* Session Info Header */}
              <SessionInfoHeader
                session={session}
                participants={sessionParticipants}
                currentCustomer={currentCustomer}
                totalAmount={sessionOrders.reduce((sum, order) => sum + order.total, 0)}
                orderCount={sessionOrders.length}
                onCopyOTP={onCopyOTP}
                onRegenerateOTP={onRegenerateOTP}
                onCloseSession={onCloseSession}
                onShareSession={onShareSession}
                loading={sessionLoading}
              />

              {/* Participants List */}
              <ParticipantsList
                participants={sessionParticipants}
                orders={sessionOrders}
                currentCustomer={currentCustomer}
                loading={sessionLoading}
              />

              {/* Session Total */}
              <SessionTotal
                session={session}
                participants={sessionParticipants}
                orders={sessionOrders}
                currentCustomer={currentCustomer}
                onRequestBill={onRequestBill}
                onShareBill={onShareBill}
                onDownloadBill={onDownloadBill}
                onPrintBill={onPrintBill}
                loading={sessionLoading}
              />

              {/* Quick Session Orders Summary */}
              {sessionOrders.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                    <button
                      onClick={() => setCurrentView('orders')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All Orders
                    </button>
                  </div>
                  <div className="space-y-2">
                    {sessionOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{order.customer_name}</span>
                          {order.customer_id === currentUser?.id && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(order.total)}
                          </span>
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'active' ? 'bg-green-100 text-green-800' :
                            order.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {sessionOrders.length > 3 && (
                      <div className="text-center pt-2">
                        <button
                          onClick={() => setCurrentView('orders')}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          +{sessionOrders.length - 3} more orders
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Show Session Orders when in orders view */}
          {isInSession && currentView === 'orders' && session && (
            <div className="flex-1 p-4">
              {/* Back to Menu Button */}
              <div className="mb-4">
                <button
                  onClick={() => setCurrentView('menu')}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <MenuIcon className="h-4 w-4" />
                  <span>Back to Menu</span>
                </button>
              </div>
              
              <SessionOrdersDisplay
                orders={sessionOrders}
                currentUser={currentUser}
                onExitSession={onExitSession || (() => Promise.resolve())}
                onRefreshOrders={onRefreshSession || (() => Promise.resolve())}
                loading={sessionLoading}
              />
            </div>
          )}
          
          {/* Show Menu when in menu view or not in session */}
          {(currentView === 'menu' || !isInSession) && (
            <>
              {/* Search and Filter Bar - Sticky on Mobile */}
              <div className="bg-white shadow-sm border-b sticky top-0 z-40">
            <div className="p-4">
              {/* Search Bar */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
              
              {/* Category Filter Row */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-2 ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter size={16} />
                  <span>All Categories</span>
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-2 ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-lg">🍽️</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>

              {/* Veg/Non-Veg Filter Row */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setVegFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-2 ${
                    vegFilter === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Filter size={16} />
                  <span>All Items</span>
                </button>
                <button
                  onClick={() => setVegFilter('veg')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-2 ${
                    vegFilter === 'veg'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Leaf size={16} />
                  <span>Veg Only</span>
                </button>
                <button
                  onClick={() => setVegFilter('non-veg')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-2 ${
                    vegFilter === 'non-veg'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Beef size={16} />
                  <span>Non-Veg Only</span>
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items - Compact Grid with Pagination */}
          <div className="flex-1 p-4 pb-32 lg:pb-4">
            {/* Results Info */}
            <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <span>
                  {showLoadMore 
                    ? `Showing all ${filteredItems.length} items`
                    : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredItems.length)} of ${filteredItems.length} items`
                  }
                </span>
                {/* Active Filters Indicator */}
                {(selectedCategory !== 'all' || vegFilter !== 'all') && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-blue-600">
                      {selectedCategory !== 'all' && vegFilter !== 'all' ? 'Filtered' : 
                       selectedCategory !== 'all' ? 'Category filtered' : 'Veg filtered'}
                    </span>
                  </div>
                )}
              </div>
              {!showLoadMore && totalPages > 1 && (
                <span>Page {currentPage} of {totalPages}</span>
              )}
            </div>

            {/* Horizontal Menu List */}
            <div className="space-y-3">
              {itemsToShow.map((item) => {
                const cartItem = cart.find(cartItem => cartItem.id === item.id);
                const itemQuantity = cartItem?.quantity || 0;
                
                return (
                  <div
                    key={`${item.id}-${itemQuantity}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 active:scale-95"
                  >
                    <div className="flex items-center space-x-3 p-3">
                      {/* Item Image */}
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400 text-xl">🍽️</span>
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 mr-2">{item.name}</h3>
                          <span className="text-sm font-bold text-green-600 whitespace-nowrap">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                        
                        {/* Tags */}
                        <div className="flex items-center space-x-2">
                          {item.is_veg && (
                            <span className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                              🥬 Veg
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            ⭐ {item.rating}
                          </span>
                          <span className="text-xs text-gray-500">
                            ⏱️ {item.prepTime}min
                          </span>
                          {isInSession && currentCustomer && (
                            <span className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                              👤 {currentCustomer.name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Quantity Controls or Add Button */}
                      {itemQuantity > 0 ? (
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => onUpdateQuantity(item.id, itemQuantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">{itemQuantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, itemQuantity + 1)}
                            className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors flex-shrink-0"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination/Load More Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-6">
                {/* Load More Option */}
                <button
                  onClick={() => setShowLoadMore(!showLoadMore)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {showLoadMore ? 'Show Pagination' : 'Load All Items'}
                </button>
                
                {/* Pagination Controls */}
                {!showLoadMore && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🍽️</div>
                <p className="text-gray-500">No items found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* Desktop Cart Section */}
        <div className="hidden lg:block lg:w-96 lg:border-l lg:border-gray-200">
          <div className="bg-white h-full flex flex-col">
            {/* Cart Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <ShoppingCart size={24} className="text-blue-600" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {isInSession ? 'Your Group Order' : 'Your Order'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {cartItemCount} items
                    {isInSession && currentCustomer && (
                      <span className="ml-2 text-blue-600">• {currentCustomer.name}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Session Management Section - Desktop */}
            {isInSession && session && (
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-900">Session Management</h3>
                  <button
                    onClick={handleViewToggle}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {currentView === 'menu' ? 'View Group' : 'View Menu'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleRefreshSession}
                    disabled={sessionLoading}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${sessionLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setCurrentView('orders')}
                    className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    View Orders
                  </button>
                  <button
                    onClick={handleRequestBill}
                    disabled={sessionLoading}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    Request Bill
                  </button>
                </div>
              </div>
            )}
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🛒</div>
                  <p className="text-gray-500">Your cart is empty</p>
                  <p className="text-gray-400 text-sm">Add some delicious items!</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {cartItems}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              {isInSession && session && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-800">Session Total:</span>
                    <span className="font-semibold text-blue-900">
                      {formatCurrency(session.total_amount / 100)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Your Total:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(cartTotal)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || loading}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-green-700 active:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Place Order - ${formatCurrency(cartTotal)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cart Icon - Floating */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <div className="flex flex-col space-y-2">
          {isInSession && (
            <button
              onClick={() => setShowSessionInfo(!showSessionInfo)}
              className="relative bg-blue-600 rounded-full p-3 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-200"
            >
              <Group size={20} className="text-white" />
            </button>
          )}
          <button
            onClick={() => setShowMobileCart(!showMobileCart)}
            className="relative bg-white rounded-full p-3 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
          >
            <ShoppingCart size={24} className="text-blue-600" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Cart Drawer */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileCart(false)}
          />
          
          {/* Cart Drawer */}
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Cart Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <ShoppingCart size={24} className="text-blue-600" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {isInSession ? 'Your Group Order' : 'Your Order'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {cartItemCount} items
                      {isInSession && currentCustomer && (
                        <span className="ml-2 text-blue-600">• {currentCustomer.name}</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileCart(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Session Management Section - Mobile */}
              {isInSession && session && (
                <div className="p-3 border-b border-gray-200 bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-blue-900 text-sm">Session Management</h3>
                    <button
                      onClick={handleViewToggle}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      {currentView === 'menu' ? 'View Group' : 'View Menu'}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={handleRefreshSession}
                      disabled={sessionLoading}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${sessionLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    <button
                      onClick={() => setCurrentView('orders')}
                      className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 transition-colors flex items-center justify-center"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      View Orders
                    </button>
                    <button
                      onClick={handleRequestBill}
                      disabled={sessionLoading}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      Request Bill
                    </button>
                  </div>
                </div>
              )}
              
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🛒</div>
                    <p className="text-gray-500">Your cart is empty</p>
                    <p className="text-gray-400 text-sm">Add some delicious items!</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {cartItems}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                {isInSession && session && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-800">Session Total:</span>
                      <span className="font-semibold text-blue-900">
                        {formatCurrency(session.total_amount / 100)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Your Total:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(cartTotal)}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setShowMobileCart(false);
                    handleCheckout();
                  }}
                  disabled={cart.length === 0 || loading}
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-green-700 active:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Place Order - ${formatCurrency(cartTotal)}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Order Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <ShoppingCart size={20} className="text-blue-600" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {cartItemCount} items
                {isInSession && currentCustomer && (
                  <span className="text-blue-600"> • {currentCustomer.name}</span>
                )}
              </p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(cartTotal)}</p>
              {isInSession && session && (
                <p className="text-xs text-blue-600">Session: {formatCurrency(session.total_amount / 100)}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMobileCart(true)}
              className="text-blue-600 text-sm font-medium px-3 py-2 border border-blue-600 rounded-lg hover:bg-blue-50"
            >
              View
            </button>
            
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 active:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing
                </div>
              ) : (
                `Order ${formatCurrency(cartTotal)}`
              )}
            </button>
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

      {/* Session Info Modal - Mobile */}
      {showSessionInfo && isInSession && session && (
        <Modal
          isOpen={showSessionInfo}
          onClose={() => setShowSessionInfo(false)}
          title="Session Information"
          maxWidth="sm"
        >
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Session OTP:</span>
                <span className="font-mono text-lg font-bold text-blue-600">
                  {session.session_otp}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="font-semibold">{sessionDuration}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  session.status === 'active' ? 'bg-green-100 text-green-800' : 
                  session.status === 'billed' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {session.status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Session Total:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(session.total_amount / 100)}
                </span>
              </div>
              
              {currentCustomer && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your Name:</span>
                  <span className="font-semibold">{currentCustomer.name}</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleViewToggle}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentView === 'menu' ? 'View Group' : 'View Menu'}
              </button>
              <button
                onClick={() => setShowSessionInfo(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <Modal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          title={isInSession ? "Confirm Group Order" : "Confirm Order"}
          maxWidth="md"
        >
          <div className="p-6">
              {isInSession && currentCustomer && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Group className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-800">Group Order Session</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    <p>Customer: {currentCustomer.name}</p>
                    <p>Session OTP: {session?.session_otp}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2 mb-6">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <div className="flex-1">
                      <span>{item.name} x {item.quantity}</span>
                      {isInSession && currentCustomer && (
                        <span className="ml-2 text-xs text-blue-600">({currentCustomer.name})</span>
                      )}
                    </div>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              {isInSession && session && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span>Session Total:</span>
                    <span className="font-semibold">{formatCurrency(session.total_amount / 100)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Your Total:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
        </Modal>
      )}
    </div>
  );
};

CustomerInterface.displayName = 'CustomerInterface';

export default CustomerInterface;