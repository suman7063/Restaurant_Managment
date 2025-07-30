"use client"
import React, { useState, useEffect } from 'react';
import { User, MenuItem, CartItem, Order, Table, Notification, MenuCustomization, MenuAddOn, Restaurant } from './types';
import { addNotification } from './utils';
import QRScanner from './QRScanner';
import CustomerInterface from './CustomerInterface';
import WaiterDashboard from './WaiterDashboard';
import ChefDashboard from './ChefDashboard';

import AnimatedOnboardingPage from './AnimatedOnboardingPage';
import LandingPage from './LandingPage';
import NotificationToast from './NotificationToast';

import { orderService, tableService, userService } from '../lib/database';

const RestaurantManagementSystem = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [restaurant] = useState<Restaurant | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);

    const [qrInput, setQrInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Fetch initial data from Supabase only when not in onboarding
  useEffect(() => {
    const fetchInitialData = async () => {
      // Don't fetch data if we're in onboarding or showing landing page
      if (isOnboarding || showLanding) {
        return;
      }
      
      try {
        const [ordersData, tablesData, usersData] = await Promise.all([
          orderService.getAllOrders(),
          tableService.getAllTables(),
          userService.getAllUsers()
        ]);
        
        setOrders(ordersData);
        setTables(tablesData);
        
        // Convert users array to record for easy lookup by ID
        const usersRecord: Record<string, User> = {};
        usersData.forEach(user => {
          usersRecord[user.id] = user;
        });
        setUsers(usersRecord);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [isOnboarding, showLanding]);

  // Simulate QR scanning
  const simulateQrScan = () => {
    setIsScanning(true);
    setLoading(true);
    
    setTimeout(() => {
      const tableCodes = tables.map(t => t.qr_code).filter(Boolean);
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
  };

  const handleQrScan = async () => {
    setLoading(true);
    try {
      // Find table by QR code
      const table = tables.find(t => t.qr_code === qrInput.toUpperCase());
      
      if (table) {
        // Find or create a customer user for this table
        let customerUser = Object.values(users).find(u => u.table === table.table_number && u.role === 'customer');
        
        if (!customerUser) {
          // Create a new customer user for this table
          const newUser = await userService.createUser({
            name: `Customer at Table ${table.table_number}`,
            email: '',
            phone: '',
            role: 'customer',
            language: 'en',
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

  const removeFromCart = (itemId: string) => {
    const item = cart.find(item => item.id === itemId);
    setCart(cart.filter(item => item.id !== itemId));
    if (item) {
      addNotification(notifications, setNotifications, `${item.name} removed from cart`, 'info');
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
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

  const updateOrderStatus = (orderId: string, newStatus: string) => {
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



  // Landing Page
  if (showLanding) {
    return <LandingPage onStartOnboarding={handleStartOnboarding} />;
  }

  // Onboarding Page
  if (isOnboarding) {
    return (
      <>
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
        
        <AnimatedOnboardingPage />
      </>
    );
  }

  // QR Scanner Interface
  if (!currentUser) {
    return (
      <>
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
        
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
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
        
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

  // Waiter Dashboard
  if (currentUser.role === 'waiter') {
    return (
      <>
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
        
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
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
        
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