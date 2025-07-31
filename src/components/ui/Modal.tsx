import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  disabled?: boolean;
  className?: string;
  backgroundOpacity?: 'none' | 'light' | 'medium' | 'dark';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  showCloseButton = true,
  disabled = false,
  className = '',
  backgroundOpacity = 'dark'
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  const backgroundClasses = {
    none: 'backdrop-blur-md',
    light: 'bg-black bg-opacity-20 backdrop-blur-md',
    medium: 'bg-black bg-opacity-30 backdrop-blur-md',
    dark: 'bg-black bg-opacity-40 backdrop-blur-lg'
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !disabled) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 ${backgroundClasses[backgroundOpacity]} z-50 flex items-center justify-center p-4`}
      onClick={handleBackdropClick}
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className={`bg-white rounded-2xl shadow-xl w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            {title && (
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                disabled={disabled}
                type="button"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;