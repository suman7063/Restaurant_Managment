"use client"
import React, { useState, useEffect } from 'react';
import { User, MenuItem, CartItem, Order, Table, Notification, MenuCustomization, MenuAddOn, Restaurant } from './types';
import { addNotification } from './utils';
import NotificationToast from './NotificationToast';
import QRScanner from './QRScanner';
import CustomerInterface from './CustomerInterface';
import AdminDashboard from './AdminDashboard';
import WaiterDashboard from './WaiterDashboard';
import ChefDashboard from './ChefDashboard';
import OnboardingPage from './OnboardingPage';
import LandingPage from './LandingPage';
import { orderService, tableService, userService } from '../lib/database';

const RestaurantManagementSystem = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQrCodes, setShowQrCodes] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Fetch initial data from Supabase
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [ordersData, tablesData, usersData] = await Promise.all([
          orderService.getAllOrders(),
          tableService.getAllTables(),
          userService.getAllUsers()
        ]);
        
        setOrders(ordersData);
        setTables(tablesData);
        
        // Convert users array to record for easy lookup
        const usersRecord: Record<string, User> = {};
        usersData.forEach(user => {
          if (user.qr_code) {
            usersRecord[user.qr_code] = user;
          }
        });
        setUsers(usersRecord);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  // Simulate QR scanning
  const simulateQrScan = () => {
    setIsScanning(true);
    setLoading(true);
    
    setTimeout(() => {
      // Use users from state, or fallback to dummy data if not loaded yet
      const availableUsers = Object.keys(users).length > 0 ? users : {};
      const codes = Object.keys(availableUsers);
      const randomCode = codes[Math.floor(Math.random() * codes.length)];
      setQrInput(randomCode);
      setIsScanning(false);
      setLoading(false);
      addNotification(notifications, setNotifications, `QR Code detected: ${randomCode}`, 'success');
    }, 2000);
  };

  const handleQrScan = () => {
    // Use users from state, or fallback to dummy data if not loaded yet
    const availableUsers = Object.keys(users).length > 0 ? users : {};
    const user = availableUsers[qrInput.toUpperCase()];
    
    if (user) {
      setLoading(true);
      setTimeout(() => {
        setCurrentUser(user);
        setQrInput('');
        setLoading(false);
        addNotification(notifications, setNotifications, `Welcome ${user.name}!`, 'success');
      }, 1000);
    } else {
      addNotification(notifications, setNotifications, 'Invalid QR Code - Please try again', 'error');
    }
  };

  const addToCart = (item: MenuItem, customization?: MenuCustomization | null, addOns?: MenuAddOn[], specialNotes?: string) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      const cartItem: CartItem = {
        ...item,
        quantity: 1,
        special_notes: specialNotes,
        selected_customization: customization || undefined,
        selected_add_ons: addOns || []
      };
      setCart([...cart, cartItem]);
    }
    addNotification(notifications, setNotifications, `${item.name} added to cart!`, 'success');
  };

  const removeFromCart = (itemId: number) => {
    const item = cart.find(item => item.id === itemId);
    setCart(cart.filter(item => item.id !== itemId));
    if (item) {
      addNotification(notifications, setNotifications, `${item.name} removed from cart`, 'info');
    }
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const placeOrder = async () => {
    if (cart.length === 0 || !currentUser) return;
    
    setLoading(true);
    try {
      const newOrder = await orderService.createOrder({
        tableNumber: currentUser.table || 1,
        customerName: currentUser.name,
        items: [...cart]
      });
      
      if (newOrder) {
        setOrders([newOrder, ...orders]);
        setCart([]);
        addNotification(notifications, setNotifications, 'Order placed successfully! 🎉', 'success');
      } else {
        // In development mode without Supabase, simulate order creation
        const simulatedOrder: Order = {
          id: orders.length + 1,
          table: currentUser.table || 1,
          customer_name: currentUser.name,
          items: cart.map((item, index) => ({
            id: index + 1,
            order_id: orders.length + 1,
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
          total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          estimated_time: Math.max(...cart.map(item => item.prepTime)) + 5,
          is_joined_order: false,
          parent_order_id: undefined
        };
        setOrders([simulatedOrder, ...orders]);
        setCart([]);
        addNotification(notifications, setNotifications, 'Order placed successfully! 🎉 (Development Mode)', 'success');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      addNotification(notifications, setNotifications, 'Error placing order. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = (orderId: number, newStatus: string) => {
    // Map the status string to the correct type
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
    
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status }
        : order
    ));
    addNotification(notifications, setNotifications, `Order ${orderId} status updated to ${status}`, 'success');
  };

  const handleStartOnboarding = () => {
    setShowLanding(false);
    setIsOnboarding(true);
  };

  const handleOnboardingComplete = (restaurantData: Restaurant, adminUser: User) => {
    setRestaurant(restaurantData);
    setCurrentUser(adminUser);
    setIsOnboarding(false);
    setShowLanding(false); // Ensure landing page is hidden
    addNotification(notifications, setNotifications, `Welcome to ${restaurantData.name}! Setup complete. You can now scan QR codes to access the system.`, 'success');
  };

  // Landing Page
  if (showLanding) {
    return <LandingPage onStartOnboarding={handleStartOnboarding} />;
  }

  // Onboarding Page
  if (isOnboarding) {
    return (
      <>
        {/* Notifications 
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
          */}
        
        <OnboardingPage
          onComplete={handleOnboardingComplete}
        />
      </>
    );
  }

  // QR Scanner Interface
  if (!currentUser) {
    return (
      <>
        {/* Notifications 
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}*/}
        
        <QRScanner
          onQrScan={handleQrScan}
          onSimulateQrScan={simulateQrScan}
          currentUser={currentUser}
          restaurant={restaurant}
        />
      </>
    );
  }

  // Customer Interface
  if (currentUser.role === 'customer') {
    return (
      <>
        {/* Notifications 
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
          */}
        
        <CustomerInterface
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          cart={cart}
          loading={loading}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onAddToCart={addToCart}
          onUpdateQuantity={updateQuantity}
          onPlaceOrder={placeOrder}
        />
      </>
    );
  }

  // Admin Dashboard
  if (currentUser.role === 'admin') {
    return (
      <>
        {/* Notifications 
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
          */}
        
        <AdminDashboard
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          orders={orders}
          tables={tables}
        />
      </>
    );
  }

  // Waiter Dashboard
  if (currentUser.role === 'waiter') {
    return (
      <>
        {/* Notifications 
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
          */}
        
        <WaiterDashboard
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          orders={orders}
          tables={tables}
          onUpdateOrderStatus={updateOrderStatus}
        />
      </>
    );
  }

  // Chef Dashboard
  if (currentUser.role === 'chef') {
    return (
      <>
        {/* Notifications 
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
          */}
        
        <ChefDashboard
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          orders={orders}
          onUpdateOrderStatus={updateOrderStatus}
        />
      </>
    );
  }

  return null;
};

export default RestaurantManagementSystem;