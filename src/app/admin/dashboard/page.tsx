"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Order, Table } from '../../../components/types'
import AdminDashboard from '../../../components/AdminDashboard'

export default function AdminDashboardPage() {
  const [adminUser, setAdminUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const router = useRouter()

  useEffect(() => {
    // Check authentication using the new auth system
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          if (!['admin', 'owner'].includes(userData.user?.role)) {
            router.push('/auth/login')
            return
          }
          // Convert to old User format for compatibility
          setAdminUser({
            id: userData.user.id,
            name: userData.user.name,
            email: userData.user.email,
            phone: '',
            role: userData.user.role,
            language: userData.user.language,
            kitchen_station: userData.user.kitchen_station_name,
            table: undefined
          })
          
          // Load sample data for demonstration
          loadSampleData()
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

    checkAuth()
  }, [router])

  const loadSampleData = () => {
    // Sample orders data
    const sampleOrders: Order[] = [
      {
        id: '1',
        table: 1,
        customer_name: 'John Doe',
        customer_phone: '+1234567890',
        items: [
          {
            id: '1',
            order_id: '1',
            menu_item: {
              id: '1',
              name: 'Margherita Pizza',
              description: 'Classic tomato and mozzarella',
              price: 12.99,
              category: 'Pizza',
              prepTime: 15,
              rating: 4.5,
              image: '/pizza.jpg',
              available: true,
              kitchen_stations: ['Pizza Station'],
              is_veg: true,
              cuisine_type: 'Italian'
            },
            quantity: 2,
            status: 'preparing',
            kitchen_station: 'Pizza Station',
            price_at_time: 12.99,
            selected_add_ons: []
          }
        ],
        status: 'active',
        waiter_id: 'waiter1',
        waiter_name: 'Sarah Waiter',
        timestamp: new Date(),
        total: 25.98,
        estimated_time: 20,
        is_joined_order: false
      },
      {
        id: '2',
        table: 3,
        customer_name: 'Jane Smith',
        customer_phone: '+0987654321',
        items: [
          {
            id: '2',
            order_id: '2',
            menu_item: {
              id: '2',
              name: 'Chicken Burger',
              description: 'Grilled chicken with fresh vegetables',
              price: 9.99,
              category: 'Burgers',
              prepTime: 10,
              rating: 4.2,
              image: '/burger.jpg',
              available: true,
              kitchen_stations: ['Grill Station'],
              is_veg: false,
              cuisine_type: 'American'
            },
            quantity: 1,
            status: 'prepared',
            kitchen_station: 'Grill Station',
            price_at_time: 9.99,
            selected_add_ons: []
          }
        ],
        status: 'active',
        waiter_id: 'waiter2',
        waiter_name: 'Mike Server',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        total: 9.99,
        estimated_time: 15,
        is_joined_order: false
      }
    ]

    // Sample tables data
    const sampleTables: Table[] = [
      {
        id: '1',
        table_number: 1,
        status: 'occupied',
        waiter_id: 'waiter1',
        waiter_name: 'Sarah Waiter',
        guests: 4,
        revenue: 25.98,
        qr_code: 'table-1-qr-code',
        current_orders: [sampleOrders[0]],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '2',
        table_number: 2,
        status: 'available',
        guests: 0,
        revenue: 0,
        qr_code: 'table-2-qr-code',
        current_orders: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '3',
        table_number: 3,
        status: 'occupied',
        waiter_id: 'waiter2',
        waiter_name: 'Mike Server',
        guests: 2,
        revenue: 9.99,
        qr_code: 'table-3-qr-code',
        current_orders: [sampleOrders[1]],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '4',
        table_number: 4,
        status: 'available',
        guests: 0,
        revenue: 0,
        qr_code: 'table-4-qr-code',
        current_orders: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '5',
        table_number: 5,
        status: 'needs_reset',
        guests: 0,
        revenue: 0,
        qr_code: 'table-5-qr-code',
        current_orders: [],
        created_at: new Date(),
        updated_at: new Date()
      }
    ]

    setOrders(sampleOrders)
    setTables(sampleTables)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminUser')
    localStorage.removeItem('isAdminLoggedIn')
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-xl font-semibold text-gray-700">Loading Admin Dashboard...</p>
          <p className="mt-2 text-gray-500">Please wait while we prepare your workspace</p>
        </div>
      </div>
    )
  }

  if (!adminUser) {
    return null
  }

  return (
    <AdminDashboard
      currentUser={adminUser}
      setCurrentUser={handleLogout}
      orders={orders}
      tables={tables}
    />
  )
} 