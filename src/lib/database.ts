import { supabase, isSupabaseConfigured } from './supabase'
import { User, MenuItem, Order, Table, CartItem, Notification } from '../components/types'
import { dummyUsers, dummyMenu, initialOrders, initialTables } from '../components/data'

// Database types that match Supabase schema
export interface DatabaseUser {
  id: string
  qr_code: string | null
  name: string
  table_number: number | null
  role: string
  created_at: string
  updated_at: string
}

export interface DatabaseMenuItem {
  id: string
  name: string
  price: number
  category: string
  prep_time: number
  rating: number
  image: string
  popular: boolean
  available: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseOrder {
  id: string
  table_number: number
  customer_name: string
  status: string
  waiter_id: string | null
  total: number
  estimated_time: number | null
  created_at: string
  updated_at: string
}

export interface DatabaseOrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price_at_time: number
  created_at: string
}

export interface DatabaseTable {
  id: string
  table_number: number
  status: string
  waiter_id: string | null
  guests: number
  revenue: number
  created_at: string
  updated_at: string
}

export interface DatabaseNotification {
  id: string
  message: string
  type: string
  user_id: string | null
  read: boolean
  created_at: string
}

// User operations
export const userService = {
  async getUserByQRCode(qrCode: string): Promise<User | null> {
    if (!isSupabaseConfigured) {
      // Fallback to dummy data
      return dummyUsers[qrCode] || null
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('qr_code', qrCode)
      .single()

    if (error || !data) return null

    return {
      id: parseInt(data.id),
      name: data.name,
      table: data.table_number,
      role: data.role
    }
  },

  async getAllUsers(): Promise<User[]> {
    if (!isSupabaseConfigured) {
      // Fallback to dummy data
      return Object.values(dummyUsers)
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) return []

    return data.map(user => ({
      id: parseInt(user.id),
      name: user.name,
      table: user.table_number,
      role: user.role
    }))
  },

  async createUser(userData: Omit<User, 'id'>): Promise<User | null> {
    if (!isSupabaseConfigured) {
      console.warn('Cannot create user in development mode without Supabase')
      return null
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        qr_code: userData.qr_code,
        name: userData.name,
        table_number: userData.table,
        role: userData.role
      })
      .select()
      .single()

    if (error || !data) return null

    return {
      id: parseInt(data.id),
      name: data.name,
      table: data.table_number,
      role: data.role
    }
  }
}

// Menu operations
export const menuService = {
  async getAllMenuItems(): Promise<MenuItem[]> {
    if (!isSupabaseConfigured) {
      // Fallback to dummy data
      return dummyMenu
    }

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('category', { ascending: true })

    if (error || !data) return []

    return data.map(item => ({
      id: parseInt(item.id),
      name: item.name,
      price: item.price,
      category: item.category,
      prepTime: item.prep_time,
      rating: item.rating,
      image: item.image,
      popular: item.popular
    }))
  },

  async getPopularItems(): Promise<MenuItem[]> {
    if (!isSupabaseConfigured) {
      // Fallback to dummy data
      return dummyMenu.filter(item => item.popular)
    }

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('popular', true)
      .eq('available', true)
      .order('rating', { ascending: false })

    if (error || !data) return []

    return data.map(item => ({
      id: parseInt(item.id),
      name: item.name,
      price: item.price,
      category: item.category,
      prepTime: item.prep_time,
      rating: item.rating,
      image: item.image,
      popular: item.popular
    }))
  },

  async createMenuItem(itemData: Omit<MenuItem, 'id'>): Promise<MenuItem | null> {
    if (!isSupabaseConfigured) {
      console.warn('Cannot create menu item in development mode without Supabase')
      return null
    }

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        name: itemData.name,
        price: itemData.price,
        category: itemData.category,
        prep_time: itemData.prepTime,
        rating: itemData.rating,
        image: itemData.image,
        popular: itemData.popular || false
      })
      .select()
      .single()

    if (error || !data) return null

    return {
      id: parseInt(data.id),
      name: data.name,
      price: data.price,
      category: data.category,
      prepTime: data.prep_time,
      rating: data.rating,
      image: data.image,
      popular: data.popular
    }
  }
}

// Order operations
export const orderService = {
  async getOrdersByTable(tableNumber: number): Promise<Order[]> {
    if (!isSupabaseConfigured) {
      // Fallback to dummy data
      return initialOrders.filter(order => order.table === tableNumber)
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (*)
        )
      `)
      .eq('table_number', tableNumber)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    return data.map(order => ({
      id: parseInt(order.id),
      table: order.table_number,
      customerName: order.customer_name,
      items: order.order_items.map((item: any) => ({
        id: parseInt(item.menu_items.id),
        name: item.menu_items.name,
        price: item.price_at_time,
        category: item.menu_items.category,
        prepTime: item.menu_items.prep_time,
        rating: item.menu_items.rating,
        image: item.menu_items.image,
        quantity: item.quantity
      })),
      status: order.status,
      waiter: order.waiter_id || 'Unassigned',
      timestamp: new Date(order.created_at),
      total: order.total,
      estimatedTime: order.estimated_time || 0
    }))
  },

  async getAllOrders(): Promise<Order[]> {
    if (!isSupabaseConfigured) {
      // Fallback to dummy data
      return initialOrders
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    return data.map(order => ({
      id: parseInt(order.id),
      table: order.table_number,
      customerName: order.customer_name,
      items: order.order_items.map((item: any) => ({
        id: parseInt(item.menu_items.id),
        name: item.menu_items.name,
        price: item.price_at_time,
        category: item.menu_items.category,
        prepTime: item.menu_items.prep_time,
        rating: item.menu_items.rating,
        image: item.menu_items.image,
        quantity: item.quantity
      })),
      status: order.status,
      waiter: order.waiter_id || 'Unassigned',
      timestamp: new Date(order.created_at),
      total: order.total,
      estimatedTime: order.estimated_time || 0
    }))
  },

  async createOrder(orderData: {
    tableNumber: number
    customerName: string
    items: CartItem[]
    waiterId?: string
  }): Promise<Order | null> {
    if (!isSupabaseConfigured) {
      console.warn('Cannot create order in development mode without Supabase')
      return null
    }

    const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const estimatedTime = Math.max(...orderData.items.map(item => item.prepTime))

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_number: orderData.tableNumber,
        customer_name: orderData.customerName,
        waiter_id: orderData.waiterId,
        total,
        estimated_time: estimatedTime
      })
      .select()
      .single()

    if (orderError || !order) return null

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      menu_item_id: item.id.toString(),
      quantity: item.quantity,
      price_at_time: item.price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) return null

    return {
      id: parseInt(order.id),
      table: order.table_number,
      customerName: order.customer_name,
      items: orderData.items,
      status: order.status,
      waiter: order.waiter_id || 'Unassigned',
      timestamp: new Date(order.created_at),
      total,
      estimatedTime
    }
  },

  async updateOrderStatus(orderId: number, status: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn('Cannot update order status in development mode without Supabase')
      return false
    }

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId.toString())

    return !error
  }
}

// Table operations
export const tableService = {
  async getAllTables(): Promise<Table[]> {
    if (!isSupabaseConfigured) {
      // Fallback to dummy data
      return initialTables
    }

    const { data, error } = await supabase
      .from('restaurant_tables')
      .select('*')
      .order('table_number', { ascending: true })

    if (error || !data) return []

    return data.map(table => ({
      id: table.table_number,
      status: table.status,
      waiter: table.waiter_id || null,
      guests: table.guests,
      revenue: table.revenue
    }))
  },

  async updateTableStatus(tableNumber: number, status: string, waiterId?: string, guests?: number): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn('Cannot update table status in development mode without Supabase')
      return false
    }

    const updateData: any = { status }
    if (waiterId !== undefined) updateData.waiter_id = waiterId
    if (guests !== undefined) updateData.guests = guests

    const { error } = await supabase
      .from('restaurant_tables')
      .update(updateData)
      .eq('table_number', tableNumber)

    return !error
  }
}

// Notification operations
export const notificationService = {
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    if (!isSupabaseConfigured) {
      // Return empty array for development mode
      return []
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    return data.map(notification => ({
      id: parseInt(notification.id),
      message: notification.message,
      type: notification.type
    }))
  },

  async createNotification(notificationData: {
    message: string
    type: string
    userId?: string
  }): Promise<Notification | null> {
    if (!isSupabaseConfigured) {
      console.warn('Cannot create notification in development mode without Supabase')
      return null
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        message: notificationData.message,
        type: notificationData.type,
        user_id: notificationData.userId
      })
      .select()
      .single()

    if (error || !data) return null

    return {
      id: parseInt(data.id),
      message: data.message,
      type: data.type
    }
  },

  async markAsRead(notificationId: number): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn('Cannot mark notification as read in development mode without Supabase')
      return false
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId.toString())

    return !error
  }
} 