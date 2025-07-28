"use client"
import React, { useState } from 'react';
import { User, MenuItem, CartItem, Order, Table, Notification } from './types';
import { dummyUsers, dummyMenu, initialOrders, initialTables } from './data';
import { addNotification } from './utils';
import NotificationToast from './NotificationToast';
import QRScanner from './QRScanner';
import CustomerInterface from './CustomerInterface';
import AdminDashboard from './AdminDashboard';
import WaiterDashboard from './WaiterDashboard';
import ChefDashboard from './ChefDashboard';

const RestaurantManagementSystem = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showQrCodes, setShowQrCodes] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tables] = useState<Table[]>(initialTables);

  // Simulate QR scanning
  const simulateQrScan = () => {
    setIsScanning(true);
    setLoading(true);
    
    setTimeout(() => {
      const codes = Object.keys(dummyUsers);
      const randomCode = codes[Math.floor(Math.random() * codes.length)];
      setQrInput(randomCode);
      setIsScanning(false);
      setLoading(false);
      addNotification(notifications, setNotifications, `QR Code detected: ${randomCode}`, 'success');
    }, 2000);
  };

  const handleQrScan = () => {
    const user = dummyUsers[qrInput.toUpperCase()];
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

  const placeOrder = () => {
    if (cart.length === 0 || !currentUser) return;
    
    setLoading(true);
    setTimeout(() => {
      const newOrder: Order = {
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
      
      setOrders([...orders, newOrder]);
      setCart([]);
      setLoading(false);
      addNotification(notifications, setNotifications, 'Order placed successfully! 🎉', 'success');
    }, 1500);
  };

  const updateOrderStatus = (orderId: number, newStatus: string) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    
    const statusMessages: Record<string, string> = {
      'preparing': 'Order is now being prepared 👨‍🍳',
      'ready': 'Order is ready for pickup! 🔔',
      'delivered': 'Order delivered successfully ✅'
    };
    
    addNotification(notifications, setNotifications, statusMessages[newStatus] || 'Order status updated', 'success');
  };

  // QR Scanner Interface
  if (!currentUser) {
    return (
      <>
        {/* Notifications */}
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
        
        <QRScanner
          qrInput={qrInput}
          setQrInput={setQrInput}
          isScanning={isScanning}
          loading={loading}
          showQrCodes={showQrCodes}
          setShowQrCodes={setShowQrCodes}
          dummyUsers={dummyUsers}
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
        {/* Notifications */}
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
          dummyMenu={dummyMenu}
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
        {/* Notifications */}
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
        
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
        {/* Notifications */}
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
        {/* Notifications */}
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
        
        <ChefDashboard
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          orders={orders}
          dummyMenu={dummyMenu}
          onUpdateOrderStatus={updateOrderStatus}
        />
      </>
    );
  }

  return null;
};

export default RestaurantManagementSystem;