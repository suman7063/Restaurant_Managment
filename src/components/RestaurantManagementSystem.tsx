"use client"
import React, { useState, useEffect } from 'react';
import { User, MenuItem, CartItem, Order, Table, Notification } from './types';
import { addNotification } from './utils';
import NotificationToast from './NotificationToast';
import QRScanner from './QRScanner';
import CustomerInterface from './CustomerInterface';
import AdminDashboard from './AdminDashboard';
import WaiterDashboard from './WaiterDashboard';
import ChefDashboard from './ChefDashboard';
import { userService, orderService, tableService } from '../lib/database';
import { dummyUsers } from './data';

const RestaurantManagementSystem = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showQrCodes, setShowQrCodes] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});

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
      const availableUsers = Object.keys(users).length > 0 ? users : dummyUsers;
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
    const availableUsers = Object.keys(users).length > 0 ? users : dummyUsers;
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

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
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
          customerName: currentUser.name,
          items: [...cart],
          status: 'pending',
          waiter: 'Sarah Waiter',
          timestamp: new Date(),
          total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          estimatedTime: Math.max(...cart.map(item => item.prepTime)) + 5
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

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const success = await orderService.updateOrderStatus(orderId, newStatus);
      
      if (success) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        
        const statusMessages: Record<string, string> = {
          'preparing': 'Order is now being prepared 👨‍🍳',
          'ready': 'Order is ready for pickup! 🔔',
          'delivered': 'Order delivered successfully ✅'
        };
        
        addNotification(notifications, setNotifications, statusMessages[newStatus] || 'Order status updated', 'success');
      } else {
        // In development mode without Supabase, simulate status update
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        
        const statusMessages: Record<string, string> = {
          'preparing': 'Order is now being prepared 👨‍🍳',
          'ready': 'Order is ready for pickup! 🔔',
          'delivered': 'Order delivered successfully ✅'
        };
        
        addNotification(notifications, setNotifications, `${statusMessages[newStatus] || 'Order status updated'} (Development Mode)`, 'success');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      addNotification(notifications, setNotifications, 'Error updating order status', 'error');
    }
  };

  // QR Scanner Interface
  if (!currentUser) {
    return (
      <>
        {/* Notifications 
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}*/}
        
        <QRScanner
          qrInput={qrInput}
          setQrInput={setQrInput}
          isScanning={isScanning}
          loading={loading}
          showQrCodes={showQrCodes}
          setShowQrCodes={setShowQrCodes}
          dummyUsers={Object.keys(users).length > 0 ? users : dummyUsers}
          onQrScan={handleQrScan}
          onSimulateQrScan={simulateQrScan}
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