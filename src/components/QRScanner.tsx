import React from 'react';
import { QrCode, Camera, Eye, CheckCircle } from 'lucide-react';
import { User } from './types';
import { generateQR } from './utils';

interface QRScannerProps {
  qrInput: string;
  setQrInput: (input: string) => void;
  isScanning: boolean;
  loading: boolean;
  showQrCodes: boolean;
  setShowQrCodes: (show: boolean) => void;
  dummyUsers: Record<string, User>;
  onQrScan: () => void;
  onSimulateQrScan: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({
  qrInput,
  setQrInput,
  isScanning,
  loading,
  showQrCodes,
  setShowQrCodes,
  dummyUsers,
  onQrScan,
  onSimulateQrScan
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
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
            <input
              type="text"
              placeholder="Enter QR Code (e.g., QR001, ADMIN001)"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-center font-mono text-lg text-black"
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
                {Object.entries(dummyUsers).map(([code, user]) => (
                  <div key={code} className="flex items-center space-x-2 p-2 bg-white rounded-lg border">
                    <div className="w-8 h-8 bg-gray-800 rounded grid grid-cols-4 gap-px p-1">
                      {generateQR().flat().slice(0, 16).map((dot, i) => (
                        <div key={i} className={`${dot ? 'bg-white' : 'bg-gray-800'} rounded-sm`}></div>
                      ))}
                    </div>
                    <div>
                      <p className="font-mono font-bold text-gray-800">{code}</p>
                      <p className="text-gray-600 capitalize">{user.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner; 