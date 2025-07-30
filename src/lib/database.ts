import { supabase } from './supabase'
import { User, MenuItem, Order, Table, CartItem, Notification, Restaurant, UserRole, Language } from '../components/types'

// Database types that match Supabase schema with UUIDs
export interface DatabaseUser {
  id: string // UUID
  name: string
  email: string
  phone: string
  role: string
  language: string
  kitchen_station_id: string | null
  restaurant_id: string | null
  created_at: string
  updated_at: string
}

export interface DatabaseMenuItem {
  id: string // UUID
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
  customizations?: Record<string, unknown>[]
  add_ons?: Record<string, unknown>[]
  created_at: string
  updated_at: string
}

export interface DatabaseOrder {
  id: string // UUID
  table_number: number
  customer_name: string
  customer_phone?: string
  status: string
  waiter_id: string | null
  waiter_name?: string
  total: number
  estimated_time: number | null
  is_joined_order: boolean
  parent_order_id?: string // UUID
  created_at: string
  updated_at: string
}

export interface DatabaseOrderItem {
  id: string // UUID
  order_id: string // UUID
  menu_item_id: string // UUID
  quantity: number
  price_at_time: number
  created_at: string
}

export interface DatabaseTable {
  id: string // UUID
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
  id: string // UUID
  message: string
  message_hi?: string
  message_kn?: string
  type: string
  user_id: string | null
  order_id?: string // UUID
  item_id?: string // UUID
  read: boolean
  created_at: string
}

export interface DatabaseRestaurant {
  id: string // UUID
  name: string
  address: string
  city: string
  state: string
  phone: string
  email: string
  cuisine_type: string
  languages: string[]
  subscription_plan: string
  subscription_status: string
  created_at: string
  updated_at: string
}

// User operations
export const userService = {
  async getUserByQRCode(qrCode: string): Promise<User | null> {
    // QR codes are for tables, not users
    // This function should be removed or refactored to work with restaurant_tables
    console.warn('getUserByQRCode is deprecated - QR codes are for tables, not users');
    return null;
  },

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(user => ({
      id: user.id, // UUID - no need to parse
      name: user.name,
      email: user.email,
      phone: user.phone,
      table: undefined, // Users don't have table_number in database
      role: user.role,
      language: user.language || 'en',
      kitchen_station: user.kitchen_station_id
    }))
  },

  async createUser(userData: Omit<User, 'id'> & { password?: string; restaurant_id?: string }): Promise<User | null> {
    console.log('Creating user with data:', userData);
    
    const insertData = {
      name: userData.name,
      email: userData.email || null,
      phone: userData.phone || null,
      role: userData.role,
      language: userData.language || 'en',
      kitchen_station_id: userData.kitchen_station || null,
      restaurant_id: userData.restaurant_id || null
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
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role as UserRole,
        language: data.language as Language,
        kitchen_station: data.kitchen_station_id,
        table: userData.table || undefined
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
      id: item.id,
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
      id: item.id,
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
      id: data.id,
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
      id: order.id,
      table: order.table_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      items: order.order_items.map((item: Record<string, unknown>) => ({
        id: (item.menu_items as Record<string, unknown>).id as string,
        name: (item.menu_items as Record<string, unknown>).name as string,
        price: item.price_at_time as number,
        category: (item.menu_items as Record<string, unknown>).category as string,
        prepTime: (item.menu_items as Record<string, unknown>).prep_time as number,
        rating: (item.menu_items as Record<string, unknown>).rating as number,
        image: (item.menu_items as Record<string, unknown>).image as string,
        quantity: item.quantity as number
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
      id: order.id,
      table: order.table_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      items: order.order_items.map((item: Record<string, unknown>) => ({
        id: (item.menu_items as Record<string, unknown>).id as string,
        name: (item.menu_items as Record<string, unknown>).name as string,
        price: item.price_at_time as number,
        category: (item.menu_items as Record<string, unknown>).category as string,
        prepTime: (item.menu_items as Record<string, unknown>).prep_time as number,
        rating: (item.menu_items as Record<string, unknown>).rating as number,
        image: (item.menu_items as Record<string, unknown>).image as string,
        quantity: item.quantity as number
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
      id: order.id,
      table: order.table_number,
      customer_name: order.customer_name,
      customer_phone: orderData.customerName, // Use the input data
      items: orderData.items.map((item, index) => ({
        id: `temp_${index + 1}`, // Generate a temporary string ID
        order_id: order.id,
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

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

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
      id: table.id,
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
    const updateData: Record<string, unknown> = { status }
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
      id: notification.id,
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
      id: data.id,
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

  async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    return !error
  }
}

// Restaurant operations
export const restaurantService = {
  async createRestaurant(restaurantData: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>): Promise<Restaurant | null> {
    console.log('Creating restaurant with data:', restaurantData);
    
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

    if (error) {
      console.error('Supabase error creating restaurant:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }
    
    if (!data) {
      console.error('No data returned from restaurant creation');
      return null;
    }

    console.log('Restaurant created successfully:', data);

    return {
      id: data.id,
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

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
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
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return { success: false, error: error.message };
    }
    
    console.log('Users table accessible, sample data structure:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Users table test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Test function to try creating a user directly
export const testCreateUser = async () => {
  try {
    console.log('Testing user creation...');
    
    const testUser = {
      name: "Test Admin",
      email: "test@example.com",
      phone: "1234567890",
      role: "admin",
      language: "en",
      kitchen_station_id: null,
      restaurant_id: null
    };
    
    console.log('Attempting to create test user with data:', testUser);
    
    const { data, error } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating test user:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return { success: false, error: error.message };
    }
    
    console.log('Test user created successfully:', data);
    
    // Clean up - delete the test user
    await supabase
      .from('users')
      .delete()
      .eq('email', testUser.email);
    
    return { success: true, data };
  } catch (error) {
    console.error('Test user creation failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 