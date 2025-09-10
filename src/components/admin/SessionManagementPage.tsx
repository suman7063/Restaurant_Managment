import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Filter,
  Download,
  Plus,
  Eye,
  Settings,
  BarChart3,
  Activity,
  DollarSign,
  Calendar
} from 'lucide-react';
import { Session, SessionCustomer, Order } from '../types';
import SessionList from './SessionList';
import SessionDetailsModal from './SessionDetailsModal';

interface SessionManagementPageProps {
  restaurantId: string;
}

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  totalRevenue: number;
  averageDuration: number;
  totalParticipants: number;
  averageOrdersPerSession: number;
}

const SessionManagementPage: React.FC<SessionManagementPageProps> = ({ restaurantId }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'billed' | 'cleared'>('all');
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    activeSessions: 0,
    totalRevenue: 0,
    averageDuration: 0,
    totalParticipants: 0,
    averageOrdersPerSession: 0
  });

  // Get today's date for display
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [restaurantId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading sessions from API...');
      
      const response = await fetch('/api/admin/sessions', {
        credentials: 'include' // Include cookies for authentication
      });
      
      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response data:', data);
        console.log('🔍 Data structure check:');
        console.log('  - data.success:', data.success);
        console.log('  - data.message:', data.message);
        console.log('  - data.data:', data.data);
        console.log('  - data.data.sessions:', data.data?.sessions);
        console.log('  - data.sessions:', data.sessions);
        
        const sessions = data.data?.sessions || data.sessions || [];
        console.log('📊 Final sessions array length:', sessions.length);
        
        // Convert string dates to Date objects
        const processedSessions = sessions.map((session: any) => ({
          ...session,
          created_at: new Date(session.created_at),
          updated_at: new Date(session.updated_at),
          otp_expires_at: session.otp_expires_at ? new Date(session.otp_expires_at) : null
        }));
        
        setSessions(processedSessions);
        calculateStats(processedSessions);
      } else {
        console.error('❌ Failed to load sessions, status:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        
        console.error('Cannot load sessions. Please check authentication.');
        setSessions([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
      
      setSessions([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMockSessions = () => {
    const mockSessions: Session[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        table_id: '550e8400-e29b-41d4-a716-446655440002',
        restaurant_id: restaurantId,
        session_otp: '123456',
        status: 'active',
        total_amount: 4500,
        created_at: new Date(Date.now() - 3600000), // 1 hour ago
        updated_at: new Date(),
        otp_expires_at: new Date(Date.now() + 82800000), // 23 hours from now
        restaurant_tables: {
          table_number: 5,
          qr_code: 'table-5-qr-code'
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        table_id: '550e8400-e29b-41d4-a716-446655440004',
        restaurant_id: restaurantId,
        session_otp: '789012',
        status: 'active',
        total_amount: 3200,
        created_at: new Date(Date.now() - 1800000), // 30 minutes ago
        updated_at: new Date(),
        otp_expires_at: new Date(Date.now() + 84600000), // 23.5 hours from now
        restaurant_tables: {
          table_number: 8,
          qr_code: 'table-8-qr-code'
        }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        table_id: '550e8400-e29b-41d4-a716-446655440006',
        restaurant_id: restaurantId,
        session_otp: '345678',
        status: 'billed',
        total_amount: 7800,
        created_at: new Date(Date.now() - 7200000), // 2 hours ago
        updated_at: new Date(Date.now() - 300000), // 5 minutes ago
        otp_expires_at: new Date(Date.now() + 79200000), // 22 hours from now
        restaurant_tables: {
          table_number: 12,
          qr_code: 'table-12-qr-code'
        }
      }
    ];
    setSessions(mockSessions);
    calculateStats(mockSessions);
  };

  const calculateStats = (sessionList: Session[]) => {
    const now = new Date();
    const activeSessions = sessionList.filter(s => s.status === 'active');
    const totalRevenue = sessionList.reduce((sum, s) => sum + s.total_amount, 0);
    const totalDuration = sessionList.reduce((sum, s) => {
      const duration = now.getTime() - s.created_at.getTime();
      return sum + duration;
    }, 0);
    const averageDuration = sessionList.length > 0 ? totalDuration / sessionList.length / 60000 : 0; // in minutes

    setStats({
      totalSessions: sessionList.length,
      activeSessions: activeSessions.length,
      totalRevenue,
      averageDuration: Math.round(averageDuration),
      totalParticipants: 0, // Will be calculated from session customers
      averageOrdersPerSession: 0 // Will be calculated from session orders
    });
  };

  const handleRegenerateOTP = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/regenerate-otp`, {
        method: 'POST',
        credentials: 'include' // Include cookies for authentication
      });

      if (response.ok) {
        const data = await response.json();
        // Update the session in the list
        setSessions(prev => prev.map(s => 
          s.id === sessionId 
            ? { ...s, session_otp: data.data.newOtp, updated_at: new Date() }
            : s
        ));
        alert(`New OTP generated: ${data.data.newOtp}`);
      } else {
        alert('Failed to regenerate OTP');
      }
    } catch (error) {
      console.error('Error regenerating OTP:', error);
      alert('Error regenerating OTP');
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to close this session?')) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/close`, {
        method: 'PUT',
        credentials: 'include' // Include cookies for authentication
      });

      if (response.ok) {
        setSessions(prev => prev.map(s => 
          s.id === sessionId 
            ? { ...s, status: 'billed', updated_at: new Date() }
            : s
        ));
        alert('Session closed successfully');
      } else {
        const errorData = await response.json();
        alert(`Failed to close session: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error closing session:', error);
      alert('Error closing session');
    }
  };

  const handleCreateTestSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          tableId: 'table-test',
          restaurantId: restaurantId
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Test session created with OTP: ${data.data.otp}`);
        loadSessions(); // Refresh the list
      } else {
        alert('Failed to create test session');
      }
    } catch (error) {
      console.error('Error creating test session:', error);
      alert('Error creating test session');
    }
  };

  const handleExportData = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = () => {
    const headers = ['Session ID', 'Table Number', 'OTP', 'Status', 'Total Amount', 'Created At', 'Updated At'];
    const rows = sessions.map(s => [
      s.id,
      s.restaurant_tables?.table_number || s.table_id.slice(0, 8),
      s.session_otp,
      s.status,
      (s.total_amount / 100).toFixed(2),
      s.created_at.toISOString(),
      s.updated_at.toISOString()
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const filteredSessions = sessions.filter(session => {
    const tableNumber = session.restaurant_tables?.table_number?.toString() || '';
    const matchesSearch = session.session_otp.includes(searchTerm) || 
                         session.table_id.includes(searchTerm) ||
                         tableNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Session Management</h2>
          <p className="text-gray-600 mt-1">Today's Sessions - {today}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadSessions}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleCreateTestSession}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Test Session
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Active Sessions</p>
              <p className="text-3xl font-bold text-blue-800">{stats.activeSessions}</p>
              <p className="text-xs text-blue-600">of {stats.totalSessions} total</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <Users className="w-8 h-8 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-800">
                ₹{(stats.totalRevenue / 100).toFixed(2)}
              </p>
              <p className="text-xs text-green-600">from all sessions</p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <DollarSign className="w-8 h-8 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border border-purple-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 mb-1">Avg Duration</p>
              <p className="text-3xl font-bold text-purple-800">{stats.averageDuration}m</p>
              <p className="text-xs text-purple-600">per session</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <Clock className="w-8 h-8 text-purple-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg border border-orange-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700 mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-orange-800">{stats.totalSessions}</p>
              <p className="text-xs text-orange-600">all time</p>
            </div>
            <div className="bg-orange-200 p-3 rounded-xl">
              <Activity className="w-8 h-8 text-orange-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by OTP or Table ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="billed">Billed</option>
                <option value="cleared">Cleared</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportData}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <SessionList
        sessions={filteredSessions}
        onRegenerateOTP={handleRegenerateOTP}
        onCloseSession={handleCloseSession}
        onViewDetails={(session) => {
          setSelectedSession(session);
          setShowDetailsModal(true);
        }}
      />

      {/* Session Details Modal */}
      {selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSession(null);
          }}
          onRegenerateOTP={handleRegenerateOTP}
          onCloseSession={handleCloseSession}
        />
      )}
    </div>
  );
};

export default SessionManagementPage; 