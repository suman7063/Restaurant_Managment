import { supabase, isSupabaseConfigured } from './supabase';
import { Table, MenuItem, Order, User, CartItem, Restaurant } from '../components/types';

export interface CreateTableData {
  table_number: number;
  qr_code: string;
  restaurant_id: string;
  status?: 'available' | 'occupied' | 'cleaning' | 'reserved';
  waiter_id?: string;
  guests?: number;
  revenue?: number;
}

export interface UpdateTableData {
  table_number?: number;
  status?: 'available' | 'occupied' | 'cleaning' | 'reserved';
  waiter_id?: string;
  guests?: number;
  revenue?: number;
}

// Fetch all tables for a restaurant
export async function fetchTables(restaurantId: string): Promise<Table[]> {
  try {
    const response = await fetch(`/api/admin/tables?restaurantId=${restaurantId}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch tables');
    }

    const data = await response.json();
    return data.tables || [];
  } catch (error) {
    console.error('Error in fetchTables:', error);
    throw error;
  }
}

// Create a new table
export async function createTable(tableData: CreateTableData): Promise<Table> {
  try {
    const response = await fetch('/api/admin/tables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(tableData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create table');
    }

    const data = await response.json();
    return data.table;
  } catch (error) {
    console.error('Error in createTable:', error);
    throw error;
  }
}

// Update a table
export async function updateTable(tableId: string, updateData: UpdateTableData): Promise<Table> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot update table');
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .update(updateData)
      .eq('id', tableId)
      .select(`
        *,
        waiter:users!restaurant_tables_waiter_id_fkey(
          id,
          name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Error updating table:', error);
      throw error;
    }

    return {
      id: data.id,
      table_number: data.table_number,
      status: data.status,
      waiter_id: data.waiter_id,
      waiter_name: data.waiter?.name || null,
      guests: data.guests || 0,
      revenue: data.revenue || 0,
      qr_code: data.qr_code,
      current_orders: [],
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error in updateTable:', error);
    throw error;
  }
}

// Soft delete a table
export async function deleteTable(tableId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot delete table');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('restaurant_tables')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', tableId);

    if (error) {
      console.error('Error soft deleting table:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteTable:', error);
    throw error;
  }
}

// Restore a soft deleted table
export async function restoreTable(tableId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot restore table');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('restaurant_tables')
      .update({ deleted_at: null })
      .eq('id', tableId);

    if (error) {
      console.error('Error restoring table:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in restoreTable:', error);
    throw error;
  }
}

// Get soft-deleted tables (for admin view)
export async function getSoftDeletedTables(restaurantId: string): Promise<Table[]> {
  interface TableRow {
    id: string;
    table_number: number;
    status: string;
    waiter_id: string;
    waiter?: { name: string };
    guests: number;
    revenue: number;
    qr_code: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot fetch soft-deleted tables');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .select(`
        *,
        waiter:users!restaurant_tables_waiter_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('restaurant_id', restaurantId)
      .not('deleted_at', 'is', null) // Only fetch soft-deleted tables
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('Error fetching soft-deleted tables:', error);
      return [];
    }

    return (data || []).map((table: TableRow) => ({
      id: table.id,
      table_number: table.table_number,
      status: table.status as 'available' | 'occupied' | 'needs_reset',
      waiter_id: table.waiter_id,
      waiter_name: table.waiter?.name || undefined,
      guests: table.guests,
      revenue: table.revenue,
      qr_code: table.qr_code,
      current_orders: [],
      created_at: new Date(table.created_at),
      updated_at: new Date(table.updated_at),
      deleted_at: table.deleted_at ? new Date(table.deleted_at) : undefined
    }));
  } catch (error) {
    console.error('Error in getSoftDeletedTables:', error);
    return [];
  }
}

// Permanently delete a table (hard delete)
export async function permanentlyDeleteTable(tableId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot permanently delete table');
    throw new Error('Supabase not configured');
  }

  try {
    // First, update the record to bypass the trigger
    await supabase
      .from('restaurant_tables')
      .update({ deleted_at: null })
      .eq('id', tableId);

    // Then perform the actual delete
    const { error } = await supabase
      .from('restaurant_tables')
      .delete()
      .eq('id', tableId);

    if (error) {
      console.error('Error permanently deleting table:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in permanentlyDeleteTable:', error);
    throw error;
  }
}

// Generate a unique QR code for a table
export function generateQRCode(tableNumber: number, restaurantId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `table-${tableNumber}-${restaurantId.slice(0, 8)}-${random}-${timestamp}`;
}

// Check if table number already exists in restaurant
export async function checkTableNumberExists(tableNumber: number, restaurantId: string, excludeTableId?: string): Promise<boolean> {
  try {
    // For now, we'll use the API route to fetch tables and check locally
    // This could be optimized with a dedicated endpoint later
    const tables = await fetchTables(restaurantId);
    return tables.some(table => 
      table.table_number === tableNumber && 
      (!excludeTableId || table.id !== excludeTableId)
    );
  } catch (error) {
    console.error('Error in checkTableNumberExists:', error);
    throw error;
  }
}

// Menu service for customer interface
export const menuService = {
  async getAllMenuItems(): Promise<MenuItem[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty array');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .is('deleted_at', null) // Only fetch non-deleted menu items
        .order('category', { ascending: true });

      if (error) {
        console.error('Error fetching menu items:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

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
      }));
    } catch (error) {
      console.error('Exception fetching menu items:', error);
      return [];
    }
  },

  async getPopularItems(): Promise<MenuItem[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty array');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('popular', true)
        .eq('available', true)
        .is('deleted_at', null) // Only fetch non-deleted menu items
        .order('rating', { ascending: false });

      if (error || !data) return [];

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
      }));
    } catch (error) {
      console.error('Exception fetching popular items:', error);
      return [];
    }
  }
};

// Order service for restaurant management system
export const orderService = {
  async getAllOrders(): Promise<Order[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty array');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (*)
          )
        `)
        .is('deleted_at', null) // Only fetch non-deleted orders
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map(order => ({
        id: order.id,
        table: order.table_number,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        items: order.order_items.map((item: Record<string, unknown>) => {
          const menuItem = item.menu_items as Record<string, unknown>;
          return {
            id: item.id as string,
            order_id: item.order_id as string,
            menu_item: {
              id: menuItem.id as string,
              name: menuItem.name as string,
              price: item.price_at_time as number,
              category: menuItem.category as string,
              prepTime: menuItem.prep_time as number,
              rating: menuItem.rating as number,
              image: menuItem.image as string,
              available: menuItem.available as boolean,
              kitchen_stations: (menuItem.kitchen_stations as string[]) || [],
              is_veg: menuItem.is_veg as boolean,
              cuisine_type: menuItem.cuisine_type as string,
              description: (menuItem.description as string) || ''
            },
            quantity: item.quantity as number,
            status: item.status as string,
            kitchen_station: item.kitchen_station_id as string,
            price_at_time: item.price_at_time as number,
            selected_add_ons: (item.selected_add_ons as unknown[]) || []
          };
        }),
        status: order.status,
        waiter_id: order.waiter_id,
        waiter_name: order.waiter_name,
        timestamp: new Date(order.created_at),
        total: order.total,
        estimated_time: order.estimated_time || 0,
        is_joined_order: order.is_joined_order || false,
        parent_order_id: order.parent_order_id
      }));
    } catch (error) {
      console.error('Exception fetching orders:', error);
      return [];
    }
  },

  async createOrder(orderData: {
    tableNumber: number;
    customerName: string;
    items: CartItem[];
    waiterId?: string;
  }): Promise<Order | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot create order');
      return null;
    }

    try {
      const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const estimatedTime = Math.max(...orderData.items.map(item => item.prepTime));

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
        .single();

      if (orderError || !order) return null;

      // Create order items in batch
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) return null;

      return {
        id: order.id,
        table: order.table_number,
        customer_name: order.customer_name,
        customer_phone: orderData.customerName,
        items: orderData.items.map((item, index) => ({
          id: `temp_${index + 1}`,
          order_id: order.id,
          menu_item: item,
          quantity: item.quantity,
          status: 'order_received',
          kitchen_station: item.kitchen_stations?.[0] || 'Main Kitchen',
          price_at_time: item.price,
          selected_add_ons: item.selected_add_ons || []
        })),
        status: order.status,
        waiter_id: order.waiter_id,
        waiter_name: order.waiter_name,
        timestamp: new Date(order.created_at),
        total,
        estimated_time: estimatedTime,
        is_joined_order: false,
        parent_order_id: undefined
      };
    } catch (error) {
      console.error('Exception creating order:', error);
      return null;
    }
  }
};

// Table service for restaurant management system
export const tableService = {
  async getAllTables(): Promise<Table[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty array');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .is('deleted_at', null) // Only fetch non-deleted tables
        .order('table_number', { ascending: true });

      if (error || !data) return [];

      return data.map(table => ({
        id: table.id,
        table_number: table.table_number,
        status: table.status,
        waiter_id: table.waiter_id,
        waiter_name: table.waiter_name,
        guests: table.guests,
        revenue: table.revenue,
        qr_code: table.qr_code || `TABLE${table.table_number}`,
        current_orders: [],
        created_at: new Date(table.created_at),
        updated_at: new Date(table.updated_at)
      }));
    } catch (error) {
      console.error('Exception fetching tables:', error);
      return [];
    }
  }
};

// User service for restaurant management system
export const userService = {
  async getAllUsers(): Promise<User[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty array');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .is('deleted_at', null) // Only fetch non-deleted users
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        table: undefined,
        role: user.role,
        language: user.language || 'en',
        kitchen_station: user.kitchen_station_id
      }));
    } catch (error) {
      console.error('Exception fetching users:', error);
      return [];
    }
  },

  async createUser(userData: Omit<User, 'id'> & { password?: string; restaurant_id?: string }): Promise<User | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot create user');
      return null;
    }

    try {
      const insertData = {
        name: userData.name,
        email: userData.email || null,
        phone: userData.phone || null,
        role: userData.role,
        language: userData.language || 'en',
        kitchen_station_id: userData.kitchen_station || null,
        restaurant_id: userData.restaurant_id || null
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating user:', error);
        return null;
      }
      
      if (!data) {
        console.error('No data returned from user creation');
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        language: data.language,
        kitchen_station: data.kitchen_station_id,
        table: userData.table || undefined
      };
    } catch (error) {
      console.error('Exception during user creation:', error);
      return null;
    }
  }
}; 

// Restaurant service for onboarding and management
export const restaurantService = {
  async createRestaurant(restaurantData: Omit<Restaurant, 'id' | 'created_at' | 'updated_at'>): Promise<Restaurant | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot create restaurant');
      return null;
    }

    try {
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
        .single();

      if (error) {
        console.error('Supabase error creating restaurant:', error);
        return null;
      }
      
      if (!data) {
        console.error('No data returned from restaurant creation');
        return null;
      }

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
      };
    } catch (error) {
      console.error('Exception creating restaurant:', error);
      return null;
    }
  },

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot fetch restaurant');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;

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
      };
    } catch (error) {
      console.error('Exception fetching restaurant:', error);
      return null;
    }
  }
}; 

// ============================================================================
// SOFT DELETE FUNCTIONS FOR ALL ENTITIES
// ============================================================================

// User soft delete functions
export async function softDeleteUser(userId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot soft delete user');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error soft deleting user:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in softDeleteUser:', error);
    throw error;
  }
}

export async function restoreUser(userId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot restore user');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: null })
      .eq('id', userId);

    if (error) {
      console.error('Error restoring user:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in restoreUser:', error);
    throw error;
  }
}

// Restaurant soft delete functions
export async function softDeleteRestaurant(restaurantId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot soft delete restaurant');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', restaurantId);

    if (error) {
      console.error('Error soft deleting restaurant:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in softDeleteRestaurant:', error);
    throw error;
  }
}

export async function restoreRestaurant(restaurantId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot restore restaurant');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('restaurants')
      .update({ deleted_at: null })
      .eq('id', restaurantId);

    if (error) {
      console.error('Error restoring restaurant:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in restoreRestaurant:', error);
    throw error;
  }
}

// Kitchen station soft delete functions
export async function softDeleteKitchenStation(stationId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot soft delete kitchen station');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('kitchen_stations')
      .delete()
      .eq('id', stationId);

    if (error) {
      console.error('Error soft deleting kitchen station:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in softDeleteKitchenStation:', error);
    throw error;
  }
}

export async function restoreKitchenStation(stationId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot restore kitchen station');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('kitchen_stations')
      .update({ deleted_at: null })
      .eq('id', stationId);

    if (error) {
      console.error('Error restoring kitchen station:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in restoreKitchenStation:', error);
    throw error;
  }
}

// Menu item soft delete functions
export async function softDeleteMenuItem(itemId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot soft delete menu item');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error soft deleting menu item:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in softDeleteMenuItem:', error);
    throw error;
  }
}

export async function restoreMenuItem(itemId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot restore menu item');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('menu_items')
      .update({ deleted_at: null })
      .eq('id', itemId);

    if (error) {
      console.error('Error restoring menu item:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in restoreMenuItem:', error);
    throw error;
  }
}

// Order soft delete functions
export async function softDeleteOrder(orderId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot soft delete order');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Error soft deleting order:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in softDeleteOrder:', error);
    throw error;
  }
}

export async function restoreOrder(orderId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot restore order');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('orders')
      .update({ deleted_at: null })
      .eq('id', orderId);

    if (error) {
      console.error('Error restoring order:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in restoreOrder:', error);
    throw error;
  }
}

// Order item soft delete functions
export async function softDeleteOrderItem(itemId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot soft delete order item');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error soft deleting order item:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in softDeleteOrderItem:', error);
    throw error;
  }
}

export async function restoreOrderItem(itemId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot restore order item');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('order_items')
      .update({ deleted_at: null })
      .eq('id', itemId);

    if (error) {
      console.error('Error restoring order item:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in restoreOrderItem:', error);
    throw error;
  }
}

// Notification soft delete functions
export async function softDeleteNotification(notificationId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot soft delete notification');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error soft deleting notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in softDeleteNotification:', error);
    throw error;
  }
}

export async function restoreNotification(notificationId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot restore notification');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ deleted_at: null })
      .eq('id', notificationId);

    if (error) {
      console.error('Error restoring notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in restoreNotification:', error);
    throw error;
  }
}

// Auth session soft delete functions
export async function softDeleteAuthSession(sessionId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot soft delete auth session');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('auth_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error soft deleting auth session:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in softDeleteAuthSession:', error);
    throw error;
  }
}

export async function restoreAuthSession(sessionId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot restore auth session');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('auth_sessions')
      .update({ deleted_at: null })
      .eq('id', sessionId);

    if (error) {
      console.error('Error restoring auth session:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in restoreAuthSession:', error);
    throw error;
  }
}

// Password reset token soft delete functions
export async function softDeletePasswordResetToken(tokenId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot soft delete password reset token');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('id', tokenId);

    if (error) {
      console.error('Error soft deleting password reset token:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in softDeletePasswordResetToken:', error);
    throw error;
  }
}

export async function restorePasswordResetToken(tokenId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot restore password reset token');
    throw new Error('Supabase not configured');
  }

  try {
    const { error } = await supabase
      .from('password_reset_tokens')
      .update({ deleted_at: null })
      .eq('id', tokenId);

    if (error) {
      console.error('Error restoring password reset token:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in restorePasswordResetToken:', error);
    throw error;
  }
}

// ============================================================================
// BULK SOFT DELETE FUNCTIONS
// ============================================================================

// Bulk soft delete all records for a restaurant (for restaurant deletion)
export async function softDeleteRestaurantData(restaurantId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot soft delete restaurant data');
    throw new Error('Supabase not configured');
  }

  try {
    // Soft delete all related data
    await Promise.all([
      supabase.from('restaurant_tables').delete().eq('restaurant_id', restaurantId),
      supabase.from('menu_items').delete().eq('restaurant_id', restaurantId),
      supabase.from('kitchen_stations').delete().eq('restaurant_id', restaurantId),
      supabase.from('orders').delete().eq('restaurant_id', restaurantId),
      supabase.from('notifications').delete().eq('restaurant_id', restaurantId),
      supabase.from('auth_sessions').delete().eq('restaurant_id', restaurantId),
      supabase.from('password_reset_tokens').delete().eq('restaurant_id', restaurantId),
      supabase.from('users').delete().eq('restaurant_id', restaurantId),
      supabase.from('restaurants').delete().eq('id', restaurantId)
    ]);
  } catch (error) {
    console.error('Error in softDeleteRestaurantData:', error);
    throw error;
  }
}

// Bulk restore all records for a restaurant
export async function restoreRestaurantData(restaurantId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured, cannot restore restaurant data');
    throw new Error('Supabase not configured');
  }

  try {
    // Restore all related data
    await Promise.all([
      supabase.from('restaurant_tables').update({ deleted_at: null }).eq('restaurant_id', restaurantId),
      supabase.from('menu_items').update({ deleted_at: null }).eq('restaurant_id', restaurantId),
      supabase.from('kitchen_stations').update({ deleted_at: null }).eq('restaurant_id', restaurantId),
      supabase.from('orders').update({ deleted_at: null }).eq('restaurant_id', restaurantId),
      supabase.from('notifications').update({ deleted_at: null }).eq('restaurant_id', restaurantId),
      supabase.from('auth_sessions').update({ deleted_at: null }).eq('restaurant_id', restaurantId),
      supabase.from('password_reset_tokens').update({ deleted_at: null }).eq('restaurant_id', restaurantId),
      supabase.from('users').update({ deleted_at: null }).eq('restaurant_id', restaurantId),
      supabase.from('restaurants').update({ deleted_at: null }).eq('id', restaurantId)
    ]);
  } catch (error) {
    console.error('Error in restoreRestaurantData:', error);
    throw error;
  }
}