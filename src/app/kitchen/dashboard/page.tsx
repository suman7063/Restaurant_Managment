"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Clock, DollarSign, ShoppingCart, ChefHat, Search, Filter, AlertCircle, CheckCircle } from 'lucide-react'
import { Session, Order, SessionCustomer, User } from '../../../components/types'
import SessionOrderGroup from '../../../components/SessionOrderGroup'
import { formatCurrency } from '../../../components/utils'

export default function KitchenDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<SessionCustomer[]>([])
  const [kitchenStations, setKitchenStations] = useState<string[]>([])
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stationFilter, setStationFilter] = useState<string>('all')

  useEffect(() => {
    checkAuth()
  }, [router])

  useEffect(() => {
    if (user) {
      fetchKitchenData()
      const interval = setInterval(fetchKitchenData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [user])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        if (!['chef', 'admin', 'owner'].includes(userData.user?.role)) {
          router.push('/auth/login')
          return
        }
        setUser(userData.user)
      } else {
        router.push('/auth/login')
        return
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/auth/login')
      return
    }
    setLoading(false)
  }

  const fetchKitchenData = async () => {
    try {
      // Fetch active sessions
      const sessionsResponse = await fetch('/api/sessions/active-all')
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        if (sessionsData.success) {
          setSessions(sessionsData.data || [])
        }
      }

      // Fetch orders for all sessions
      const ordersResponse = await fetch('/api/orders')
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        if (ordersData.success) {
          setOrders(ordersData.data.orders || [])
        }
      }

      // Fetch customers for all sessions
      const customersResponse = await fetch('/api/sessions/customers')
      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        if (customersData.success) {
          setCustomers(customersData.data || [])
        }
      }

      // Fetch kitchen stations
      const stationsResponse = await fetch('/api/admin/kitchen-stations')
      if (stationsResponse.ok) {
        const stationsData = await stationsResponse.json()
        if (stationsData.success) {
          setKitchenStations(stationsData.data.map((station: any) => station.name))
        }
      }
    } catch (error) {
      console.error('Failed to fetch kitchen data:', error)
    }
  }

  const handleOrderStatusUpdate = async (orderId: string, itemId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          status: newStatus,
        }),
      })

      if (response.ok) {
        // Refresh data
        fetchKitchenData()
      } else {
        console.error('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const handleSessionAction = async (sessionId: string, action: 'view' | 'bill' | 'close') => {
    try {
      let response
      switch (action) {
        case 'bill':
          response = await fetch(`/api/sessions/${sessionId}/bill`, { method: 'POST' })
          break
        case 'close':
          response = await fetch(`/api/sessions/${sessionId}/close`, { method: 'POST' })
          break
        default:
          return
      }

      if (response.ok) {
        fetchKitchenData()
      } else {
        console.error(`Failed to ${action} session`)
      }
    } catch (error) {
      console.error(`Error ${action}ing session:`, error)
    }
  }

  const toggleSessionExpanded = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  const getSessionOrders = (sessionId: string) => {
    return orders.filter(order => order.session_id === sessionId)
  }

  const getSessionCustomers = (sessionId: string) => {
    return customers.filter(customer => customer.session_id === sessionId)
  }

  const getDashboardStats = () => {
    const activeSessions = sessions.filter(s => s.status === 'active')
    const totalOrders = orders.length
    const pendingItems = orders.reduce((total, order) => 
      total + order.items.filter(item => item.status === 'order_received').length, 0
    )
    const preparingItems = orders.reduce((total, order) => 
      total + order.items.filter(item => item.status === 'preparing').length, 0
    )
    const urgentItems = orders.reduce((total, order) => {
      const now = new Date()
      const orderTime = new Date(order.timestamp)
      const timeSinceOrder = now.getTime() - orderTime.getTime()
      const isUrgent = timeSinceOrder > 15 * 60 * 1000 // 15 minutes
      return total + order.items.filter(item => 
        item.status === 'order_received' && isUrgent
      ).length
    }, 0)

    return {
      activeSessions: activeSessions.length,
      totalOrders,
      pendingItems,
      preparingItems,
      urgentItems
    }
  }

  const filteredSessions = sessions.filter(session => {
    const sessionOrders = getSessionOrders(session.id)
    const sessionCustomers = getSessionCustomers(session.id)
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesOTP = session.session_otp.toLowerCase().includes(searchLower)
      const matchesCustomer = sessionCustomers.some(c => 
        c.name.toLowerCase().includes(searchLower)
      )
      if (!matchesOTP && !matchesCustomer) return false
    }

    // Status filter
    if (statusFilter !== 'all' && session.status !== statusFilter) return false

    // Station filter
    if (stationFilter !== 'all') {
      const hasStationItems = sessionOrders.some(order =>
        order.items.some(item => item.kitchen_station === stationFilter)
      )
      if (!hasStationItems) return false
    }

    return true
  })

  const stats = getDashboardStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <ChefHat className="w-8 h-8 text-orange-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Kitchen Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {user?.name || 'Chef'}
              </span>
              {user?.kitchen_station && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  Station: {user.kitchen_station}
                </span>
              )}
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' })
                  router.push('/auth/login')
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Sessions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.activeSessions}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Orders
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalOrders}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Items
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.pendingItems}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Preparing
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.preparingItems}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Urgent Items
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.urgentItems}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search sessions by OTP or customer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="billed">Billed</option>
                  <option value="cleared">Cleared</option>
                </select>
                <select
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Stations</option>
                  {kitchenStations.map(station => (
                    <option key={station} value={station}>{station}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={fetchKitchenData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Sessions List */}
          <div className="space-y-6">
            {filteredSessions.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No sessions found
                </h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' || stationFilter !== 'all'
                    ? 'Try adjusting your filters or search terms.'
                    : 'No active sessions at the moment.'}
                </p>
              </div>
            ) : (
              filteredSessions.map(session => {
                const sessionOrders = getSessionOrders(session.id)
                const sessionCustomers = getSessionCustomers(session.id)
                
                return (
                  <SessionOrderGroup
                    key={session.id}
                    session={session}
                    orders={sessionOrders}
                    customers={sessionCustomers}
                    onOrderStatusUpdate={handleOrderStatusUpdate}
                    onSessionAction={handleSessionAction}
                    isExpanded={expandedSessions.has(session.id)}
                    onToggleExpanded={toggleSessionExpanded}
                    kitchenStations={kitchenStations}
                    currentStation={user?.kitchen_station}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}