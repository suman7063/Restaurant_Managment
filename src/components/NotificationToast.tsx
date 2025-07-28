import React from 'react';
import { CheckCircle, AlertCircle, Bell } from 'lucide-react';
import { Notification } from './types';

interface NotificationToastProps {
  notification: Notification;
  onClose?: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification }) => (
  <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-500 animate-slide-in ${
    notification.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
    notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
    'bg-blue-50 border-blue-500 text-blue-800'
  }`}>
    <div className="flex items-center space-x-2">
      {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
      {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
      {notification.type === 'info' && <Bell className="w-5 h-5" />}
      <span className="font-medium">{notification.message}</span>
    </div>
  </div>
);

export default NotificationToast; 