import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { User } from './types';

interface CustomerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerData: { name: string; phone: string }) => Promise<void>;
  title?: string;
  submitText?: string;
  cancelText?: string;
}

interface FormData {
  name: string;
  phone: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
}

export const CustomerRegistrationModal: React.FC<CustomerRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Customer Registration',
  submitText = 'Register',
  cancelText = 'Cancel'
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Auto-focus on name field when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const nameInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (nameInput) {
          nameInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', phone: '' });
      setErrors({});
      setIsLoading(false);
      setIsSubmitted(false);
    }
  }, [isOpen]);

  // Phone number formatting function
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Handle international format
    if (digits.startsWith('1') && digits.length >= 11) {
      // US format: +1 (555) 123-4567
      const match = digits.match(/^1(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
      }
    } else if (digits.startsWith('91') && digits.length >= 12) {
      // India format: +91 98765 43210
      const match = digits.match(/^91(\d{5})(\d{5})$/);
      if (match) {
        return `+91 ${match[1]} ${match[2]}`;
      }
    } else if (digits.length >= 10) {
      // Generic format for other countries
      if (digits.length <= 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else {
        return `+${digits}`;
      }
    }
    
    return digits;
  };

  // Name validation
  const validateName = (name: string): string | undefined => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return 'Name is required';
    }
    
    if (trimmedName.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    
    if (trimmedName.length > 50) {
      return 'Name must be less than 50 characters';
    }
    
    // Allow letters, spaces, and common punctuation
    const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
    if (!nameRegex.test(trimmedName)) {
      return 'Name can only contain letters, spaces, hyphens, apostrophes, and periods';
    }
    
    return undefined;
  };

  // Phone validation
  const validatePhone = (phone: string): string | undefined => {
    const digits = phone.replace(/\D/g, '');
    
    if (!digits) {
      return 'Phone number is required';
    }
    
    if (digits.length < 10) {
      return 'Phone number must be at least 10 digits';
    }
    
    if (digits.length > 15) {
      return 'Phone number must be less than 15 digits';
    }
    
    return undefined;
  };

  // Real-time validation
  const validateField = (field: keyof FormData, value: string) => {
    let error: string | undefined;
    
    switch (field) {
      case 'name':
        error = validateName(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    return !error;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    let processedValue = value;
    
    if (field === 'phone') {
      processedValue = formatPhoneNumber(value);
    } else if (field === 'name') {
      // Auto-capitalize first letter of each word
      processedValue = value.replace(/\b\w/g, (char) => char.toUpperCase());
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      validateField(field, processedValue);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate all fields
    const nameValid = validateField('name', formData.name);
    const phoneValid = validateField('phone', formData.phone);
    
    if (!nameValid || !phoneValid) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onSubmit({
        name: formData.name.trim(),
        phone: formData.phone
      });
      
      setIsSubmitted(true);
      
      // Close modal after a brief delay to show success
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Registration error:', error);
      // Handle error - could add a general error state here
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return !errors.name && !errors.phone && 
           formData.name.trim().length > 0 && 
           formData.phone.replace(/\D/g, '').length >= 10;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      showCloseButton={true}
      disabled={isLoading}
      backgroundOpacity="dark"
    >
      <div className="space-y-6" onKeyDown={handleKeyDown}>
        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Registration Successful!
            </h3>
            <p className="text-gray-600">
              Welcome, {formData.name}! You can now proceed with your order.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                disabled={isLoading}
                aria-label="Full name"
                aria-describedby={errors.name ? "name-error" : undefined}
                aria-invalid={!!errors.name}
                maxLength={50}
              />
              
              <Input
                label="Phone Number"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                error={errors.phone}
                disabled={isLoading}
                aria-label="Phone number"
                aria-describedby={errors.phone ? "phone-error" : undefined}
                aria-invalid={!!errors.phone}
                maxLength={20}
              />
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>• Name must be 2-50 characters long</p>
              <p>• Phone number must be 10-15 digits</p>
              <p>• International formats are supported</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid() || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Registering...
                  </>
                ) : (
                  submitText
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CustomerRegistrationModal; 