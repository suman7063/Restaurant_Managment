"use client"
import React, { useState, useEffect } from 'react';
import { User, MenuItem, CartItem } from './types';
import { menuService } from '../lib/database';
import { dummyMenu } from './data';

interface CustomerInterfaceProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
  cart: CartItem[];
  loading: boolean;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onPlaceOrder: () => void;
}

// Enhanced CSS animations
const customStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  @keyframes wiggle {
    0%, 7%, 14%, 21%, 28%, 35%, 42%, 49%, 56%, 63%, 70%, 77%, 84%, 91%, 98%, 100% {
      transform: rotate(0deg);
    }
    3.5%, 10.5%, 17.5%, 24.5%, 31.5%, 38.5%, 45.5%, 52.5%, 59.5%, 66.5%, 73.5%, 80.5%, 87.5%, 94.5% {
      transform: rotate(3deg);
    }
  }
  
  @keyframes countUp {
    from {
      transform: translateY(10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes bounceInScale {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    60% {
      opacity: 1;
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
  }
  
  .animate-slide-in {
    animation: slideIn 0.5s ease-out forwards;
  }
  
  .animate-bounce-in {
    animation: bounceIn 0.6s ease-out forwards;
  }
  
  .animate-pulse-custom {
    animation: pulse 2s infinite;
  }
  
  .animate-wiggle {
    animation: wiggle 0.5s ease-in-out;
  }
  
  .animate-count {
    animation: countUp 0.3s ease-out;
  }
  
  .animate-slide-in-right {
    animation: slideInRight 0.4s ease-out forwards;
  }
  
  .animate-bounce-in-scale {
    animation: bounceInScale 0.5s ease-out forwards;
  }
  
  .delay-100 { animation-delay: 100ms; }
  .delay-200 { animation-delay: 200ms; }
  .delay-300 { animation-delay: 300ms; }
  .delay-400 { animation-delay: 400ms; }
  .delay-500 { animation-delay: 500ms; }
`;

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
  const [animatingItems, setAnimatingItems] = useState<Set<number>>(new Set());
  const [notifications, setNotifications] = useState<Array<{id: number, message: string, item: string}>>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  // Fetch menu items from Supabase
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setMenuLoading(true);
        const items = await menuService.getAllMenuItems();
        setMenuItems(items);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Fallback to dummy menu if no items loaded
  const availableMenuItems = menuItems.length > 0 ? menuItems : dummyMenu;
  
  const categories = ['All', ...new Set(availableMenuItems.map(item => item.category))];
  const filteredMenu = selectedCategory === 'All' 
    ? availableMenuItems 
    : availableMenuItems.filter(item => item.category === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Add notification for mobile feedback
  const addNotification = (message: string, itemName: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, item: itemName }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const handleAddToCart = (item: MenuItem) => {
    setAnimatingItems(prev => new Set(prev).add(item.id));
    onAddToCart(item);
    addNotification('Added to cart!', item.name);
    
    setTimeout(() => {
      setAnimatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 600);
  };

  // Check if item is in cart
  const isItemInCart = (itemId: number) => {
    return cart.some(cartItem => cartItem.id === itemId);
  };

  // Get item quantity in cart
  const getItemQuantity = (itemId: number) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Toast Notification Component
  // const ToastNotification = ({ notification }: { notification: {id: number, message: string, item: string} }) => (
  //   <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in-right">
  //     <div className="flex items-center gap-2">
  //       <span className="text-lg">✅</span>
  //       <div>
  //         <p className="font-semibold">{notification.item}</p>
  //         <p className="text-sm opacity-90">{notification.message}</p>
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <>
      <style>{customStyles}</style>
      {/* Exact gradient from the login image */}
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
        
        {/* Toast Notifications for Mobile 
        {notifications.map(notification => (
          <ToastNotification key={notification.id} notification={notification} />
        ))}
          */}

        {/* Floating Cart Button for Mobile */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <div className="bg-purple-600 text-white p-4 rounded-full shadow-xl animate-pulse-custom">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <span className="font-bold">{cartItemCount}</span>
            </div>
            {cartItemCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center animate-bounce-in-scale">
                {cartItemCount}
              </div>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <div className="animate-slide-in">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">🍽️ Restaurant Menu</h1>
                <p className="text-gray-600 text-lg animate-slide-in delay-100">Welcome, {currentUser.name}!</p>
                <p className="text-sm text-gray-500 animate-slide-in delay-200">Table {currentUser.table}</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Cart Summary for Desktop */}
                <div className="hidden lg:flex bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-bold items-center gap-2">
                  <span>🛒</span>
                  <span>{cartItemCount} items</span>
                  <span className="text-purple-600">${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setCurrentUser(null)}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-xl p-6 animate-fade-in-up delay-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 animate-slide-in delay-300">Menu</h2>
                
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((category, index) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 animate-bounce-in ${
                        selectedCategory === category
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                      }`}
                      style={{ animationDelay: `${400 + index * 100}ms` }}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Menu Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuLoading ? (
                    <div className="col-span-2 text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading menu items...</p>
                    </div>
                  ) : filteredMenu.length === 0 ? (
                    <div className="col-span-2 text-center py-8">
                      <p className="text-gray-500">No menu items available</p>
                    </div>
                  ) : (
                    filteredMenu.map((item, index) => (
                    <div 
                      key={item.id} 
                      className={`bg-gray-50 rounded-lg p-4 border border-gray-200 transition-all duration-300 transform hover:shadow-lg hover:-translate-y-1 hover:border-purple-300 animate-fade-in-up ${
                        animatingItems.has(item.id) ? 'animate-wiggle' : ''
                      }`}
                      style={{ animationDelay: `${600 + index * 100}ms` }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800 hover:text-purple-700 transition-colors">
                          {item.name}
                        </h3>
                        <span className="text-purple-600 font-bold text-lg">${item.price}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          ⏱️ {item.prepTime} min
                        </span>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className={`px-4 py-2 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 shadow-md font-medium ${
                            animatingItems.has(item.id)
                              ? 'bg-green-500 text-white'
                              : isItemInCart(item.id)
                              ? 'bg-green-100 text-green-700 border-2 border-green-500 hover:bg-green-200'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                        >
                          {animatingItems.has(item.id)
                            ? '✅ Added!'
                            : isItemInCart(item.id)
                            ? `✓ In Cart (${getItemQuantity(item.id)})`
                            : 'Add to Cart'
                          }
                        </button>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>
            </div>

            {/* Cart Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-xl p-6 sticky top-4 animate-fade-in-up delay-400">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">🛒 Your Cart</h2>
                  {cart.length > 0 && (
                    <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold animate-pulse-custom">
                      {cartItemCount} items
                    </div>
                  )}
                </div>
                
                {cart.length === 0 ? (
                  <div className="text-center py-12 animate-bounce-in delay-500">
                    <div className="text-6xl mb-4 animate-pulse-custom">🛒</div>
                    <p className="text-gray-500">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                      {cart.map((item, index) => (
                        <div 
                          key={item.id} 
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-all duration-300 animate-slide-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{item.name}</h4>
                            <p className="text-sm text-gray-600">${item.price} each</p>
                            <p className="text-xs text-purple-600 font-medium">
                              Subtotal: ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium text-lg animate-count">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-semibold text-gray-800">Total:</span>
                        <span className="text-2xl font-bold text-purple-600 animate-count">
                          ${cartTotal.toFixed(2)}
                        </span>
                      </div>
                      
                      <button
                        onClick={onPlaceOrder}
                        disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg text-lg disabled:transform-none disabled:shadow-md"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Placing Order...
                          </div>
                        ) : (
                          'Place Order'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerInterface;