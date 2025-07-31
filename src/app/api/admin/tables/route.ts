import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '../../../../lib/supabase';
import { authService } from '../../../../lib/auth';

// GET - Fetch tables for a restaurant
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const sessionToken = request.cookies.get('auth_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const result = await authService.validateSession(sessionToken);
    if (!result) {
      return NextResponse.json({ message: 'Invalid or expired session' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ message: 'Restaurant ID is required' }, { status: 400 });
    }

    // Verify user has access to this restaurant
    if (result.user.restaurant_id !== restaurantId) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Fetch tables using service role key for admin operations
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
      .order('table_number', { ascending: true });

    if (error) {
      console.error('Error fetching tables:', error);
      return NextResponse.json({ message: 'Failed to fetch tables' }, { status: 500 });
    }

    // Transform the data to match our Table interface
    const tables = (data || []).map((table: any) => {
      const waiter = table.waiter;
      return {
        id: table.id,
        table_number: table.table_number,
        status: table.status,
        waiter_id: table.waiter_id || undefined,
        waiter_name: waiter?.name || undefined,
        guests: table.guests || 0,
        revenue: table.revenue || 0,
        qr_code: table.qr_code,
        current_orders: [], // This will be populated separately if needed
        created_at: new Date(table.created_at),
        updated_at: new Date(table.updated_at)
      };
    });

    return NextResponse.json({ success: true, tables });

  } catch (error: any) {
    console.error('Error in GET /api/admin/tables:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new table
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const sessionToken = request.cookies.get('auth_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const result = await authService.validateSession(sessionToken);
    if (!result) {
      console.error('Session validation failed for token:', sessionToken);
      return NextResponse.json({ message: 'Invalid or expired session' }, { status: 401 });
    }

    console.log('User authenticated:', result.user.name, 'Role:', result.user.role, 'Restaurant:', result.user.restaurant_id);

    // Verify user is admin or owner
    if (!['admin', 'owner'].includes(result.user.role)) {
      console.error('Insufficient permissions for user:', result.user.role);
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { table_number, qr_code, restaurant_id, status = 'available', guests = 0, revenue = 0 } = body;

    // Validate required fields
    if (!table_number || !qr_code || !restaurant_id) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Verify user has access to this restaurant
    if (result.user.restaurant_id !== restaurant_id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Check if table number already exists
    const { data: existingTable } = await supabase
      .from('restaurant_tables')
      .select('id')
      .eq('restaurant_id', restaurant_id)
      .eq('table_number', table_number)
      .single();

    if (existingTable) {
      return NextResponse.json({ message: `Table ${table_number} already exists` }, { status: 409 });
    }

    // Create the table using admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('restaurant_tables')
      .insert([{
        table_number,
        qr_code,
        restaurant_id,
        status,
        guests,
        revenue
      }])
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
      console.error('Error creating table:', error);
      return NextResponse.json({ message: `Failed to create table: ${error.message}` }, { status: 500 });
    }

    // Transform the response
    const table = {
      id: data.id,
      table_number: data.table_number,
      status: data.status,
      waiter_id: data.waiter_id || undefined,
      waiter_name: data.waiter?.name || undefined,
      guests: data.guests || 0,
      revenue: data.revenue || 0,
      qr_code: data.qr_code,
      current_orders: [],
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };

    return NextResponse.json({ success: true, table });

  } catch (error: any) {
    console.error('Error in POST /api/admin/tables:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a table
export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('auth_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const result = await authService.validateSession(sessionToken);
    if (!result) {
      return NextResponse.json({ message: 'Invalid or expired session' }, { status: 401 });
    }
    if (!['admin', 'owner'].includes(result.user.role)) {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) {
      return NextResponse.json({ message: 'Missing table id' }, { status: 400 });
    }
    // Fetch table to verify restaurant
    const { data: table, error: fetchError } = await supabase
      .from('restaurant_tables')
      .select('restaurant_id')
      .eq('id', id)
      .single();
    if (fetchError || !table) {
      return NextResponse.json({ message: 'Table not found' }, { status: 404 });
    }
    if (table.restaurant_id !== result.user.restaurant_id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }
    // Update table
    const { data, error } = await supabase
      .from('restaurant_tables')
      .update(fields)
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      return NextResponse.json({ message: 'Failed to update table' }, { status: 500 });
    }
    return NextResponse.json({ success: true, table: data });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a table
export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('auth_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const result = await authService.validateSession(sessionToken);
    if (!result) {
      return NextResponse.json({ message: 'Invalid or expired session' }, { status: 401 });
    }
    if (!['admin', 'owner'].includes(result.user.role)) {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ message: 'Missing table id' }, { status: 400 });
    }
    // Fetch table to verify restaurant
    const { data: table, error: fetchError } = await supabase
      .from('restaurant_tables')
      .select('restaurant_id')
      .eq('id', id)
      .single();
    if (fetchError || !table) {
      return NextResponse.json({ message: 'Table not found' }, { status: 404 });
    }
    if (table.restaurant_id !== result.user.restaurant_id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }
    // Delete table
    const { error } = await supabase
      .from('restaurant_tables')
      .delete()
      .eq('id', id);
    if (error) {
      return NextResponse.json({ message: 'Failed to delete table' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 