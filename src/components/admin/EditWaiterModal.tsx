import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Input, Modal } from '../ui';

interface Waiter {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
}

interface EditWaiterModalProps {
  isOpen: boolean;
  waiter: Waiter;
  onClose: () => void;
  onUpdate: (waiterData: {
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    is_active?: boolean;
    password?: string;
  }) => Promise<void>;
}

const EditWaiterModal: React.FC<EditWaiterModalProps> = ({ isOpen, waiter, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: waiter.name,
    email: waiter.email,
    phone: waiter.phone || '',
    is_active: waiter.is_active,
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (changePassword) {
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
      const updateData: {
        id: string;
        name?: string;
        email?: string;
        phone?: string;
        is_active?: boolean;
        password?: string;
      } = {
        id: waiter.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        is_active: formData.is_active
      };

      if (changePassword && formData.password) {
        updateData.password = formData.password;
      }

      await onUpdate(updateData);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
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
      title="Edit Waiter"
      disabled={loading}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Field */}
          <Input
            type="text"
            label="Full Name *"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter waiter's full name"
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



          {/* Status Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  checked={formData.is_active}
                  onChange={() => handleInputChange('is_active', true)}
                  className="mr-2"
                  disabled={loading}
                />
                <span className="text-sm text-purple-600">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  checked={!formData.is_active}
                  onChange={() => handleInputChange('is_active', false)}
                  className="mr-2"
                  disabled={loading}
                />
                <span className="text-sm text-red-700">Inactive</span>
              </label>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="changePassword"
                checked={changePassword}
                onChange={(e) => {
                  setChangePassword(e.target.checked);
                  if (!e.target.checked) {
                    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                    setErrors(prev => {
                      const { password, confirmPassword, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className="mr-2"
                disabled={loading}
              />
              <label htmlFor="changePassword" className="text-sm font-medium text-gray-700">
                Change Password
              </label>
            </div>

            {changePassword && (
              <>
                {/* Password Field */}
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password *
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
                      className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter new password"
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
                    Confirm New Password *
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
                      className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Confirm new password"
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
              </>
            )}
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
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-400 to-purple-600'
              }`}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Waiter'}
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default EditWaiterModal;