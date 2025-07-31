import React, { useState } from 'react';
import { AlertTriangle, ChefHat } from 'lucide-react';
import { Modal } from '../ui';

interface Chef {
  id: string;
  name: string;
  email: string;
  kitchen_station_name: string;
  specialty: string;
}

interface DeleteChefModalProps {
  isOpen: boolean;
  chef: Chef;
  onClose: () => void;
  onDelete: (chefId: string) => Promise<void>;
}

const DeleteChefModal: React.FC<DeleteChefModalProps> = ({ isOpen, chef, onClose, onDelete }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete(chef.id);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Chef"
      disabled={loading}
    >
      <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure you want to delete this chef?
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              This action cannot be undone. The chef will be permanently removed from your system.
            </p>

            {/* Chef Details */}
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                  {chef.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{chef.name}</p>
                  <p className="text-sm text-gray-600">{chef.email}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <ChefHat size={14} />
                    <span>Station: {chef.kitchen_station_name}</span>
                  </div>
                  <p className="text-sm text-gray-600">Specialty: {chef.specialty}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                loading
                  ? 'bg-red-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Chef'}
            </button>
          </div>
        </div>
    </Modal>
  );
};

export default DeleteChefModal;