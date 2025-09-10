"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Session, SessionCustomer } from './types';
import { 
  Copy, 
  RefreshCw, 
  X, 
  Users, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Share2,
  QrCode,
  MessageCircle,
  Smartphone,
  Mail,
  ExternalLink
} from 'lucide-react';
import { Modal } from './ui';

interface SessionInfoHeaderProps {
  session: Session;
  participants: SessionCustomer[];
  currentCustomer?: SessionCustomer | null;
  totalAmount: number;
  orderCount: number;
  onCopyOTP?: () => Promise<void>;
  onRegenerateOTP?: () => Promise<void>;
  onCloseSession?: () => Promise<void>;
  onShareSession?: () => Promise<void>;
  loading?: boolean;
  isAdmin?: boolean;
}

export const SessionInfoHeader: React.FC<SessionInfoHeaderProps> = ({
  session,
  participants,
  currentCustomer,
  totalAmount,
  orderCount,
  onCopyOTP,
  onRegenerateOTP,
  onCloseSession,
  onShareSession,
  loading = false,
  isAdmin = false
}) => {
  const [sessionDuration, setSessionDuration] = useState<string>('');
  const [copiedOTP, setCopiedOTP] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Calculate session duration
  useEffect(() => {
    const updateDuration = () => {
      const now = new Date();
      const start = new Date(session.created_at);
      const diff = now.getTime() - start.getTime();
      
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

  // Handle OTP copy
  const handleCopyOTP = useCallback(async () => {
    if (onCopyOTP) {
      setActionLoading('copy');
      try {
        await onCopyOTP();
        setCopiedOTP(true);
        setTimeout(() => setCopiedOTP(false), 2000);
      } catch (error) {
        console.error('Error copying OTP:', error);
      } finally {
        setActionLoading(null);
      }
    } else {
      // Fallback to clipboard API
      try {
        await navigator.clipboard.writeText(session.session_otp);
        setCopiedOTP(true);
        setTimeout(() => setCopiedOTP(false), 2000);
      } catch (error) {
        console.error('Error copying OTP:', error);
      }
    }
  }, [session.session_otp, onCopyOTP]);

  // Handle regenerate OTP
  const handleRegenerateOTP = useCallback(async () => {
    if (onRegenerateOTP) {
      setActionLoading('regenerate');
      try {
        await onRegenerateOTP();
      } catch (error) {
        console.error('Error regenerating OTP:', error);
      } finally {
        setActionLoading(null);
      }
    }
  }, [onRegenerateOTP]);

  // Handle close session
  const handleCloseSession = useCallback(async () => {
    if (onCloseSession) {
      setActionLoading('close');
      try {
        await onCloseSession();
      } catch (error) {
        console.error('Error closing session:', error);
      } finally {
        setActionLoading(null);
      }
    }
  }, [onCloseSession]);

  // Handle share session
  const handleShareSession = useCallback(async () => {
    if (onShareSession) {
      setActionLoading('share');
      try {
        await onShareSession();
      } catch (error) {
        console.error('Error sharing session:', error);
      } finally {
        setActionLoading(null);
      }
    }
  }, [onShareSession]);

  // Social sharing functions
  const shareViaWhatsApp = () => {
    const message = `Join our group order session! Use code: ${session.session_otp}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareViaTelegram = () => {
    const message = `Join our group order session! Use code: ${session.session_otp}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareViaSMS = () => {
    const message = `Join our group order session! Use code: ${session.session_otp}`;
    const url = `sms:?body=${encodeURIComponent(message)}`;
    window.open(url);
  };

  const shareViaEmail = () => {
    const subject = 'Join our group order session';
    const body = `Hi! I've started a group order session. Use the code ${session.session_otp} to join and place your order.`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url);
  };

  // Generate QR code data
  const generateQRData = () => {
    const sessionUrl = `${window.location.origin}/table/${session.session_otp}`;
    return sessionUrl;
  };

  // Get status indicator
  const getStatusIndicator = () => {
    switch (session.status) {
      case 'active':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Active</span>
          </div>
        );
      case 'billed':
        return (
          <div className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Billed</span>
          </div>
        );
      case 'cleared':
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Closed</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
          return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount / 100);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Group Session</h2>
              <p className="text-sm text-gray-600">Table {session.restaurant_tables?.table_number || session.table_id.slice(0, 8)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {getStatusIndicator()}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{sessionDuration}</span>
            </div>
          </div>
        </div>

        {/* OTP Display */}
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6 mb-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-2">Session Code</p>
            <div className="flex items-center justify-center gap-3">
              <div className="bg-blue-50 px-6 py-3 rounded-lg">
                <span className="text-3xl font-bold text-blue-600 tracking-wider">
                  {session.session_otp}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyOTP}
                  disabled={loading || actionLoading === 'copy'}
                  className={`p-2 rounded-lg transition-colors ${
                    copiedOTP 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                  title="Copy OTP"
                >
                  {copiedOTP ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => setShowQRCode(true)}
                  className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                  title="Show QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Share this code with others to join the session
            </p>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Participants</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{participants.length}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Total Amount</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Orders</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{orderCount}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Average</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {orderCount > 0 ? formatCurrency(totalAmount / orderCount) : '₹0.00'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRegenerateOTP}
            disabled={loading || actionLoading === 'regenerate' || session.status !== 'active' || !isAdmin}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading === 'regenerate' ? 'animate-spin' : ''}`} />
            <span>Regenerate OTP</span>
          </button>

          <button
            onClick={() => setShowShareOptions(true)}
            disabled={loading || actionLoading === 'share'}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Session</span>
          </button>

          {session.status === 'active' && isAdmin && (
            <button
              onClick={handleCloseSession}
              disabled={loading || actionLoading === 'close'}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Close Session</span>
            </button>
          )}
        </div>

        {/* Current User Info */}
        {currentCustomer && (
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">You:</span> {currentCustomer.name} ({currentCustomer.phone})
            </p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        title="Session QR Code"
        maxWidth="sm"
        showFooter={false}
      >
        <div className="text-center space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            {/* QR Code placeholder - in real implementation, use a QR code library */}
            <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">QR Code</p>
                <p className="text-xs text-gray-500 mt-1">{session.session_otp}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Scan this QR code to join the session
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(generateQRData());
                setShowQRCode(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>
      </Modal>

      {/* Share Options Modal */}
      <Modal
        isOpen={showShareOptions}
        onClose={() => setShowShareOptions(false)}
        title="Share Session"
        maxWidth="md"
        showFooter={false}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Share the session code with others to invite them to join
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareViaWhatsApp}
              className="flex items-center gap-3 p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={shareViaTelegram}
              className="flex items-center gap-3 p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Telegram</span>
            </button>

            <button
              onClick={shareViaSMS}
              className="flex items-center gap-3 p-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <Smartphone className="w-5 h-5" />
              <span>SMS</span>
            </button>

            <button
              onClick={shareViaEmail}
              className="flex items-center gap-3 p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span>Email</span>
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleCopyOTP}
              className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Session Code</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}; 