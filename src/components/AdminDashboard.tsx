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
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Eye,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { User, Order, Table } from './types';
import { formatCurrency, getOrderStatusColor, getTableStatusColor } from './utils';

interface AdminDashboardProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
  orders: Order[];
  tables: Table[];
}

type AdminPage = 'home' | 'tables' | 'waiters' | 'chefs' | 'menu' | 'orders' | 'reports' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  setCurrentUser,
  orders,
  tables
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
              return <TableManagementPage tables={dynamicTables} />;
            case 'waiters':
              return <WaiterManagementPage />;
            case 'chefs':
              return <ChefManagementPage />;
            case 'menu':
              return <MenuManagementPage />;
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
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-10`}></div>
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
                        <span className={`font-semibold block ${isActive ? 'text-white' : 'text-gray-900'}`}>
                          {item.label}
                        </span>
                        <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                          {item.description}
                        </span>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
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

// Home Page Component
const HomePage: React.FC<{ orders: Order[]; tables: Table[]; totalRevenue: number }> = ({ 
  orders, 
  tables, 
  totalRevenue 
}) => {
  const occupiedTables = tables.filter(table => table.status === 'occupied').length;
  const totalOrders = orders.length;
  const activeOrders = orders.filter(order => order.status === 'active').length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    // This would typically navigate to the specific page
    // For now, we'll just show an alert or you can implement actual navigation
    console.log(`Quick action clicked: ${action}`);
    alert(`Navigating to ${action} page...`);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600 mt-1">Real-time restaurant performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live Data</span>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button 
          onClick={() => handleQuickAction('reports')}
          className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg border border-green-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-500 cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-800">{formatCurrency(totalRevenue)}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <p className="text-xs text-green-600">↗ 12% from yesterday</p>
              </div>
            </div>
            <div className="bg-green-200 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-green-700" />
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => handleQuickAction('tables')}
          className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg border border-blue-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-500 cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Occupied Tables</p>
              <p className="text-3xl font-bold text-blue-800">{occupiedTables}</p>
              <div className="flex items-center mt-2">
                <div className="w-16 bg-blue-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${(occupiedTables / tables.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-600">of {tables.length} total</p>
              </div>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Utensils className="w-8 h-8 text-blue-700" />
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => handleQuickAction('orders')}
          className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border border-purple-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-500 cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-purple-800">{totalOrders}</p>
              <div className="flex items-center mt-2">
                <CheckCircle className="w-4 h-4 text-purple-600 mr-1" />
                <p className="text-xs text-purple-600">Today&apos;s orders</p>
              </div>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart className="w-8 h-8 text-purple-700" />
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => handleQuickAction('orders')}
          className="group bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg border border-orange-200 p-6 transform hover:scale-105 hover:shadow-xl transition-all duration-500 cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700 mb-1">Active Orders</p>
              <p className="text-3xl font-bold text-orange-800">{activeOrders}</p>
              <div className="flex items-center mt-2">
                <Clock className="w-4 h-4 text-orange-600 mr-1" />
                <p className="text-xs text-orange-600">In progress</p>
              </div>
            </div>
            <div className="bg-orange-200 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-8 h-8 text-orange-700" />
            </div>
          </div>
        </button>
      </div>

      {/* Enhanced Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
            <button 
              onClick={() => handleQuickAction('orders')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors duration-300"
            >
              <Eye className="w-4 h-4" />
              View All
            </button>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order, index) => (
              <div 
                key={order.id} 
                className="group flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-md transition-all duration-300 cursor-pointer transform hover:scale-102"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-800 transition-colors">
                    Order #{order.id} - Table {order.table}
                  </p>
                  <p className="text-sm text-gray-600">{order.customer_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getOrderStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleQuickAction('new-order')}
              className="group bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-200 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300 mb-2">
                  <Plus className="w-6 h-6 text-green-700" />
                </div>
                <span className="font-semibold text-green-800">New Order</span>
                <span className="text-xs text-green-600 mt-1">Create order</span>
              </div>
            </button>
            
            <button 
              onClick={() => handleQuickAction('staff')}
              className="group bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-200 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300 mb-2">
                  <Users className="w-6 h-6 text-blue-700" />
                </div>
                <span className="font-semibold text-blue-800">Manage Staff</span>
                <span className="text-xs text-blue-600 mt-1">View employees</span>
              </div>
            </button>
            
            <button 
              onClick={() => handleQuickAction('reports')}
              className="group bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-purple-200 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300 mb-2">
                  <BarChart3 className="w-6 h-6 text-purple-700" />
                </div>
                <span className="font-semibold text-purple-800">Reports</span>
                <span className="text-xs text-purple-600 mt-1">View analytics</span>
              </div>
            </button>
            
            <button 
              onClick={() => handleQuickAction('settings')}
              className="group bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-orange-200 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300 mb-2">
                  <Settings className="w-6 h-6 text-orange-700" />
                </div>
                <span className="font-semibold text-orange-800">Settings</span>
                <span className="text-xs text-orange-600 mt-1">Configure</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Table Management Page
const TableManagementPage: React.FC<{ tables: Table[] }> = ({ tables }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied' | 'needs_reset'>('all');

  const filteredTables = tables.filter(table => {
    const matchesSearch = table.table_number.toString().includes(searchTerm) || 
                         (table.waiter_name && table.waiter_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Table Management</h2>
          <p className="text-gray-600 mt-1">Monitor and manage restaurant tables</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105">
          <Plus className="w-5 h-5" />
          Add New Table
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tables by number or waiter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'available', 'occupied', 'needs_reset'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTables.map((table, index) => (
          <div 
            key={table.id} 
            className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-500 transform hover:scale-105 cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Table {table.table_number}
                </h3>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {table.guests} guests
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTableStatusColor(table.status)}`}>
                {table.status}
              </span>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Revenue:</span>
                <span className="font-semibold text-green-600">{formatCurrency(table.revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Waiter:</span>
                <span className="font-medium text-gray-900">{table.waiter_name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">QR Code:</span>
                <span className="text-xs text-gray-500 font-mono">{table.qr_code.slice(0, 8)}...</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 transition-all duration-300 flex items-center justify-center gap-1 group-hover:bg-blue-600 group-hover:text-white">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-1">
                <Eye className="w-4 h-4" />
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tables found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

// Waiter Management Page
const WaiterManagementPage: React.FC = () => {
  const waiters = [
    { id: 1, name: 'Sarah Waiter', status: 'active', tables: 4, orders: 12 },
    { id: 2, name: 'John Server', status: 'active', tables: 3, orders: 8 },
    { id: 3, name: 'Maria Host', status: 'break', tables: 2, orders: 5 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Waiter Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">
          Add New Waiter
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="space-y-4">
          {waiters.map((waiter) => (
            <div key={waiter.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {waiter.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{waiter.name}</p>
                  <p className="text-sm text-gray-600">{waiter.tables} tables assigned</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  waiter.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {waiter.status}
                </span>
                <p className="text-sm text-gray-600">{waiter.orders} orders</p>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Chef Management Page
const ChefManagementPage: React.FC = () => {
  const chefs = [
    { id: 1, name: 'Gordon Chef', status: 'active', orders: 8, specialty: 'Main Dishes' },
    { id: 2, name: 'Julia Baker', status: 'active', orders: 5, specialty: 'Desserts' },
    { id: 3, name: 'Carlos Grill', status: 'break', orders: 3, specialty: 'Grilled Items' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Chef Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">
          Add New Chef
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="space-y-4">
          {chefs.map((chef) => (
            <div key={chef.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                  {chef.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{chef.name}</p>
                  <p className="text-sm text-gray-600">Specialty: {chef.specialty}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  chef.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {chef.status}
                </span>
                <p className="text-sm text-gray-600">{chef.orders} orders</p>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Menu Management Page
const MenuManagementPage: React.FC = () => {
  const menuCategories = ['Main', 'Starter', 'Dessert', 'Beverage'];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Menu Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">
          Add New Item
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuCategories.map((category) => (
          <div key={category} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{category}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Sample Item</p>
                  <p className="text-sm text-gray-600">$9.99</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-all">
              Add {category} Item
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Order Management Page
const OrderManagementPage: React.FC<{ orders: Order[] }> = ({ orders }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Order Management</h2>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">Order #{order.id}</h3>
                  <p className="text-sm text-gray-600">Table {order.table} - {order.customer_name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getOrderStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 mb-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.menu_item.name}</span>
                    <span>{formatCurrency(item.price_at_time * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-all">
                  Update Status
                </button>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-all">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Reports Page
const ReportsPage: React.FC<{ orders: Order[]; tables: Table[] }> = ({ orders, tables }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Reports & Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Revenue Analytics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Today&apos;s Revenue</span>
              <span className="font-bold">{formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}</span>
            </div>
            <div className="flex justify-between">
              <span>Average Order Value</span>
              <span className="font-bold">{formatCurrency(orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Orders</span>
              <span className="font-bold">{orders.length}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Table Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Occupied Tables</span>
              <span className="font-bold">{tables.filter(t => t.status === 'occupied').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Available Tables</span>
              <span className="font-bold">{tables.filter(t => t.status === 'available').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Utilization Rate</span>
              <span className="font-bold">{Math.round((tables.filter(t => t.status === 'occupied').length / tables.length) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {orders.slice(0, 10).map((order) => (
            <div key={order.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Order #{order.id} placed</span>
              <span className="text-sm text-gray-600">
                {new Date(order.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Settings Page
const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
      
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Restaurant Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
            <input type="text" className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" defaultValue="Restaurant Management System" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
            <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" defaultValue="9:00 AM - 10:00 PM" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
            <input type="email" className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" defaultValue="admin@restaurant.com" />
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 