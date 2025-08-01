import React from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
  disabled?: boolean;
  className?: string;
  backgroundOpacity?: 'none' | 'light' | 'medium' | 'dark';
  // Footer props
  showFooter?: boolean;
  cancelText?: string;
  actionText?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  actionVariant?: 'primary' | 'secondary' | 'danger';
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
  backgroundOpacity = 'dark',
  // Footer props
  showFooter = false,
  cancelText = 'Cancel',
  actionText = 'Save',
  onAction,
  actionDisabled = false,
  actionLoading = false,
  actionVariant = 'primary'
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  const backgroundClasses = {
    none: 'backdrop-blur-md',
    light: 'bg-black bg-opacity-20 backdrop-blur-md',
    medium: 'bg-black bg-opacity-30 backdrop-blur-md',
    dark: 'bg-black bg-opacity-50 backdrop-blur-lg'
  };

    const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !disabled) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className={`fixed inset-0 ${backgroundClasses[backgroundOpacity]} flex items-center justify-center modal-full-overlay`}
      onClick={handleBackdropClick}
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 255, 0.1) 100%)',
        width: '100vw',
        height: '100vh',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'fixed',
        zIndex: 999999,
        margin: 0,
        padding: 0,
        transform: 'translateZ(0)',
        minHeight: '100vh',
        minWidth: '100vw',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className={`bg-white rounded-2xl shadow-xl w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] flex flex-col ${className} mx-4`}
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 1000000 }}
      >
        {/* Fixed Header */}
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0 bg-white sticky top-0 z-10">
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
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Fixed Footer */}
        {showFooter && (
          <div className="flex justify-between items-center p-6 border-t border-gray-200 flex-shrink-0 bg-white sticky bottom-0 z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={disabled || actionLoading}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
            >
              {cancelText}
            </button>
            {onAction && (
              <button
                type="button"
                onClick={onAction}
                disabled={actionDisabled || actionLoading}
                className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionVariant === 'danger' 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : actionVariant === 'secondary'
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Loading...
                  </>
                ) : (
                  actionText
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render at document body level with full coverage
  if (typeof document !== 'undefined') {
    // Add a style tag to ensure full coverage
    const styleId = 'modal-overlay-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .modal-full-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 999999 !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      `;
      document.head.appendChild(style);
    }
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};

export default Modal;