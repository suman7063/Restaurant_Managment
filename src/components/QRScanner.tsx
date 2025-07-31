import React, { useState, useEffect } from 'react';
import { QrCode, Camera, Eye, CheckCircle } from 'lucide-react';
import { User, Restaurant } from './types';


interface QRScannerProps {
  onQrScan: () => void;
  onSimulateQrScan: () => void;
  currentUser: User | null;
  restaurant: Restaurant | null;
}

const QRScanner: React.FC<QRScannerProps> = ({ onQrScan, currentUser, restaurant }) => {
  const [qrInput, setQrInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showQrCodes, setShowQrCodes] = useState(false);

  // Hide welcome message after 5 seconds
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  const onSimulateQrScan = () => {
    // Simulate QR scan functionality
    console.log('Simulating QR scan...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Welcome Message Overlay */}
      {showWelcome && restaurant && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to {restaurant.name}!</h2>
            <p className="text-gray-600 mb-6">
              Your restaurant management system is now ready. Scan QR codes to access different interfaces.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Welcome:</strong> {currentUser?.name} ({currentUser?.role})
              </p>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 transform transition-all duration-300 hover:scale-105">
        <div className="text-center mb-8">
          <div className="relative">
            <QrCode className={`mx-auto w-20 h-20 text-indigo-600 mb-4 transition-all duration-300 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning && (
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Restaurant QR System
          </h1>
          <p className="text-gray-600">Scan QR code or enter access code</p>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter QR Code (e.g., QR001, ADMIN001)"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              className="px-4 py-4 border-2 border-gray-200 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-center font-mono text-lg"
              disabled={loading}
            />
            {qrInput && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onSimulateQrScan}
              disabled={loading || isScanning}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium flex items-center justify-center space-x-2 transform hover:scale-105 disabled:opacity-50"
            >
              <Camera className={`w-5 h-5 ${isScanning ? 'animate-pulse' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Scan QR'}</span>
            </button>
            
            <button
              onClick={onQrScan}
              disabled={!qrInput || loading}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 px-4 rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 font-medium flex items-center justify-center space-x-2 transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Eye className="w-5 h-5" />
              )}
              <span>{loading ? 'Accessing...' : 'Access'}</span>
            </button>
          </div>
        </div>
        
        <div className="mt-8">
          <button
            onClick={() => setShowQrCodes(!showQrCodes)}
            className="w-full text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span>{showQrCodes ? 'Hide' : 'Show'} Demo QR Codes</span>
          </button>
          
          {showQrCodes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl animate-slide-down">
              <p className="font-medium mb-3 text-gray-800">Demo Access Codes:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white rounded border">
                  <strong>ADMIN001</strong><br />
                  <span className="text-gray-600">Admin User</span>
                </div>
                <div className="p-2 bg-white rounded border">
                  <strong>CHEF001</strong><br />
                  <span className="text-gray-600">Chef John</span>
                </div>
                <div className="p-2 bg-white rounded border">
                  <strong>WAITER001</strong><br />
                  <span className="text-gray-600">Sarah Waiter</span>
                </div>
                <div className="p-2 bg-white rounded border">
                  <strong>TABLE001</strong><br />
                  <span className="text-gray-600">Table 1 Customer</span>
                </div>
                <div className="p-2 bg-white rounded border">
                  <strong>TABLE002</strong><br />
                  <span className="text-gray-600">Table 2 Customer</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner; 