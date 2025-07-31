import React from 'react';
import { Plus } from 'lucide-react';

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

export default WaiterManagementPage; 