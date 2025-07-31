import React from 'react';

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

export default ChefManagementPage; 