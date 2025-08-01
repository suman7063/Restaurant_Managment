import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Input, Select, Modal } from '../ui';

interface KitchenStation {
  id: string;
  name: string;
  description?: string;
  cuisine_types: string[];
  is_active: boolean;
}

interface AddChefModalProps {
  isOpen: boolean;
  restaurantId: string;
  onClose: () => void;
  onAdd: (chefData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    kitchen_station_id?: string;
    preferred_language?: string;
  }) => Promise<void>;
}

const AddChefModal: React.FC<AddChefModalProps> = ({ isOpen, restaurantId, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    kitchen_station_id: '',
    preferred_language: 'en'
  });
  const [kitchenStations, setKitchenStations] = useState<KitchenStation[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStations, setLoadingStations] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch kitchen stations
  useEffect(() => {
    const fetchKitchenStations = async () => {
      try {
        setLoadingStations(true);
        const response = await fetch(`/api/admin/kitchen-stations?restaurantId=${restaurantId}`);
        if (response.ok) {
          const data = await response.json();
          setKitchenStations(data.kitchenStations || []);
        }
      } catch (error) {
        console.error('Error fetching kitchen stations:', error);
      } finally {
        setLoadingStations(false);
      }
    };

    fetchKitchenStations();
  }, [restaurantId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        kitchen_station_id: formData.kitchen_station_id || undefined,
        preferred_language: formData.preferred_language
      });
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Chef"
      disabled={loading}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Field */}
          <Input
            type="text"
            label="Full Name *"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter chef's full name"
            disabled={loading}
            error={errors.name}
          />

          {/* Email Field */}
          <Input
            type="email"
            label="Email Address *"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter email address"
            disabled={loading}
            error={errors.email}
          />

          {/* Phone Field */}
          <Input
            type="tel"
            label="Phone Number (Optional)"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter phone number"
            disabled={loading}
          />

          {/* Kitchen Station Field */}
          <div>
            <Select
              label="Kitchen Station (Optional)"
              value={formData.kitchen_station_id}
              onChange={(e) => handleInputChange('kitchen_station_id', e.target.value)}
              disabled={loading || loadingStations}
            >
              <option value="">Select kitchen station</option>
              {kitchenStations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name} - {station.cuisine_types.join(', ')}
                </option>
              ))}
            </Select>
            {loadingStations && (
              <p className="mt-1 text-sm text-gray-500">Loading kitchen stations...</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Confirm password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          {/* Preferred Language Field */}
          <div>
            <label htmlFor="preferred_language" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Language
            </label>
            <select
              id="preferred_language"
              value={formData.preferred_language}
              onChange={(e) => handleInputChange('preferred_language', e.target.value)}
              className="block w-full py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={loading}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                loading
                  ? 'bg-orange-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Chef'}
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default AddChefModal;