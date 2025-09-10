import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Session, SessionCustomer } from './types';
import { CustomerRegistrationModal } from './CustomerRegistrationModal';

interface SessionChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableId: string;
  restaurantId: string;
  onJoinSession: (otp: string, customerData: { name: string; phone: string }) => Promise<void>;
  onCreateSession: (customerData: { name: string; phone: string }) => Promise<void>;
  title?: string;
}

interface SessionInfo {
  sessionId: string;
  tableId: string;
  restaurantId: string;
  otp: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  customers?: SessionCustomer[];
  orderCount?: number;
}

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

// OTP Input Component
const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, error, disabled = false }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));

  useEffect(() => {
    // Initialize OTP array from value prop
    if (value) {
      const otpArray = value.split('').slice(0, 6);
      const paddedOtp = [...otpArray, ...new Array(6 - otpArray.length).fill('')];
      setOtp(paddedOtp);
    } else {
      setOtp(new Array(6).fill(''));
    }
  }, [value]);

  useEffect(() => {
    // Focus first empty input on mount
    if (inputRefs.current[0]) {
      const firstEmptyIndex = otp.findIndex(digit => digit === '');
      const focusIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
    }
  }, [otp]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;

    // Only allow numeric input
    if (!/^\d*$/.test(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Update parent component
    onChange(newOtp.join(''));

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      if (otp[index]) {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange(newOtp.join(''));
      } else if (index > 0) {
        // Move to previous input
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length === 6) {
      const newOtp = digits.split('');
      setOtp(newOtp);
      onChange(digits);
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Enter 6-digit OTP to join session
        </label>
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={disabled}
              className={`
                w-12 h-12 text-center text-lg font-bold border-2 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200
                ${error 
                  ? 'border-red-500 bg-red-50' 
                  : digit 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
          ))}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
};

// Session Info Display Component
const SessionInfoDisplay: React.FC<{ session: SessionInfo }> = ({ session }) => {
  const formatCurrency = (amount: number) => {
          return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-blue-900">Active Session Found</h3>
        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
          Active
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Session ID:</span>
          <p className="font-medium text-gray-900">{session.sessionId.slice(0, 8)}...</p>
        </div>
        <div>
          <span className="text-gray-600">Created:</span>
          <p className="font-medium text-gray-900">{formatDate(session.createdAt)}</p>
        </div>
        <div>
          <span className="text-gray-600">Total Amount:</span>
          <p className="font-medium text-gray-900">{formatCurrency(session.totalAmount)}</p>
        </div>
        <div>
          <span className="text-gray-600">Participants:</span>
          <p className="font-medium text-gray-900">{session.customers?.length || 0}</p>
        </div>
      </div>

      {session.customers && session.customers.length > 0 && (
        <div>
          <span className="text-gray-600 text-sm">Current Participants:</span>
          <div className="mt-1 space-y-1">
            {session.customers.slice(0, 3).map((customer, index) => (
              <div key={customer.id} className="text-sm text-gray-700">
                • {customer.name}
              </div>
            ))}
            {session.customers.length > 3 && (
              <div className="text-sm text-gray-500">
                +{session.customers.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const SessionChoiceModal: React.FC<SessionChoiceModalProps> = ({
  isOpen,
  onClose,
  tableId,
  restaurantId,
  onJoinSession,
  onCreateSession,
  title = 'Session Choice'
}) => {
  // Component states
  const [currentState, setCurrentState] = useState<'loading' | 'no-session' | 'has-session' | 'otp-entry' | 'processing' | 'error'>('loading');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [registrationData, setRegistrationData] = useState<{ name: string; phone: string } | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentState('loading');
      setSessionInfo(null);
      setOtpValue('');
      setOtpError('');
      setErrorMessage('');
      setRegistrationData(null);
      checkActiveSession();
    }
  }, [isOpen, tableId]);

  // Check for active session
  const checkActiveSession = async () => {
    try {
      setCurrentState('loading');
      setErrorMessage('');

      const response = await fetch(`/api/sessions/active?tableId=${tableId}`);
      const result = await response.json();

      if (result.success) {
        setSessionInfo(result.data);
        setCurrentState('has-session');
      } else if (response.status === 404) {
        setCurrentState('no-session');
      } else {
        throw new Error(result.message || 'Failed to check session status');
      }
    } catch (error: any) {
      console.error('Error checking active session:', error);
      setErrorMessage(error.message || 'Failed to check session status');
      setCurrentState('error');
    }
  };

  // Handle OTP validation
  const validateOTP = (otp: string): boolean => {
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a 6-digit OTP');
      return false;
    }
    if (!/^\d{6}$/.test(otp)) {
      setOtpError('OTP must contain only numbers');
      return false;
    }
    setOtpError('');
    return true;
  };

  // Handle join session
  const handleJoinSession = async () => {
    if (!validateOTP(otpValue)) return;
    if (!registrationData) return;

    try {
      setCurrentState('processing');
      setOtpError('');

      await onJoinSession(otpValue, registrationData);
      onClose();
    } catch (error: any) {
      console.error('Error joining session:', error);
      setOtpError(error.message || 'Failed to join session');
      setCurrentState('otp-entry');
    }
  };

  // Handle create new session
  const handleCreateSession = async () => {
    if (!registrationData) return;
    
    try {
      setCurrentState('processing');
      await onCreateSession(registrationData);
      onClose();
    } catch (error: any) {
      console.error('Error creating session:', error);
      setErrorMessage(error.message || 'Failed to create session');
      setCurrentState('has-session');
    }
  };

  // Handle customer registration
  const handleCustomerRegistration = (customerData: { name: string; phone: string }) => {
    setRegistrationData(customerData);
    setCurrentState('otp-entry');
  };

  // Render loading state
  if (currentState === 'loading') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={title} showCloseButton={false}>
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Checking for active session...</p>
        </div>
      </Modal>
    );
  }

  // Render error state
  if (currentState === 'error') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <div className="text-center py-6 space-y-4">
          <div className="text-red-500 text-6xl">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900">Error</h3>
          <p className="text-gray-600">{errorMessage}</p>
          <button
            onClick={checkActiveSession}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Modal>
    );
  }

  // Render no session state
  if (currentState === 'no-session') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <div className="text-center py-6 space-y-6">
          <div className="text-blue-500 text-6xl">🍽️</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Session Found</h3>
            <p className="text-gray-600">Start a new group ordering session for this table.</p>
          </div>
          
          <button
            onClick={() => {
              onCreateSession({} as any);
            }}
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            Start New Session
          </button>
        </div>
      </Modal>
    );
  }

  // Render has session state
  if (currentState === 'has-session' && sessionInfo) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="lg">
        <div className="space-y-6">
          <SessionInfoDisplay session={sessionInfo} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => onCreateSession({} as any)}
              className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
            >
              Start New Session
            </button>
            <button
              onClick={() => {
                onClose();
                // Signal to parent that we want to join existing session
                onJoinSession('', { name: '', phone: '' });
              }}
              className="px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              Join Existing Session
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Render OTP entry state
  if (currentState === 'otp-entry') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Join Session" maxWidth="md">
        <div className="space-y-6">
          {sessionInfo && <SessionInfoDisplay session={sessionInfo} />}
          
          <OTPInput
            value={otpValue}
            onChange={setOtpValue}
            error={otpError}
            disabled={(currentState as any) === 'processing'}
          />
          
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentState('has-session')}
              disabled={(currentState as any) === 'processing'}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleJoinSession}
              disabled={(currentState as any) === 'processing' || !otpValue || otpValue.length !== 6}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {(currentState as any) === 'processing' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Joining...
                </>
              ) : (
                'Join Session'
              )}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return null;
};

export default SessionChoiceModal; 