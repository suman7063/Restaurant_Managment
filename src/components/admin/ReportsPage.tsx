import React from 'react';
import { Order, Table } from '../types';
import { formatCurrency } from '../utils';

interface ReportsPageProps {
  orders: Order[];
  tables: Table[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ orders, tables }) => {
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

export default ReportsPage; 