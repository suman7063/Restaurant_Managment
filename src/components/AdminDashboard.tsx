import React, { useState } from 'react';
import { 
  Home, 
  Utensils, 
  UserCheck, 
  Users, 
  FileText, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { User, Order, Table } from './types';
import {
  HomePage,
  TableManagementPage,
  WaiterManagementPage,
  ChefManagementPage,
  MenuManagementPage,
  OrderManagementPage,
  ReportsPage,
  SettingsPage
} from './admin';


interface AdminDashboardProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
  orders: Order[];
  tables: Table[];
  restaurantId: string;
}

type AdminPage = 'home' | 'tables' | 'waiters' | 'chefs' | 'menu' | 'orders' | 'reports' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  setCurrentUser,
  orders,
  tables,
  restaurantId
}) => {
  const [currentPage, setCurrentPage] = useState<AdminPage>('home');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate dynamic table status based on orders
  const getTableStatus = (tableId: number): 'available' | 'occupied' | 'needs_reset' => {
    const tableOrders = orders.filter(order => order.table === tableId && order.status === 'active');
    if (tableOrders.length > 0) {
      return 'occupied';
    }
    return 'available';
  };

  const getTableGuests = (tableId: number) => {
    const tableOrder = orders.find(order => order.table === tableId && order.status === 'active');
    if (tableOrder) {
      return tableOrder.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    return 0;
  };

  const getTableRevenue = (tableId: number) => {
    const tableOrder = orders.find(order => order.table === tableId && order.status === 'active');
    if (tableOrder) {
      return tableOrder.total;
    }
    return 0;
  };

  const dynamicTables = tables.map(table => ({
    ...table,
    status: getTableStatus(table.table_number),
    guests: getTableGuests(table.table_number),
    revenue: getTableRevenue(table.table_number)
  }));

  const totalRevenue = dynamicTables.reduce((sum, table) => sum + table.revenue, 0);
  const occupiedTables = dynamicTables.filter(table => table.status === 'occupied').length;
  const totalOrders = orders.length;
  const activeOrders = orders.filter(order => order.status === 'active').length;

  const handlePageChange = (page: AdminPage) => {
    setIsLoading(true);
    setCurrentPage(page);
    // Simulate loading for smooth transition
    setTimeout(() => setIsLoading(false), 300);
  };

  // Navigation items with enhanced data
  const navItems = [
    { 
      id: 'home', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Overview & Analytics',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'tables', 
      label: 'Table Management', 
      icon: Utensils,
      description: 'Manage restaurant tables',
      color: 'from-green-500 to-green-600'
    },
    { 
      id: 'waiters', 
      label: 'Waiter Management', 
      icon: UserCheck,
      description: 'Staff & assignments',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      id: 'chefs', 
      label: 'Chef Management', 
      icon: Users,
      description: 'Kitchen staff',
      color: 'from-orange-500 to-orange-600'
    },
    { 
      id: 'menu', 
      label: 'Menu Management', 
      icon: FileText,
      description: 'Menu & items',
      color: 'from-pink-500 to-pink-600'
    },
    { 
      id: 'orders', 
      label: 'Order Management', 
      icon: ShoppingCart,
      description: 'Track & manage orders',
      color: 'from-indigo-500 to-indigo-600'
    },
    { 
      id: 'reports', 
      label: 'Reports & Analytics', 
      icon: BarChart3,
      description: 'Business insights',
      color: 'from-teal-500 to-teal-600'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings,
      description: 'System configuration',
      color: 'from-gray-500 to-gray-600'
    }
  ];

  // Render different pages with animation
  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="animate-fadeIn">
        {(() => {
          switch (currentPage) {
            case 'home':
              return <HomePage orders={orders} tables={dynamicTables} totalRevenue={totalRevenue} />;
            case 'tables':
              return <TableManagementPage restaurantId={restaurantId} />;
            case 'waiters':
              return <WaiterManagementPage restaurantId={restaurantId} />;
            case 'chefs':
              return <ChefManagementPage restaurantId={restaurantId} />;
            case 'menu':
              return <MenuManagementPage restaurantId={restaurantId} />;
            case 'orders':
              return <OrderManagementPage orders={orders} />;
            case 'reports':
              return <ReportsPage orders={orders} tables={dynamicTables} />;
            case 'settings':
              return <SettingsPage />;
            default:
              return <HomePage orders={orders} tables={dynamicTables} totalRevenue={totalRevenue} />;
          }
        })()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Enhanced Header */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Welcome back, {currentUser.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all duration-300 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setCurrentUser(null)}
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Exit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Enhanced Sidebar Navigation */}
          <div className="w-72 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4 h-fit sticky top-24">
            <nav className="space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id as AdminPage)}
                    className={`w-full group relative overflow-hidden rounded-xl text-left transition-all duration-500 ${
                      isActive
                        ? 'bg-gradient-to-r shadow-lg transform scale-105'
                        : 'hover:bg-gray-50 hover:transform hover:scale-102'
                    }`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-10`}/>
                    )}
                    
                    <div className={`relative flex items-center space-x-4 px-4 py-4 ${
                      isActive ? 'text-white' : 'text-gray-700 group-hover:text-blue-600'
                    }`}>
                      <div className={`p-2 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? `bg-gradient-to-r ${item.color} shadow-lg` 
                          : 'bg-gray-100 group-hover:bg-blue-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <span className={`font-semibold block ${isActive ? 'text-gray-900' : 'text-gray-900'}`}>
                          {item.label}
                        </span>
                        <span className={`text-xs ${isActive ? 'text-blue-900' : 'text-gray-500'}`}>
                          {item.description}
                        </span>
                      </div>
                      {isActive && (
                        <div className={`w-4 h-4 bg-gradient-to-r ${item.color}   rounded-full animate-pulse`}></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content with Animation */}
          <div className="flex-1">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 min-h-[600px]">
              {renderPage()}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
      </div>
  );
};

export default AdminDashboard; 