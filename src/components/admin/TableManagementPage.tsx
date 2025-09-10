import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Utensils, RefreshCw, Trash2, QrCode } from 'lucide-react';
import { Table } from '../types';
import { formatCurrency, getTableStatusColor } from '../utils';
import { fetchTables } from '../../lib/database';
import { AddTableModal, EditTableModal, DeleteTableModal, QRCodeModal } from './';
import { Input } from '../ui';

interface TableManagementPageProps {
  restaurantId: string;
}

const TableManagementPage: React.FC<TableManagementPageProps> = ({ restaurantId }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied' | 'needs_reset'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [error, setError] = useState('');

  // Fetch tables from Supabase
  const loadTables = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      const fetchedTables = await fetchTables(restaurantId);
      setTables(fetchedTables);
    } catch (err) {
      console.error('Error loading tables:', err);
      setError('Failed to load tables. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [restaurantId]);

  // Load tables on component mount
  useEffect(() => {
    loadTables();
  }, [restaurantId, loadTables]);

  // Handle table added
  const handleTableAdded = () => {
    loadTables(true); // Refresh the table list
  };

  // Handle table updated
  const handleTableUpdated = () => {
    loadTables(true); // Refresh the table list
  };

  // Handle table deleted
  const handleTableDeleted = () => {
    loadTables(true); // Refresh the table list
  };

  // Handle edit table
  const handleEditTable = (table: Table) => {
    setSelectedTable(table);
    setIsEditModalOpen(true);
  };

  // Handle delete table
  const handleDeleteTable = (table: Table) => {
    setSelectedTable(table);
    setIsDeleteModalOpen(true);
  };

  // Handle view QR code
  const handleViewQRCode = (table: Table) => {
    setSelectedTable(table);
    setIsQRModalOpen(true);
  };

  // Filter tables based on search and status
  const filteredTables = tables.filter(table => {
    const matchesSearch = table.table_number.toString().includes(searchTerm) || 
                         (table.waiter_name && table.waiter_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Table Management</h2>
            <p className="text-gray-600 mt-1">Monitor and manage restaurant tables</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Table Management</h2>
          <p className="text-gray-600 mt-1">Monitor and manage restaurant tables</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => loadTables(true)}
            disabled={isRefreshing}
            className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Add New Table
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
            <Input
              type="text"
              placeholder="Search tables by number or waiter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3"
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
                  <Utensils className="w-4 h-4" />
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
                <span className="text-xs text-gray-500 font-mono cursor-pointer hover:text-blue-600" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewQRCode(table);
                      }}
                      title="Click to view QR code">
                  {table.qr_code.slice(0, 8)}...
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewQRCode(table);
                }}
                className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm hover:bg-green-200 transition-all duration-300 flex items-center justify-center gap-1 group-hover:bg-green-600 group-hover:text-white"
              >
                <QrCode className="w-4 h-4" />
                QR Code
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditTable(table);
                }}
                className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 transition-all duration-300 flex items-center justify-center gap-1 group-hover:bg-blue-600 group-hover:text-white"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTable(table);
                }}
                className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-200 transition-all duration-300 flex items-center justify-center gap-1 group-hover:bg-red-600 group-hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTables.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {tables.length === 0 ? 'No tables found' : 'No tables match your search'}
          </h3>
          <p className="text-gray-600">
            {tables.length === 0 
              ? 'Get started by adding your first table' 
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {tables.length === 0 && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Add Your First Table
            </button>
          )}
        </div>
      )}

      {/* Add Table Modal */}
      <AddTableModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTableAdded={handleTableAdded}
        restaurantId={restaurantId}
      />

      {/* Edit Table Modal */}
      <EditTableModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTable(null);
        }}
        onTableUpdated={handleTableUpdated}
        table={selectedTable}
        restaurantId={restaurantId}
      />

      {/* Delete Table Modal */}
      <DeleteTableModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTable(null);
        }}
        onTableDeleted={handleTableDeleted}
        table={selectedTable}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          setSelectedTable(null);
        }}
        table={selectedTable}
        restaurantId={restaurantId}
      />
    </div>
  );
};

export default TableManagementPage; 