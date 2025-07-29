import { supabase, isSupabaseConfigured } from './supabase'
import { User, MenuItem, Order, Table, CartItem, Notification, Restaurant, UserRole, Language } from '../components/types'

// Database types that match Supabase schema
export interface DatabaseUser {
  id: string
  name: string
  email: string
  phone: string
  qr_code: string | null
  table_number: number | null
  role: string
  language: string
  kitchen_station: string | null
  created_at: string
  updated_at: string
}

export interface DatabaseMenuItem {
  id: string
  name: string
  name_hi?: string
  name_kn?: string
  description: string
  description_hi?: string
  description_kn?: string
  price: number
  category: string
  prep_time: number
  rating: number
  image: string
  popular: boolean
  available: boolean
  kitchen_stations?: string[]
  is_veg: boolean
  cuisine_type: string
  customizations?: any[]
  add_ons?: any[]
  created_at: string
  updated_at: string
}

export interface DatabaseOrder {
  id: string
  table_number: number
  customer_name: string
  customer_phone?: string
  status: string
  waiter_id: string | null
  waiter_name?: string
  total: number
  estimated_time: number | null
  is_joined_order: boolean
  parent_order_id?: number
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
  waiter_name?: string
  guests: number
  revenue: number
  qr_code: string
  created_at: string
  updated_at: string
}

export interface DatabaseNotification {
  id: string
  message: string
  message_hi?: string
  message_kn?: string
  type: string
  user_id: string | null
  order_id?: number
  item_id?: number
  read: boolean
  created_at: string
}

// User operations
export const userService = {
  async getUserByQRCode(qrCode: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('qr_code', qrCode)
      .single()

    if (error || !data) return null

    return {
      id: parseInt(data.id),
      name: data.name,
      email: data.email,
      phone: data.phone,
      table: data.table_number,
      role: data.role,
      qr_code: data.qr_code,
      language: data.language || 'en',
      kitchen_station: data.kitchen_station
    }
  },

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      // Fallback demo users for development
      return [
        {
          id: 1,
          name: 'Admin User',
          email: 'admin@restaurant.com',
          phone: '+1234567890',
          table: undefined,
          role: 'admin',
          qr_code: 'ADMIN001',
          language: 'en',
          kitchen_station: undefined
        },
        {
          id: 2,
          name: 'Chef John',
          email: 'chef@restaurant.com',
          phone: '+1234567891',
          table: undefined,
          role: 'chef',
          qr_code: 'CHEF001',
          language: 'en',
          kitchen_station: 'Main Kitchen'
        },
        {
          id: 3,
          name: 'Sarah Waiter',
          email: 'waiter@restaurant.com',
          phone: '+1234567892',
          table: undefined,
          role: 'waiter',
          qr_code: 'WAITER001',
          language: 'en',
          kitchen_station: undefined
        },
        {
          id: 4,
          name: 'Table 1 Customer',
          email: 'customer1@example.com',
          phone: '+1234567893',
          table: 1,
          role: 'customer',
          qr_code: 'TABLE001',
          language: 'en',
          kitchen_station: undefined
        },
        {
          id: 5,
          name: 'Table 2 Customer',
          email: 'customer2@example.com',
          phone: '+1234567894',
          table: 2,
          role: 'customer',
          qr_code: 'TABLE002',
          language: 'en',
          kitchen_station: undefined
        }
      ];
    }

    return data.map(user => ({
      id: parseInt(user.id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      table: user.table_number,
      role: user.role,
      qr_code: user.qr_code,
      language: user.language || 'en',
      kitchen_station: user.kitchen_station
    }))
  },

  async createUser(userData: Omit<User, 'id'>): Promise<User | null> {
    console.log('Creating user with data:', userData);
    
    const insertData = {
      qr_code: userData.qr_code,
      name: userData.name,
      email: userData.email || null,
      phone: userData.phone || null,
      role: userData.role,
      language: userData.language || 'en',
      kitchen_station: userData.kitchen_station || null,
      table_number: userData.table || null
    };
    
    console.log('Insert data prepared:', insertData);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error creating user:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null
      }
      
      if (!data) {
        console.error('No data returned from user creation');
        return null
      }

      console.log('User created successfully:', data);

      return {
        id: data.id,
        qr_code: data.qr_code,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role as UserRole,
        language: data.language as Language,
        kitchen_station: data.kitchen_station,
        table: data.table_number
      }
    } catch (error) {
      console.error('Exception during user creation:', error);
      return null;
    }
  }
}

// Menu operations
export const menuService = {
  async getAllMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('category', { ascending: true })

    if (error || !data) return []

    return data.map(item => ({
      id: parseInt(item.id),
      name: item.name,
      name_hi: item.name_hi,
      name_kn: item.name_kn,
      description: item.description || '',
      description_hi: item.description_hi,
      description_kn: item.description_kn,
      price: item.price,
      category: item.category,
      prepTime: item.prep_time,
      rating: item.rating,
      image: item.image,
      popular: item.popular,
      available: item.available,
      kitchen_stations: item.kitchen_stations || [],
      is_veg: item.is_veg || false,
      cuisine_type: item.cuisine_type || 'Indian',
      customizations: item.customizations || [],
      add_ons: item.add_ons || []
    }))
  },

  async getPopularItems(): Promise<MenuItem[]> {
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
      name_hi: item.name_hi,
      name_kn: item.name_kn,
      description: item.description || '',
      description_hi: item.description_hi,
      description_kn: item.description_kn,
      price: item.price,
      category: item.category,
      prepTime: item.prep_time,
      rating: item.rating,
      image: item.image,
      popular: item.popular,
      available: item.available,
      kitchen_stations: item.kitchen_stations || [],
      is_veg: item.is_veg || false,
      cuisine_type: item.cuisine_type || 'Indian',
      customizations: item.customizations || [],
      add_ons: item.add_ons || []
    }))
  },

  async createMenuItem(itemData: Omit<MenuItem, 'id'>): Promise<MenuItem | null> {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        name: itemData.name,
        name_hi: itemData.name_hi,
        name_kn: itemData.name_kn,
        description: itemData.description,
        description_hi: itemData.description_hi,
        description_kn: itemData.description_kn,
        price: itemData.price,
        category: itemData.category,
        prep_time: itemData.prepTime,
        rating: itemData.rating,
        image: itemData.image,
        popular: itemData.popular || false,
        available: itemData.available,
        kitchen_stations: itemData.kitchen_stations,
        is_veg: itemData.is_veg,
        cuisine_type: itemData.cuisine_type,
        customizations: itemData.customizations,
        add_ons: itemData.add_ons
      })
      .select()
      .single()

    if (error || !data) return null

    return {
      id: parseInt(data.id),
      name: data.name,
      name_hi: data.name_hi,
      name_kn: data.name_kn,
      description: data.description,
      description_hi: data.description_hi,
      description_kn: data.description_kn,
      price: data.price,
      category: data.category,
      prepTime: data.prep_time,
      rating: data.rating,
      image: data.image,
      popular: data.popular,
      available: data.available,
      kitchen_stations: data.kitchen_stations || [],
      is_veg: data.is_veg,
      cuisine_type: data.cuisine_type,
      customizations: data.customizations || [],
      add_ons: data.add_ons || []
    }
  }
}

// Order operations
export const orderService = {
  async getOrdersByTable(tableNumber: number): Promise<Order[]> {
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
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
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
      status: order.status as 'active' | 'completed' | 'cancelled',
      waiter_id: order.waiter_id,
      waiter_name: order.waiter_name,
      timestamp: new Date(order.created_at),
      total: order.total,
      estimated_time: order.estimated_time || 0,
      is_joined_order: order.is_joined_order || false,
      parent_order_id: order.parent_order_id
    }))
  },

  async getAllOrders(): Promise<Order[]> {
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
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
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
      status: order.status as 'active' | 'completed' | 'cancelled',
      waiter_id: order.waiter_id,
      waiter_name: order.waiter_name,
      timestamp: new Date(order.created_at),
      total: order.total,
      estimated_time: order.estimated_time || 0,
      is_joined_order: order.is_joined_order || false,
      parent_order_id: order.parent_order_id
    }))
  },

  async createOrder(orderData: {
    tableNumber: number
    customerName: string
    items: CartItem[]
    waiterId?: string
  }): Promise<Order | null> {
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
      customer_name: order.customer_name,
      customer_phone: orderData.customerName, // Use the input data
      items: orderData.items.map((item, index) => ({
        id: index + 1, // Generate a temporary ID
        order_id: parseInt(order.id),
        menu_item: item,
        quantity: item.quantity,
        special_notes: item.special_notes,
        selected_customization: item.selected_customization,
        selected_add_ons: item.selected_add_ons || [],
        status: 'order_received' as const,
        kitchen_station: item.kitchen_stations?.[0] || 'Main Kitchen',
        price_at_time: item.price
      })),
      status: order.status as 'active' | 'completed' | 'cancelled',
      waiter_id: order.waiter_id,
      waiter_name: order.waiter_name,
      timestamp: new Date(order.created_at),
      total,
      estimated_time: estimatedTime,
      is_joined_order: false,
      parent_order_id: undefined
    }
  },

  async updateOrderStatus(orderId: number, status: string): Promise<boolean> {
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
    const { data, error } = await supabase
      .from('restaurant_tables')
      .select('*')
      .order('table_number', { ascending: true })

    if (error || !data) return []

    return data.map(table => ({
      id: table.table_number,
      table_number: table.table_number,
      status: table.status as 'available' | 'occupied' | 'needs_reset',
      waiter_id: table.waiter_id,
      waiter_name: table.waiter_name,
      guests: table.guests,
      revenue: table.revenue,
      qr_code: table.qr_code || `TABLE${table.table_number}`,
      current_orders: [],
      created_at: new Date(table.created_at),
      updated_at: new Date(table.updated_at)
    }))
  },

  async updateTableStatus(tableNumber: number, status: string, waiterId?: string, guests?: number): Promise<boolean> {
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
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    return data.map(notification => ({
      id: parseInt(notification.id),
      message: notification.message,
      message_hi: notification.message_hi,
      message_kn: notification.message_kn,
      type: notification.type as 'success' | 'error' | 'warning' | 'info',
      user_id: notification.user_id,
      order_id: notification.order_id,
      item_id: notification.item_id,
      read: notification.read,
      created_at: new Date(notification.created_at)
    }))
  },

  async createNotification(notificationData: {
    message: string
    type: string
    userId?: string
  }): Promise<Notification | null> {
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
      message_hi: data.message_hi,
      message_kn: data.message_kn,
      type: data.type as 'success' | 'error' | 'warning' | 'info',
      user_id: data.user_id,
      order_id: data.order_id,
      item_id: data.item_id,
      read: data.read,
      created_at: new Date(data.created_at)
    }
  },

  async markAsRead(notificationId: number): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId.toString())

    return !error
  }
}

// Restaurant operations
export const restaurantService = {
  async createRestaurant(restaurantData: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>): Promise<Restaurant | null> {
    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        name: restaurantData.name,
        address: restaurantData.address,
        city: restaurantData.city,
        state: restaurantData.state,
        phone: restaurantData.phone,
        email: restaurantData.email,
        cuisine_type: restaurantData.cuisine_type,
        languages: restaurantData.languages,
        subscription_plan: restaurantData.subscription_plan,
        subscription_status: restaurantData.subscription_status
      })
      .select()
      .single()

    if (error || !data) return null

    return {
      id: parseInt(data.id),
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      phone: data.phone,
      email: data.email,
      cuisine_type: data.cuisine_type,
      languages: data.languages,
      subscription_plan: data.subscription_plan,
      subscription_status: data.subscription_status,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    }
  },

  async getRestaurantById(id: number): Promise<Restaurant | null> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null

    return {
      id: parseInt(data.id),
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      phone: data.phone,
      email: data.email,
      cuisine_type: data.cuisine_type,
      languages: data.languages,
      subscription_plan: data.subscription_plan,
      subscription_status: data.subscription_status,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    }
  }
}

// Test function to verify Supabase connection and table existence
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('restaurants')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Supabase connection successful!');
    return { success: true, data };
  } catch (error) {
    console.error('Supabase test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 

// Test function to check users table structure
export const testUsersTable = async () => {
  try {
    console.log('Testing users table structure...');
    
    // Try to get table info
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing users table:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Users table accessible, sample data structure:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Users table test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 