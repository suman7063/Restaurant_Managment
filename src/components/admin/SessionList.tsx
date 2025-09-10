import React, { useState } from 'react';
import { 
  Eye, 
  RefreshCw, 
  XCircle, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  MoreVertical,
  Copy,
  Phone,
  Calendar,
  Table
} from 'lucide-react';
import { Session } from '../types';

interface SessionListProps {
  sessions: Session[];
  onRegenerateOTP: (sessionId: string) => void;
  onCloseSession: (sessionId: string) => void;
  onViewDetails: (session: Session) => void;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  onRegenerateOTP,
  onCloseSession,
  onViewDetails
}) => {
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'billed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cleared':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'billed':
        return <DollarSign className="w-4 h-4" />;
      case 'cleared':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDuration = (createdAt: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    } else {
      return `${diffMins}m`;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSelectSession = (sessionId: string) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedSessions.size === sessions.length) {
      setSelectedSessions(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedSessions(new Set(sessions.map(s => s.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkRegenerateOTP = () => {
    if (confirm(`Regenerate OTP for ${selectedSessions.size} sessions?`)) {
      selectedSessions.forEach(sessionId => {
        onRegenerateOTP(sessionId);
      });
      setSelectedSessions(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkCloseSessions = () => {
    if (confirm(`Close ${selectedSessions.size} sessions?`)) {
      selectedSessions.forEach(sessionId => {
        onCloseSession(sessionId);
      });
      setSelectedSessions(new Set());
      setShowBulkActions(false);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sessions Found</h3>
        <p className="text-gray-600 mb-4">There are no sessions matching your current filters.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedSessions.size} session{selectedSessions.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleBulkRegenerateOTP}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate OTP
              </button>
              <button
                onClick={handleBulkCloseSessions}
                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-all duration-300 text-sm flex items-center gap-1"
              >
                <XCircle className="w-3 h-3" />
                Close Sessions
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedSessions(new Set());
                setShowBulkActions(false);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl ${
              selectedSessions.has(session.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedSessions.has(session.id)}
                  onChange={() => handleSelectSession(session.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                    {getStatusIcon(session.status)}
                    <span className="ml-1">{session.status}</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(session.session_otp)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy OTP"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onViewDetails(session)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Session Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Table className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Table</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {session.restaurant_tables?.table_number ? `Table ${session.restaurant_tables.table_number}` : `Table ${session.table_id.slice(0, 8)}...`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">OTP</span>
                </div>
                <span className="text-lg font-mono font-bold text-blue-600">
                  {session.session_otp}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Total</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  ₹{(session.total_amount / 100).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Duration</span>
                </div>
                <span className="text-sm text-gray-900">
                  {formatDuration(session.created_at)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Created</span>
                </div>
                <span className="text-sm text-gray-900">
                  {formatTime(session.created_at)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {session.status === 'active' && (
                    <>
                      <button
                        onClick={() => onRegenerateOTP(session.id)}
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-all duration-300 text-sm flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        New OTP
                      </button>
                      <button
                        onClick={() => onCloseSession(session.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-all duration-300 text-sm flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        Close
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => onViewDetails(session)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Details →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Select All */}
      {sessions.length > 0 && (
        <div className="flex items-center justify-center pt-4">
          <button
            onClick={handleSelectAll}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {selectedSessions.size === sessions.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionList; 