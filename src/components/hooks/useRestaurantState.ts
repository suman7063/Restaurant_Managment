import { useState, useCallback, useMemo, useEffect } from 'react';
import { User, MenuItem, CartItem, Order, Table, Notification, MenuCustomization, MenuAddOn } from '../types';
import { addNotification } from '../utils';
import { orderService, tableService, userService, cacheService } from '../../lib/database';

interface UseRestaurantStateReturn {
  // State
  currentUser: User | null;
  cart: CartItem[];
  orders: Order[];
  tables: Table[];
  users: Record<string, User>;
  notifications: Notification[];
  selectedCategory: string;
  loading: boolean;
  isScanning: boolean;
  qrInput: string;
  
  // Computed values
  cartTotal: number;
  cartItemCount: number;
  usersArray: User[];
  tableCodes: string[];
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setSelectedCategory: (category: string) => void;
  setQrInput: (input: string) => void;
  setIsScanning: (scanning: boolean) => void;
  setLoading: (loading: boolean) => void;
  
  // Cart actions
  addToCart: (item: MenuItem, customization?: MenuCustomization | null, addOns?: MenuAddOn[], specialNotes?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  clearCart: () => void;
  
  // Order actions
  placeOrder: () => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: string) => void;
  
  // QR actions
  handleQrScan: () => Promise<void>;
  simulateQrScan: () => void;
  
  // Data fetching
  fetchInitialData: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Cache management
  clearCache: () => void;
  getCacheStats: () => ReturnType<typeof cacheService.getCacheStats>;
}

export const useRestaurantState = (): UseRestaurantStateReturn => {
  // Core state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [qrInput, setQrInput] = useState('');

  // Memoized computed values
  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), 
    [cart]
  );

  const cartItemCount = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0), 
    [cart]
  );

  const usersArray = useMemo(() => Object.values(users), [users]);
  const tableCodes = useMemo(() => tables.map(t => t.qr_code).filter(Boolean), [tables]);

  // Data fetching
  const fetchInitialData = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const [ordersData, tablesData, usersData] = await Promise.all([
        orderService.getAllOrders(),
        tableService.getAllTables(),
        userService.getAllUsers()
      ]);
      
      setOrders(ordersData);
      setTables(tablesData);
      
      const usersRecord: Record<string, User> = {};
      usersData.forEach(user => {
        usersRecord[user.id] = user;
      });
      setUsers(usersRecord);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      addNotification(notifications, setNotifications, 'Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  }, [loading, notifications]);

  const refreshData = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  // Cart actions
  const addToCart = useCallback((item: MenuItem, customization?: MenuCustomization | null, addOns?: MenuAddOn[], specialNotes?: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        const cartItem: CartItem = {
          ...item,
          quantity: 1,
          special_notes: specialNotes,
          selected_customization: customization || undefined,
          selected_add_ons: addOns || []
        };
        return [...prevCart, cartItem];
      }
    });
    addNotification(notifications, setNotifications, `${item.name} added to cart!`, 'success');
  }, [notifications]);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prevCart => {
      const item = prevCart.find(item => item.id === itemId);
      const newCart = prevCart.filter(item => item.id !== itemId);
      if (item) {
        addNotification(notifications, setNotifications, `${item.name} removed from cart`, 'info');
      }
      return newCart;
    });
  }, [notifications]);

  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
    } else {
      setCart(prevCart => prevCart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Order actions
  const placeOrder = useCallback(async () => {
    if (cart.length === 0 || !currentUser) return;
    
    setLoading(true);
    try {
      const newOrder = await orderService.createOrder({
        tableNumber: currentUser.table || 1,
        customerName: currentUser.name,
        items: [...cart]
      });
      
      if (newOrder) {
        setOrders(prevOrders => [newOrder, ...prevOrders]);
        setCart([]);
        addNotification(notifications, setNotifications, 'Order placed successfully! 🎉', 'success');
      } else {
        // Development mode simulation
        const simulatedOrder: Order = {
          id: `order_${Date.now()}`,
          table: currentUser.table || 1,
          customer_name: currentUser.name,
          items: cart.map((item, index) => ({
            id: `item_${Date.now()}_${index}`,
            order_id: `order_${Date.now()}`,
            menu_item: item,
            quantity: item.quantity,
            special_notes: item.special_notes,
            selected_customization: item.selected_customization,
            selected_add_ons: item.selected_add_ons,
            status: 'order_received' as const,
            kitchen_station: item.kitchen_stations?.[0] || 'Main Kitchen',
            price_at_time: item.price
          })),
          status: 'active' as const,
          waiter_id: undefined,
          waiter_name: undefined,
          timestamp: new Date(),
          total: cartTotal,
          estimated_time: Math.max(...cart.map(item => item.prepTime)) + 5,
          is_joined_order: false,
          parent_order_id: undefined,
          is_session_order: false
        };
        setOrders(prevOrders => [simulatedOrder, ...prevOrders]);
        setCart([]);
        addNotification(notifications, setNotifications, 'Order placed successfully! 🎉 (Development Mode)', 'success');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      addNotification(notifications, setNotifications, 'Error placing order. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [cart, currentUser, cartTotal, notifications]);

  const updateOrderStatus = useCallback((orderId: string, newStatus: string) => {
    let status: 'active' | 'completed' | 'cancelled';
    switch (newStatus) {
      case 'active':
      case 'completed':
      case 'cancelled':
        status = newStatus;
        break;
      default:
        status = 'active';
    }
    
    setOrders(prevOrders => prevOrders.map(order => 
      order.id === orderId 
        ? { ...order, status }
        : order
    ));
    addNotification(notifications, setNotifications, `Order ${orderId} status updated to ${status}`, 'success');
  }, [notifications]);

  // QR actions
  const simulateQrScan = useCallback(() => {
    setIsScanning(true);
    setLoading(true);
    
    setTimeout(() => {
      if (tableCodes.length === 0) {
        setIsScanning(false);
        setLoading(false);
        addNotification(notifications, setNotifications, 'No tables available. Please complete onboarding first.', 'warning');
        return;
      }
      const randomCode = tableCodes[Math.floor(Math.random() * tableCodes.length)];
      setQrInput(randomCode);
      setIsScanning(false);
      setLoading(false);
      addNotification(notifications, setNotifications, `QR Code detected: ${randomCode}`, 'success');
    }, 2000);
  }, [tableCodes, notifications]);

  const handleQrScan = useCallback(async () => {
    setLoading(true);
    try {
      const table = tables.find(t => t.qr_code === qrInput.toUpperCase());
      
      if (table) {
        let customerUser = usersArray.find(u => u.table === table.table_number && u.role === 'customer');
        
        if (!customerUser) {
          const newUser = await userService.createUser({
            name: `Customer at Table ${table.table_number}`,
            email: '',
            phone: '',
            role: 'customer',
            table: table.table_number
          });
          
          if (newUser) {
            customerUser = newUser;
            setUsers(prev => ({ ...prev, [newUser.id]: newUser }));
          }
        }
        
        if (customerUser) {
          setCurrentUser(customerUser);
          setQrInput('');
          addNotification(notifications, setNotifications, `Welcome to Table ${table.table_number}!`, 'success');
        } else {
          addNotification(notifications, setNotifications, 'Error creating customer account', 'error');
        }
      } else {
        addNotification(notifications, setNotifications, 'Invalid QR Code - Please try again', 'error');
      }
    } catch (error) {
      console.error('Error scanning QR code:', error);
      addNotification(notifications, setNotifications, 'Error scanning QR code', 'error');
    } finally {
      setLoading(false);
    }
  }, [qrInput, tables, usersArray, notifications]);

  // Cache management
  const clearCache = useCallback(() => {
    cacheService.clearAllCache();
  }, []);

  const getCacheStats = useCallback(() => {
    return cacheService.getCacheStats();
  }, []);

  // Auto-clear expired cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cacheService.clearExpiredCache();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    // State
    currentUser,
    cart,
    orders,
    tables,
    users,
    notifications,
    selectedCategory,
    loading,
    isScanning,
    qrInput,
    
    // Computed values
    cartTotal,
    cartItemCount,
    usersArray,
    tableCodes,
    
    // Actions
    setCurrentUser,
    setSelectedCategory,
    setQrInput,
    setIsScanning,
    setLoading,
    
    // Cart actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    
    // Order actions
    placeOrder,
    updateOrderStatus,
    
    // QR actions
    handleQrScan,
    simulateQrScan,
    
    // Data fetching
    fetchInitialData,
    refreshData,
    
    // Cache management
    clearCache,
    getCacheStats,
  };
}; 