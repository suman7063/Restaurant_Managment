import React, { useState, useEffect } from 'react';
import { Download, Copy, CheckCircle, X } from 'lucide-react';
import QRCode from 'qrcode';
import { Modal } from '../ui';
import { Table } from '../types';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  restaurantId: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  table,
  restaurantId
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && table) {
      generateQRCode();
    }
  }, [isOpen, table]);

  const generateQRCode = async () => {
    if (!table) return;

    setIsGenerating(true);
    try {
      // Create the URL that the QR code should point to
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const qrCodeUrl = `${baseUrl}/table/${table.qr_code}`;
      
      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(qrCodeUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!qrCodeDataUrl || !table) return;

    setIsDownloading(true);
    try {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `table-${table.table_number}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyQRCode = async () => {
    if (!qrCodeDataUrl) return;

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeDataUrl);
      const blob = await response.blob();
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying QR code:', error);
    }
  };

  const handleClose = () => {
    setQrCodeDataUrl('');
    setCopied(false);
    onClose();
  };

  if (!table) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`QR Code - Table ${table.table_number}`}
      maxWidth="md"
      showCloseButton={true}
    >
      <div className="p-6 space-y-6">
        {/* QR Code Display */}
        <div className="flex flex-col items-center space-y-4">
          {isGenerating ? (
            <div className="flex items-center justify-center w-80 h-80 bg-gray-100 rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : qrCodeDataUrl ? (
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-lg">
              {/* QR Code with branding */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Table {table.table_number}</h3>
                <p className="text-sm text-gray-600">Scan to view menu & order</p>
              </div>
              <img 
                src={qrCodeDataUrl} 
                alt={`QR Code for Table ${table.table_number}`}
                className="w-64 h-64 mx-auto"
              />
              <div className="text-center mt-4">
                <p className="text-xs text-gray-500 font-mono">{table.qr_code.slice(0, 12)}...</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-80 h-80 bg-gray-100 rounded-lg">
              <p className="text-gray-500">Failed to generate QR code</p>
            </div>
          )}
        </div>

        {/* Table Information */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Table Number:</span>
            <span className="font-semibold">{table.table_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">QR Code ID:</span>
            <span className="text-xs font-mono text-gray-500">{table.qr_code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <span className="font-semibold capitalize">{table.status}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={!qrCodeDataUrl || isDownloading}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {isDownloading ? 'Downloading...' : 'Download PNG'}
          </button>
          
          <button
            onClick={handleCopyQRCode}
            disabled={!qrCodeDataUrl || copied}
            className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">How to use this QR code:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Print and place this QR code on the table</li>
            <li>• Customers can scan it to access the menu</li>
            <li>• The QR code links to: <code className="bg-blue-100 px-1 rounded text-xs">{typeof window !== 'undefined' ? window.location.origin : ''}/table/{table.qr_code}</code></li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default QRCodeModal; 