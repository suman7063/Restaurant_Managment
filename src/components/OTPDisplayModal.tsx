import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Copy, RefreshCw, X, Share2, QrCode, MessageCircle, Users, Clock, DollarSign, ShoppingCart } from 'lucide-react';
import { Session, SessionCustomer, Order } from './types';

interface OTPDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  customers?: SessionCustomer[];
  orders?: Order[];
  restaurantName?: string;
  tableNumber?: number;
  onRegenerateOTP?: () => Promise<void>;
  onCloseSession?: () => Promise<void>;
  onStartOrdering?: () => void;
  isAdmin?: boolean;
}

interface ShareOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  description: string;
}

export const OTPDisplayModal: React.FC<OTPDisplayModalProps> = ({
  isOpen,
  onClose,
  session,
  customers = [],
  orders = [],
  restaurantName = 'Restaurant',
  tableNumber = 0,
  onRegenerateOTP,
  onCloseSession,
  onStartOrdering,
  isAdmin = false
}) => {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [sessionDuration, setSessionDuration] = useState('');

  // Calculate session duration
  useEffect(() => {
    const updateDuration = () => {
      const now = new Date();
      const created = new Date(session.created_at);
      const diff = now.getTime() - created.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setSessionDuration(`${hours}h ${minutes}m`);
      } else {
        setSessionDuration(`${minutes}m`);
      }
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [session.created_at]);

  // Copy OTP to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Copy just OTP
  const copyOTP = () => {
    if (session.session_otp) {
      copyToClipboard(session.session_otp);
    }
  };

  // Copy full session info
  const copySessionInfo = () => {
    if (session.session_otp) {
      const info = `Join our group order at ${restaurantName}!\n\nTable: ${tableNumber}\nOTP: ${session.session_otp}\n\nScan the QR code or enter the OTP to join.`;
      copyToClipboard(info);
    }
  };

  // Generate QR code data
  const generateQRData = () => {
    return JSON.stringify({
      type: 'session_join',
      otp: session.session_otp || '',
      table: tableNumber,
      restaurant: restaurantName
    });
  };

  // Share via text message
  const shareViaText = () => {
    if (session.session_otp) {
      const message = `Join our group order at ${restaurantName}! Table ${tableNumber}, OTP: ${session.session_otp}`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`sms:?body=${encodedMessage}`, '_blank');
    }
  };

  // Share via social media
  const shareViaSocial = () => {
    if (session.session_otp) {
      const text = `Join our group order at ${restaurantName}! Table ${tableNumber}, OTP: ${session.session_otp}`;
      const encodedText = encodeURIComponent(text);
      window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
    }
  };

  // Handle OTP regeneration
  const handleRegenerateOTP = async () => {
    if (!onRegenerateOTP) return;
    
    setIsRegenerating(true);
    try {
      await onRegenerateOTP();
    } catch (error) {
      console.error('Failed to regenerate OTP:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle session closure
  const handleCloseSession = async () => {
    if (!onCloseSession) return;
    
    setIsClosing(true);
    try {
      await onCloseSession();
      onClose();
    } catch (error) {
      console.error('Failed to close session:', error);
    } finally {
      setIsClosing(false);
    }
  };

  // Calculate totals
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
  const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);

  // Share options
  const shareOptions: ShareOption[] = [
    {
      id: 'copy-otp',
      label: 'Copy OTP',
      icon: <Copy size={20} />,
      action: copyOTP,
      description: 'Copy just the OTP code'
    },
    {
      id: 'copy-info',
      label: 'Copy Details',
      icon: <Copy size={20} />,
      action: copySessionInfo,
      description: 'Copy full session information'
    },
    {
      id: 'qr-code',
      label: 'QR Code',
      icon: <QrCode size={20} />,
      action: () => setShowQRCode(!showQRCode),
      description: 'Show QR code for easy sharing'
    },
    {
      id: 'text-message',
      label: 'Text Message',
      icon: <MessageCircle size={20} />,
      action: shareViaText,
      description: 'Send via text message'
    },
    {
      id: 'social',
      label: 'Social Media',
      icon: <Share2 size={20} />,
      action: shareViaSocial,
      description: 'Share on social media'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session OTP"
      maxWidth="2xl"
      showCloseButton={true}
      className="bg-gradient-to-br from-blue-50 to-indigo-50"
    >
      <div className="space-y-6">
        {/* OTP Display Section */}
        <div className="text-center space-y-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Share this OTP with your group
            </h3>
            
            {/* Large OTP Display */}
            <div className="mb-6">
              <div className="flex justify-center items-center space-x-3">
                {session.session_otp ? session.session_otp.split('').map((digit, index) => (
                  <div
                    key={index}
                    className="w-16 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-blue-300"
                  >
                    <span className="text-4xl font-bold text-white font-mono">
                      {digit}
                    </span>
                  </div>
                )) : (
                  <div className="text-center text-gray-500">
                    <p>OTP not available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={copyOTP}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
              }`}
            >
              {copied ? (
                <>
                  <span>✓</span>
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={20} />
                  Copy OTP
                </>
              )}
            </button>
          </div>
        </div>

        {/* Session Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Info */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              Session Information
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Restaurant:</span>
                <span className="font-semibold">{restaurantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Table:</span>
                <span className="font-semibold">#{tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold flex items-center gap-1">
                  <Clock size={16} />
                  {sessionDuration}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  session.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {session.status}
                </span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingCart size={20} className="text-green-600" />
              Order Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Participants:</span>
                <span className="font-semibold">{customers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Orders:</span>
                <span className="font-semibold">{totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-semibold">{totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold flex items-center gap-1">
                  <DollarSign size={16} />
                  {(totalAmount / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Participants List */}
        {customers.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-purple-600" />
              Participants ({customers.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR Code Section */}
        {showQRCode && (
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2 justify-center">
              <QrCode size={20} className="text-blue-600" />
              QR Code
            </h4>
            <div className="bg-gray-100 rounded-lg p-4 inline-block">
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border-2 border-gray-300">
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600 mb-2">
                    {session.session_otp || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Scan or enter manually
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Show this to your group members for easy joining
            </p>
          </div>
        )}

        {/* Share Options */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Share2 size={20} className="text-orange-600" />
            Share Options
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                onClick={option.action}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 group"
                title={option.description}
              >
                <div className="text-blue-600 group-hover:text-blue-700">
                  {option.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Session Management */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Session Management
          </h4>
          <div className="flex flex-wrap gap-3">
            {onStartOrdering && (
              <button
                onClick={onStartOrdering}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300"
              >
                <ShoppingCart size={20} />
                Start Ordering
              </button>
            )}
            
            {onRegenerateOTP && (
              <button
                onClick={handleRegenerateOTP}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 disabled:opacity-50"
              >
                {isRegenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw size={20} />
                    Regenerate OTP
                  </>
                )}
              </button>
            )}

            {onCloseSession && isAdmin && (
              <button
                onClick={handleCloseSession}
                disabled={isClosing}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 disabled:opacity-50"
              >
                {isClosing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Closing...
                  </>
                ) : (
                  <>
                    <X size={20} />
                    Close Session
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OTPDisplayModal; 