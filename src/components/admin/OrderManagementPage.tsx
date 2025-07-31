import React from 'react';
import { Order } from '../types';
import { formatCurrency, getOrderStatusColor } from '../utils';

interface OrderManagementPageProps {
  orders: Order[];
}

const OrderManagementPage: React.FC<OrderManagementPageProps> = ({ orders }) => {
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

export default OrderManagementPage; 