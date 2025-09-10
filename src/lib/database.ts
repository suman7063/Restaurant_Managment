import { supabase, isSupabaseConfigured } from './supabase';
import { Table, MenuItem, Order, User, CartItem, Restaurant, MenuCategory, Session, SessionCustomer } from '../components/types';

// Export User as DatabaseUser for backwards compatibility
export type DatabaseUser = User;

// Disabled cache service to prevent consistency issues
export const cacheService = {
  clearAllCache: () => {
    // Cache disabled for consistency
    console.log('Cache disabled - no clearing needed');
  },
  getCacheStats: () => {
    // Return zero stats since caching is disabled
    return {
      totalEntries: 0,
      memoryUsage: 0,
      hitRate: 0
    };
  },
  clearExpiredCache: () => {
    // Cache disabled for consistency
    console.log('Cache disabled - no expired cache to clear');
  }
};

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

// Menu category service for CRUD operations
export const menuCategoryService = {
  async getAllCategories(restaurantId: string): Promise<MenuCategory[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot fetch menu categories');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('restaurant_menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('deleted_at', null)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Supabase error fetching menu categories:', error);
        return [];
      }

      return data?.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        display_order: category.display_order,
        is_active: category.is_active,
        restaurant_id: category.restaurant_id,
        created_at: new Date(category.created_at),
        updated_at: new Date(category.updated_at),
        deleted_at: category.deleted_at ? new Date(category.deleted_at) : null
      })) || [];
    } catch (error) {
      console.error('Exception fetching menu categories:', error);
      return [];
    }
  },

  async createCategory(categoryData: Omit<MenuCategory, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<MenuCategory | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot create menu category');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('restaurant_menu_categories')
        .insert({
          name: categoryData.name,
          description: categoryData.description,
          display_order: categoryData.display_order,
          is_active: categoryData.is_active,
          restaurant_id: categoryData.restaurant_id
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating menu category:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        display_order: data.display_order,
        is_active: data.is_active,
        restaurant_id: data.restaurant_id,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        deleted_at: data.deleted_at ? new Date(data.deleted_at) : null
      };
    } catch (error) {
      console.error('Exception creating menu category:', error);
      return null;
    }
  },

  async updateCategory(categoryId: string, updateData: Partial<Omit<MenuCategory, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<MenuCategory | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot update menu category');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('restaurant_menu_categories')
        .update({
          name: updateData.name,
          description: updateData.description,
          display_order: updateData.display_order,
          is_active: updateData.is_active
        })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating menu category:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        display_order: data.display_order,
        is_active: data.is_active,
        restaurant_id: data.restaurant_id,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        deleted_at: data.deleted_at ? new Date(data.deleted_at) : null
      };
    } catch (error) {
      console.error('Exception updating menu category:', error);
      return null;
    }
  },

  async deleteCategory(categoryId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot delete menu category');
      return;
    }

    try {
      const { error } = await supabase
        .from('restaurant_menu_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('Supabase error deleting menu category:', error);
      }
    } catch (error) {
      console.error('Exception deleting menu category:', error);
    }
  }
};

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
        .order('category_id', { ascending: true });

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
        description: item.description || '',
        price: item.price,
        category_id: item.category_id,
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
        description: item.description || '',
        price: item.price,
        category_id: item.category_id,
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
            selected_add_ons: (item.selected_add_ons as unknown[]) || [],
            customer_id: item.customer_id as string,
            customer_name: item.customer_name as string,
            customer_phone: item.customer_phone as string
          };
        }),
        status: order.status,
        waiter_id: order.waiter_id,
        waiter_name: order.waiter_name,
        timestamp: new Date(order.created_at),
        total: order.total,
        estimated_time: order.estimated_time || 0,
        is_joined_order: order.is_joined_order || false,
        parent_order_id: order.parent_order_id,
        session_id: order.session_id,
        session_otp: order.session_otp,
        customer_id: order.customer_id,
        restaurant_id: order.restaurant_id,
        is_session_order: order.is_session_order || false
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
    sessionId?: string;
    customerId?: string;
    restaurantId?: string;
  }): Promise<Order | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot create order');
      return null;
    }

    try {
      // Session validation if sessionId is provided
      if (orderData.sessionId) {
        const session = await sessionService.getSessionById(orderData.sessionId);
        if (!session || session.status !== 'active') {
          console.error('Session not found or not active');
          return null;
        }
      }

      // Get table_id from table_number
      console.log('Looking for table with number:', orderData.tableNumber);
      const { data: tableData, error: tableError } = await supabase
        .from('restaurant_tables')
        .select('id, restaurant_id')
        .eq('table_number', orderData.tableNumber)
        .is('deleted_at', null)
        .single();

      if (tableError || !tableData) {
        console.error('Table not found:', tableError, 'Table number:', orderData.tableNumber);
        return null;
      }
      console.log('Found table:', tableData);

      // Get or create customer user
      let customerId = orderData.customerId;
      if (!customerId) {
        console.log('Looking for existing customer:', orderData.customerName);
        // Try to find existing customer by name
        const { data: existingCustomer } = await supabase
          .from('users')
          .select('id')
          .eq('name', orderData.customerName)
          .eq('role', 'customer')
          .eq('restaurant_id', tableData.restaurant_id)
          .is('deleted_at', null)
          .single();

        if (existingCustomer) {
          customerId = existingCustomer.id;
          console.log('Found existing customer:', customerId);
        } else {
          console.log('Creating new customer:', orderData.customerName);
          // Create new customer user
          const { data: newCustomer, error: customerError } = await supabase
            .from('users')
            .insert({
              name: orderData.customerName,
              role: 'customer',
              restaurant_id: tableData.restaurant_id,
              phone: orderData.customerName // Using name as phone for now
            })
            .select('id')
            .single();

          if (customerError || !newCustomer) {
            console.error('Failed to create customer:', customerError);
            return null;
          }
          customerId = newCustomer.id;
          console.log('Created new customer:', customerId);
        }
      }

      const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const estimatedTime = Math.max(...orderData.items.map(item => item.prepTime));

      // Create order with proper UUID fields
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: tableData.id,
          customer_id: customerId,
          waiter_id: orderData.waiterId,
          session_id: orderData.sessionId,
          restaurant_id: tableData.restaurant_id,
          is_joined_order: !!orderData.sessionId,
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
        price_at_time: item.price,
        special_notes: item.special_notes || '',
        selected_add_ons: item.selected_add_ons || []
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) return null;

      // Update session total if this is a session order
      if (orderData.sessionId) {
        await sessionService.updateSessionTotal(orderData.sessionId);
      }

      return {
        id: order.id,
        table: orderData.tableNumber, // Use the original table number
        customer_name: orderData.customerName,
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
        parent_order_id: undefined,
        session_id: order.session_id,
        session_otp: order.session_otp,
        customer_id: order.customer_id,
        restaurant_id: order.restaurant_id,
        is_session_order: order.is_joined_order
      };
    } catch (error) {
      console.error('Exception creating order:', error);
      return null;
    }
  },

  // Session-related methods
  async getSessionOrders(sessionId: string): Promise<Order[]> {
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
        .eq('session_id', sessionId)
        .is('deleted_at', null)
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
            selected_add_ons: (item.selected_add_ons as unknown[]) || [],
            customer_id: item.customer_id as string,
            customer_name: item.customer_name as string,
            customer_phone: item.customer_phone as string
          };
        }),
        status: order.status,
        waiter_id: order.waiter_id,
        waiter_name: order.waiter_name,
        timestamp: new Date(order.created_at),
        total: order.total,
        estimated_time: order.estimated_time || 0,
        is_joined_order: order.is_joined_order || false,
        parent_order_id: order.parent_order_id,
        session_id: order.session_id,
        session_otp: order.session_otp,
        customer_id: order.customer_id,
        restaurant_id: order.restaurant_id,
        is_session_order: order.is_session_order || false
      }));
    } catch (error) {
      console.error('Exception fetching session orders:', error);
      return [];
    }
  },

  async getCustomerOrders(sessionId: string, customerId: string): Promise<Order[]> {
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
        .eq('session_id', sessionId)
        .eq('customer_id', customerId)
        .is('deleted_at', null)
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
            selected_add_ons: (item.selected_add_ons as unknown[]) || [],
            customer_id: item.customer_id as string,
            customer_name: item.customer_name as string,
            customer_phone: item.customer_phone as string
          };
        }),
        status: order.status,
        waiter_id: order.waiter_id,
        waiter_name: order.waiter_name,
        timestamp: new Date(order.created_at),
        total: order.total,
        estimated_time: order.estimated_time || 0,
        is_joined_order: order.is_joined_order || false,
        parent_order_id: order.parent_order_id,
        session_id: order.session_id,
        session_otp: order.session_otp,
        customer_id: order.customer_id,
        restaurant_id: order.restaurant_id,
        is_session_order: order.is_session_order || false
      }));
    } catch (error) {
      console.error('Exception fetching customer orders:', error);
      return [];
    }
  },

  async updateSessionTotal(sessionId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, simulating session total update');
      return true;
    }

    try {
      // Get all orders for the session
      const orders = await this.getSessionOrders(sessionId);
      
      // Calculate total amount
      const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);

      // Update session total
      const { error } = await supabase
        .from('table_sessions')
        .update({
          total_amount: totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session total:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception updating session total:', error);
      return false;
    }
  },

  async getOrdersByTable(tableId: string, sessionId?: string): Promise<Order[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty array');
      return [];
    }

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (*)
          )
        `)
        .eq('table_number', tableId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Filter by session if provided
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

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
            selected_add_ons: (item.selected_add_ons as unknown[]) || [],
            customer_id: item.customer_id as string,
            customer_name: item.customer_name as string,
            customer_phone: item.customer_phone as string
          };
        }),
        status: order.status,
        waiter_id: order.waiter_id,
        waiter_name: order.waiter_name,
        timestamp: new Date(order.created_at),
        total: order.total,
        estimated_time: order.estimated_time || 0,
        is_joined_order: order.is_joined_order || false,
        parent_order_id: order.parent_order_id,
        session_id: order.session_id,
        session_otp: order.session_otp,
        customer_id: order.customer_id,
        restaurant_id: order.restaurant_id,
        is_session_order: order.is_session_order || false
      }));
    } catch (error) {
      console.error('Exception fetching table orders:', error);
      return [];
    }
  },

  // Order management methods
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, simulating order status update');
      return true;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception updating order status:', error);
      return false;
    }
  },

  async addOrderToSession(orderId: string, sessionId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, simulating add order to session');
      return true;
    }

    try {
      // Validate session exists and is active
      const session = await sessionService.getSessionById(sessionId);
      if (!session || session.status !== 'active') {
        console.error('Session not found or not active');
        return false;
      }

      // Update order with session data
      const { error } = await supabase
        .from('orders')
        .update({
          session_id: sessionId,
          is_session_order: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error adding order to session:', error);
        return false;
      }

      // Update session total
      await this.updateSessionTotal(sessionId);

      return true;
    } catch (error) {
      console.error('Exception adding order to session:', error);
      return false;
    }
  },

  async removeOrderFromSession(orderId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, simulating remove order from session');
      return true;
    }

    try {
      // Get order to find session ID
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('session_id')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) {
        console.error('Order not found');
        return false;
      }

      // Update order to remove session data
      const { error } = await supabase
        .from('orders')
        .update({
          session_id: null,
          is_session_order: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error removing order from session:', error);
        return false;
      }

      // Update session total if session exists
      if (order.session_id) {
        await this.updateSessionTotal(order.session_id);
      }

      return true;
    } catch (error) {
      console.error('Exception removing order from session:', error);
      return false;
    }
  },

  async updateOrderItemStatus(itemId: string, status: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, simulating order item status update');
      return true;
    }

    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add timing fields based on status
      switch (status) {
        case 'preparing':
          updateData.preparation_start_time = new Date().toISOString();
          break;
        case 'prepared':
          updateData.preparation_end_time = new Date().toISOString();
          break;
        case 'delivered':
          updateData.delivery_time = new Date().toISOString();
          break;
      }

      const { error } = await supabase
        .from('order_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) {
        console.error('Error updating order item status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception updating order item status:', error);
      return false;
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning mock order');
      return {
        id: orderId,
        table: 1,
        customer_name: 'John Doe',
        customer_phone: '+1234567890',
        items: [
          {
            id: 'item-1',
            order_id: orderId,
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
            price_at_time: 15.99
          }
        ],
        status: 'active',
        timestamp: new Date(),
        total: 31.98,
        estimated_time: 25,
        is_joined_order: false,
        is_session_order: true,
        session_id: 'session-1',
        customer_id: 'customer-1'
      };
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
        .eq('id', orderId)
        .single();

      if (error || !data) {
        console.error('Error fetching order:', error);
        return null;
      }

      return {
        id: data.id,
        table: data.table_number,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        items: data.order_items.map((item: any) => ({
          id: item.id,
          order_id: item.order_id,
          menu_item: {
            id: item.menu_items.id,
            name: item.menu_items.name,
            price: item.menu_items.price,
            description: item.menu_items.description,
            category_id: item.menu_items.category_id,
            prepTime: item.menu_items.prep_time,
            rating: item.menu_items.rating || 0,
            image: item.menu_items.image,
            available: item.menu_items.available,
            kitchen_stations: item.menu_items.kitchen_stations || [],
            is_veg: item.menu_items.is_veg,
            cuisine_type: item.menu_items.cuisine_type
          },
          quantity: item.quantity,
          special_notes: item.special_notes,
          status: item.status,
          kitchen_station: item.kitchen_station,
          price_at_time: item.price_at_time,
          preparation_start_time: item.preparation_start_time ? new Date(item.preparation_start_time) : undefined,
          preparation_end_time: item.preparation_end_time ? new Date(item.preparation_end_time) : undefined,
          delivery_time: item.delivery_time ? new Date(item.delivery_time) : undefined
        })),
        status: data.status,
        timestamp: new Date(data.created_at),
        total: data.total,
        estimated_time: data.estimated_time,
        is_joined_order: data.is_joined_order,
        is_session_order: data.is_session_order,
        session_id: data.session_id,
        customer_id: data.customer_id,
        waiter_id: data.waiter_id,
        waiter_name: data.waiter_name,
        restaurant_id: data.restaurant_id
      };
    } catch (error) {
      console.error('Exception fetching order:', error);
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

  async createUser(userData: Omit<User, 'id'> & { password?: string; restaurant_id?: string; preferred_language?: string }): Promise<User | null> {
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

// Menu Item CRUD Operations

export interface CreateMenuItemData {
  name: string;
  description: string;
  price: number;
  category_id: string;
  prep_time: number;
  image?: string;
  popular?: boolean;
  available?: boolean;
  kitchen_station_id?: string;
  is_veg?: boolean;
  cuisine_type?: string;
  customizations?: object[];
  add_ons?: object[];
  restaurant_id: string;
}

export interface UpdateMenuItemData {
  name?: string;
  description?: string;
  price?: number;
  category_id?: string;
  prep_time?: number;
  image?: string;
  popular?: boolean;
  available?: boolean;
  kitchen_station_id?: string;
  is_veg?: boolean;
  cuisine_type?: string;
  customizations?: object[];
  add_ons?: object[];
}

// Fetch all menu items for a restaurant
export async function fetchMenuItems(restaurantId: string): Promise<MenuItem[]> {
  try {
    const response = await fetch(`/api/admin/menu-items?restaurantId=${restaurantId}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch menu items');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
}

// Create a new menu item
export async function createMenuItem(menuItemData: CreateMenuItemData): Promise<MenuItem> {
  try {
    const response = await fetch('/api/admin/menu-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(menuItemData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create menu item');
    }

    return result.data;
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw error;
  }
}

// Update an existing menu item
export async function updateMenuItem(menuItemId: string, updateData: UpdateMenuItemData): Promise<MenuItem> {
  try {
    const response = await fetch(`/api/admin/menu-items/${menuItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update menu item');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
}

// Delete a menu item (soft delete)
export async function deleteMenuItem(menuItemId: string): Promise<void> {
  try {
    const response = await fetch(`/api/admin/menu-items/${menuItemId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete menu item');
    }
  } catch (error) {
    console.error('Error deleting menu item:', error);
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

// ============================================================================
// SESSION SERVICE FOR OTP-BASED GROUP ORDERING
// ============================================================================

// OTP Generation Algorithm
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if OTP is unique for active sessions on a table
async function isOTPUnique(otp: string, tableId: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return true; // In dev mode, assume unique
  }

  try {
    const { data, error } = await supabase
      .from('table_sessions')
      .select('id')
      .eq('session_otp', otp)
      .eq('table_id', tableId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .limit(1);

    if (error) {
      console.error('Error checking OTP uniqueness:', error);
      return false;
    }

    return !data || data.length === 0;
  } catch (error) {
    console.error('Exception checking OTP uniqueness:', error);
    return false;
  }
}

// Generate unique OTP with retry logic
async function generateUniqueOTP(tableId: string, maxRetries: number = 10): Promise<string | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const otp = generateOTP();
    if (await isOTPUnique(otp, tableId)) {
      return otp;
    }
  }
  return null;
}

// Session service for OTP-based group ordering
export const sessionService = {
  // Core Methods
  async createSession(tableId: string, restaurantId: string): Promise<Session | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, simulating session creation');
      const mockSession: Session = {
        id: `mock-session-${Date.now()}`,
        table_id: tableId,
        restaurant_id: restaurantId,
        session_otp: '123456',
        status: 'active',
        total_amount: 0,
        created_at: new Date(),
        updated_at: new Date(),
        restaurant_tables: {
          table_number: 5,
          qr_code: 'table-5-qr-code'
        }
      };
      return mockSession;
    }

    try {
      // Check if table exists and is active
      const { data: table, error: tableError } = await supabase
        .from('restaurant_tables')
        .select('id, status')
        .eq('id', tableId)
        .eq('restaurant_id', restaurantId)
        .is('deleted_at', null)
        .single();

      if (tableError || !table) {
        console.error('Table not found or inactive:', tableError);
        return null;
      }

      // Note: Multiple active sessions are allowed per table for different groups
      // No need to check for existing sessions - each group can have their own session

      // Generate unique OTP
      const otp = await generateUniqueOTP(tableId);
      if (!otp) {
        console.error('Failed to generate unique OTP');
        return null;
      }

      // Set OTP expiration (24 hours from now)
      const otpExpiresAt = new Date();
      otpExpiresAt.setHours(otpExpiresAt.getHours() + 24);

      // Create session
      const { data, error } = await supabase
        .from('table_sessions')
        .insert({
          table_id: tableId,
          restaurant_id: restaurantId,
          session_otp: otp,
          otp_expires_at: otpExpiresAt.toISOString(),
          status: 'active',
          total_amount: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      return {
        id: data.id,
        table_id: data.table_id,
        restaurant_id: data.restaurant_id,
        session_otp: data.session_otp,
        otp_expires_at: data.otp_expires_at ? new Date(data.otp_expires_at) : undefined,
        status: data.status,
        total_amount: data.total_amount,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        deleted_at: data.deleted_at ? new Date(data.deleted_at) : undefined
      };
    } catch (error) {
      console.error('Exception creating session:', error);
      return null;
    }
  },

  async joinSession(otp: string, tableId: string, customerData: { name: string; phone: string }): Promise<{ session: Session; customer: SessionCustomer } | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, simulating session join');
      const mockSession: Session = {
        id: `mock-session-${Date.now()}`,
        table_id: tableId,
        restaurant_id: 'mock-restaurant',
        session_otp: otp,
        status: 'active',
        total_amount: 0,
        created_at: new Date(),
        updated_at: new Date(),
        restaurant_tables: {
          table_number: 5,
          qr_code: 'table-5-qr-code'
        }
      };
      const mockCustomer: SessionCustomer = {
        id: `mock-customer-${Date.now()}`,
        session_id: mockSession.id,
        name: customerData.name,
        phone: customerData.phone,
        joined_at: new Date()
      };
      return { session: mockSession, customer: mockCustomer };
    }

    try {
      // Validate OTP format
      if (!/^\d{6}$/.test(otp)) {
        console.error('Invalid OTP format');
        return null;
      }

      // Find active session by OTP and table
      const { data: session, error: sessionError } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('session_otp', otp)
        .eq('table_id', tableId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .single();

      if (sessionError || !session) {
        console.error('Session not found or inactive:', sessionError);
        return null;
      }

      // Check OTP expiration
      if (session.otp_expires_at && new Date(session.otp_expires_at) < new Date()) {
        console.error('OTP has expired');
        return null;
      }

      // Check if customer already exists in session
      const { data: existingCustomer } = await supabase
        .from('session_customers')
        .select('*')
        .eq('session_id', session.id)
        .eq('phone', customerData.phone)
        .is('deleted_at', null)
        .single();

      let customer: SessionCustomer;

      if (existingCustomer) {
        // Return existing customer
        customer = {
          id: existingCustomer.id,
          session_id: existingCustomer.session_id,
          name: existingCustomer.name,
          phone: existingCustomer.phone,
          joined_at: new Date(existingCustomer.joined_at),
          deleted_at: existingCustomer.deleted_at ? new Date(existingCustomer.deleted_at) : undefined
        };
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('session_customers')
          .insert({
            session_id: session.id,
            name: customerData.name,
            phone: customerData.phone
          })
          .select()
          .single();

        if (customerError || !newCustomer) {
          console.error('Error creating customer:', customerError);
          return null;
        }

        customer = {
          id: newCustomer.id,
          session_id: newCustomer.session_id,
          name: newCustomer.name,
          phone: newCustomer.phone,
          joined_at: new Date(newCustomer.joined_at),
          deleted_at: newCustomer.deleted_at ? new Date(newCustomer.deleted_at) : undefined
        };
      }

      return {
        session: {
          id: session.id,
          table_id: session.table_id,
          restaurant_id: session.restaurant_id,
          session_otp: session.session_otp,
          otp_expires_at: session.otp_expires_at ? new Date(session.otp_expires_at) : undefined,
          status: session.status,
          total_amount: session.total_amount,
          created_at: new Date(session.created_at),
          updated_at: new Date(session.updated_at),
          deleted_at: session.deleted_at ? new Date(session.deleted_at) : undefined
        },
        customer
      };
    } catch (error) {
      console.error('Exception joining session:', error);
      return null;
    }
  },

  async getActiveSession(tableId: string): Promise<Session | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning null for active session');
      return null;
    }

    try {
      // Get the most recent active session for the table
      const { data, error } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('table_id', tableId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        table_id: data.table_id,
        restaurant_id: data.restaurant_id,
        session_otp: data.session_otp,
        otp_expires_at: data.otp_expires_at ? new Date(data.otp_expires_at) : undefined,
        status: data.status,
        total_amount: data.total_amount,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        deleted_at: data.deleted_at ? new Date(data.deleted_at) : undefined
      };
    } catch (error) {
      console.error('Exception getting active session:', error);
      return null;
    }
  },

  async getSessionById(sessionId: string): Promise<Session | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning null for session');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('id', sessionId)
        .is('deleted_at', null)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        table_id: data.table_id,
        restaurant_id: data.restaurant_id,
        session_otp: data.session_otp,
        otp_expires_at: data.otp_expires_at ? new Date(data.otp_expires_at) : undefined,
        status: data.status,
        total_amount: data.total_amount,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        deleted_at: data.deleted_at ? new Date(data.deleted_at) : undefined
      };
    } catch (error) {
      console.error('Exception getting session by ID:', error);
      return null;
    }
  },

  async getSessionCustomers(sessionId: string): Promise<SessionCustomer[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty array for session customers');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('session_customers')
        .select('*')
        .eq('session_id', sessionId)
        .is('deleted_at', null)
        .order('joined_at', { ascending: true });

      if (error || !data) return [];

      return data.map(customer => ({
        id: customer.id,
        session_id: customer.session_id,
        name: customer.name,
        phone: customer.phone,
        joined_at: new Date(customer.joined_at),
        deleted_at: customer.deleted_at ? new Date(customer.deleted_at) : undefined
      }));
    } catch (error) {
      console.error('Exception getting session customers:', error);
      return [];
    }
  },

  async getSessionOrders(sessionId: string): Promise<Order[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning empty array for session orders');
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
        .eq('session_id', sessionId)
        .is('deleted_at', null)
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
      console.error('Exception getting session orders:', error);
      return [];
    }
  },

  // Management Methods
  async regenerateOTP(sessionId: string): Promise<string | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning mock OTP');
      return '654321';
    }

    try {
      // Get session to find table_id
      const session = await this.getSessionById(sessionId);
      if (!session) {
        console.error('Session not found');
        return null;
      }

      // Generate new unique OTP
      const newOtp = await generateUniqueOTP(session.table_id);
      if (!newOtp) {
        console.error('Failed to generate unique OTP');
        return null;
      }

      // Set new OTP expiration (24 hours from now)
      const otpExpiresAt = new Date();
      otpExpiresAt.setHours(otpExpiresAt.getHours() + 24);

      // Update session with new OTP
      const { error } = await supabase
        .from('table_sessions')
        .update({
          session_otp: newOtp,
          otp_expires_at: otpExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error regenerating OTP:', error);
        return null;
      }

      return newOtp;
    } catch (error) {
      console.error('Exception regenerating OTP:', error);
      return null;
    }
  },

  async clearSession(sessionId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, simulating session clear');
      return true;
    }

    try {
      // Update session status to cleared
      const { error } = await supabase
        .from('table_sessions')
        .update({
          status: 'cleared',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error clearing session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception clearing session:', error);
      return false;
    }
  },

  async updateSessionTotal(sessionId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, simulating session total update');
      return true;
    }

    try {
      // Get all orders for the session
      const orders = await this.getSessionOrders(sessionId);
      
      // Calculate total amount
      const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);

      // Update session total
      const { error } = await supabase
        .from('table_sessions')
        .update({
          total_amount: totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session total:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception updating session total:', error);
      return false;
    }
  },

  async closeSession(sessionId: string): Promise<boolean> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, simulating session close');
      return true;
    }

    try {
      // Update session status to billed
      const { error } = await supabase
        .from('table_sessions')
        .update({
          status: 'billed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error closing session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception closing session:', error);
      return false;
    }
  },

  async getRestaurantSessions(restaurantId: string): Promise<Session[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning mock restaurant sessions');
      return [
        {
          id: 'mock-session-1',
          table_id: 'mock-table-1',
          restaurant_id: restaurantId,
          session_otp: '123456',
          status: 'active',
          total_amount: 4500,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          updated_at: new Date(),
          restaurant_tables: {
            table_number: 5,
            qr_code: 'table-5-qr-code'
          }
        },
        {
          id: 'mock-session-2',
          table_id: 'mock-table-2',
          restaurant_id: restaurantId,
          session_otp: '789012',
          status: 'billed',
          total_amount: 3200,
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          updated_at: new Date(),
          restaurant_tables: {
            table_number: 8,
            qr_code: 'table-8-qr-code'
          }
        }
      ];
    }

    try {
      const { data, error } = await supabase
        .from('table_sessions')
        .select(`
          *,
          restaurant_tables (
            table_number,
            qr_code
          )
        `)
        .eq('restaurant_id', restaurantId)
        .in('status', ['active', 'billed'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting restaurant sessions:', error);
        return [];
      }

      return (data || []).map(session => ({
        id: session.id,
        table_id: session.table_id,
        restaurant_id: session.restaurant_id,
        session_otp: session.session_otp,
        otp_expires_at: session.otp_expires_at ? new Date(session.otp_expires_at) : undefined,
        status: session.status,
        total_amount: session.total_amount,
        created_at: new Date(session.created_at),
        updated_at: new Date(session.updated_at),
        deleted_at: session.deleted_at ? new Date(session.deleted_at) : undefined,
        restaurant_tables: session.restaurant_tables
      }));
    } catch (error) {
      console.error('Exception getting restaurant sessions:', error);
      return [];
    }
  },

  async getAllSessionCustomers(): Promise<SessionCustomer[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning mock session customers');
      return [
        {
          id: 'mock-customer-1',
          session_id: 'mock-session-1',
          name: 'John Doe',
          phone: '+1234567890',
          joined_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: 'mock-customer-2',
          session_id: 'mock-session-1',
          name: 'Jane Smith',
          phone: '+0987654321',
          joined_at: new Date(Date.now() - 1 * 60 * 60 * 1000)
        },
        {
          id: 'mock-customer-3',
          session_id: 'mock-session-2',
          name: 'Bob Johnson',
          phone: '+1122334455',
          joined_at: new Date(Date.now() - 30 * 60 * 1000)
        }
      ];
    }

    try {
      const { data, error } = await supabase
        .from('session_customers')
        .select('*')
        .is('deleted_at', null)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error getting all session customers:', error);
        return [];
      }

      return (data || []).map(customer => ({
        id: customer.id,
        session_id: customer.session_id,
        name: customer.name,
        phone: customer.phone,
        joined_at: new Date(customer.joined_at),
        deleted_at: customer.deleted_at ? new Date(customer.deleted_at) : undefined
      }));
    } catch (error) {
      console.error('Exception getting all session customers:', error);
      return [];
    }
  },

  async getAllActiveSessions(): Promise<Session[]> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, returning mock active sessions');
      return [
        {
          id: 'mock-session-1',
          table_id: 'mock-table-1',
          restaurant_id: 'mock-restaurant-1',
          session_otp: '123456',
          status: 'active',
          total_amount: 4500,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          updated_at: new Date(),
          restaurant_tables: {
            table_number: 5,
            qr_code: 'table-5-qr-code'
          }
        },
        {
          id: 'mock-session-2',
          table_id: 'mock-table-2',
          restaurant_id: 'mock-restaurant-1',
          session_otp: '789012',
          status: 'active',
          total_amount: 3200,
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          updated_at: new Date(),
          restaurant_tables: {
            table_number: 8,
            qr_code: 'table-8-qr-code'
          }
        }
      ];
    }

    try {
      const { data, error } = await supabase
        .from('table_sessions')
        .select(`
          *,
          restaurant_tables (
            table_number,
            qr_code
          )
        `)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting all active sessions:', error);
        return [];
      }

      return (data || []).map(session => ({
        id: session.id,
        table_id: session.table_id,
        restaurant_id: session.restaurant_id,
        session_otp: session.session_otp,
        otp_expires_at: session.otp_expires_at ? new Date(session.otp_expires_at) : undefined,
        status: session.status,
        total_amount: session.total_amount,
        created_at: new Date(session.created_at),
        updated_at: new Date(session.updated_at),
        deleted_at: session.deleted_at ? new Date(session.deleted_at) : undefined,
        restaurant_tables: session.restaurant_tables
      }));
    } catch (error) {
      console.error('Exception getting all active sessions:', error);
      return [];
    }
  }
};