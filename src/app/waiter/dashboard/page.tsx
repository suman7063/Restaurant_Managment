"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import WaiterDashboard from '../../../components/WaiterDashboard'
import { User, Order, Table } from '../../../components/types'

export default function WaiterDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<Table[]>([])

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          if (!['waiter', 'admin', 'owner'].includes(userData.user?.role)) {
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

    checkAuth()
  }, [router])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      // Load mock data for development
      const mockOrders: Order[] = [
        {
          id: 'order-1',
          table: 1,
          customer_name: 'John Doe',
          customer_phone: '+1234567890',
          items: [
            {
              id: 'item-1',
              order_id: 'order-1',
              menu_item: {
                id: 'menu-1',
                name: 'Margherita Pizza',
                price: 15.99,
                description: 'Classic tomato and mozzarella',
                category_id: 'cat-1',
                prepTime: 20,
                rating: 4.5,
                image: '/pizza.jpg',
                available: true,
                kitchen_stations: ['pizza-station'],
                is_veg: true,
                cuisine_type: 'Italian'
              },
              quantity: 2,
              special_notes: 'Extra cheese please',
              status: 'order_received',
              kitchen_station: 'pizza-station',
              price_at_time: 15.99,
              selected_add_ons: []
            }
          ],
          status: 'active',
          timestamp: new Date(),
          total: 31.98,
          estimated_time: 25,
          is_joined_order: false,
          is_session_order: true,
          session_id: 'session-1',
          customer_id: 'customer-1',
          waiter_name: user?.name
        }
      ]

      const mockTables: Table[] = [
        {
          id: 'table-1',
          table_number: 1,
          status: 'occupied',
          waiter_name: user?.name,
          guests: 4,
          revenue: 45.50,
          qr_code: 'table-1-qr',
          current_orders: [],
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'table-2',
          table_number: 2,
          status: 'available',
          waiter_name: user?.name,
          guests: 0,
          revenue: 0,
          qr_code: 'table-2-qr',
          current_orders: [],
          created_at: new Date(),
          updated_at: new Date()
        }
      ]

      setOrders(mockOrders)
      setTables(mockTables)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        // Update local state
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus as any } : order
        ))
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <WaiterDashboard
      currentUser={user}
      setCurrentUser={setUser}
      orders={orders}
      tables={tables}
      onUpdateOrderStatus={handleUpdateOrderStatus}
    />
  )
}