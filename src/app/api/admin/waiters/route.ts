import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '../../../../lib/supabase';
import { authService } from '../../../../lib/auth';
import bcrypt from 'bcryptjs';

// GET - Fetch waiters for a restaurant
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

    // Verify user is admin or owner
    if (!['admin', 'owner'].includes(result.user.role)) {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (!restaurantId) {
      return NextResponse.json({ message: 'Restaurant ID is required' }, { status: 400 });
    }

    // Verify user has access to this restaurant
    if (result.user.restaurant_id !== restaurantId) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Fetch waiters with their table assignments
    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        phone,
        is_active,
        preferred_language,
        created_at,
        updated_at,
        assigned_tables:restaurant_tables(
          id,
          table_number,
          status
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('role', 'waiter')
      .is('deleted_at', null);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: waiters, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching waiters:', error);
      return NextResponse.json({ message: 'Failed to fetch waiters' }, { status: 500 });
    }

    // Transform data to include table count and status
    const transformedWaiters = (waiters || []).map(waiter => ({
      id: waiter.id,
      name: waiter.name,
      email: waiter.email,
      phone: waiter.phone,
      is_active: waiter.is_active,
      preferred_language: waiter.preferred_language,
      tableCount: waiter.assigned_tables?.length || 0,
      assignedTables: waiter.assigned_tables || [],
      created_at: waiter.created_at,
      updated_at: waiter.updated_at,
      status: waiter.is_active ? 'active' : 'inactive'
    }));

    return NextResponse.json({ success: true, waiters: transformedWaiters });

  } catch (error: any) {
    console.error('Error in GET /api/admin/waiters:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new waiter
export async function POST(request: NextRequest) {
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

    // Verify user is admin or owner
    if (!['admin', 'owner'].includes(result.user.role)) {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, password, restaurant_id, preferred_language } = body;

    // Validate required fields
    if (!name || !email || !password || !restaurant_id) {
      return NextResponse.json({ message: 'Missing required fields: name, email, password, restaurant_id' }, { status: 400 });
    }

    // Verify user has access to this restaurant
    if (result.user.restaurant_id !== restaurant_id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create the waiter using admin client to bypass RLS
    const { data: waiter, error } = await supabaseAdmin
      .from('users')
      .insert([{
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim(),
        password_hash,
        role: 'waiter',
        restaurant_id,
        preferred_language: preferred_language || 'en',
        is_active: true
      }])
      .select(`
        id,
        name,
        email,
        phone,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error creating waiter:', error);
      return NextResponse.json({ message: `Failed to create waiter: ${error.message}` }, { status: 500 });
    }

    // Transform the response
    const transformedWaiter = {
      id: waiter.id,
      name: waiter.name,
      email: waiter.email,
      phone: waiter.phone,
      is_active: waiter.is_active,
      tableCount: 0,
      assignedTables: [],
      created_at: waiter.created_at,
      updated_at: waiter.updated_at,
      status: 'active'
    };

    return NextResponse.json({ success: true, waiter: transformedWaiter });

  } catch (error: any) {
    console.error('Error in POST /api/admin/waiters:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a waiter
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
    const { id, password, ...fields } = body;

    if (!id) {
      return NextResponse.json({ message: 'Missing waiter id' }, { status: 400 });
    }

    // Fetch waiter to verify restaurant
    const { data: waiter, error: waiterUpdateError } = await supabase
      .from('users')
      .select('restaurant_id, role')
      .eq('id', id)
      .eq('role', 'waiter')
      .single();

    if (waiterUpdateError || !waiter) {
      return NextResponse.json({ message: 'Waiter not found' }, { status: 404 });
    }

    if (waiter.restaurant_id !== result.user.restaurant_id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // If password is being updated, hash it
    let updateFields = { ...fields };
    if (password) {
      const saltRounds = 12;
      updateFields.password_hash = await bcrypt.hash(password, saltRounds);
    }

    // Clean email if provided
    if (updateFields.email) {
      updateFields.email = updateFields.email.toLowerCase().trim();
    }

    // Clean other fields
    if (updateFields.name) {
      updateFields.name = updateFields.name.trim();
    }
    if (updateFields.phone) {
      updateFields.phone = updateFields.phone.trim();
    }

    // If making waiter inactive, unassign them from all tables first
    if (updateFields.is_active === false) {
      const { error: unassignError } = await supabaseAdmin
        .from('restaurant_tables')
        .update({ waiter_id: null })
        .eq('waiter_id', id);
      
      if (unassignError) {
        console.error('Error unassigning tables:', unassignError);
        return NextResponse.json({ 
          message: 'Failed to unassign tables from waiter', 
          error: unassignError.message 
        }, { status: 500 });
      }
    }
    
    // Use admin client to bypass RLS policies for admin operations
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateFields)
      .eq('id', id)
      .select(`
        id,
        name,
        email,
        phone,
        is_active,
        created_at,
        updated_at
      `);

    if (error) {
      console.error('Database error updating waiter:', error);
      return NextResponse.json({ 
        message: 'Failed to update waiter', 
        error: error.message 
      }, { status: 500 });
    }

    // Check if any rows were updated
    if (!data || data.length === 0) {
      return NextResponse.json({ 
        message: 'Waiter not found or no changes made' 
      }, { status: 404 });
    }

    // Return the first (and should be only) updated waiter
    return NextResponse.json({ success: true, waiter: data[0] });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Soft delete a waiter
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Missing waiter id' }, { status: 400 });
    }

    // Fetch waiter to verify restaurant
    const { data: waiter, error: waiterDeleteError } = await supabase
      .from('users')
      .select('restaurant_id, role')
      .eq('id', id)
      .eq('role', 'waiter')
      .single();

    if (waiterDeleteError || !waiter) {
      return NextResponse.json({ message: 'Waiter not found' }, { status: 404 });
    }

    if (waiter.restaurant_id !== result.user.restaurant_id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Unassign tables first
    await supabase
      .from('restaurant_tables')
      .update({ waiter_id: null })
      .eq('waiter_id', id);

    // Soft delete the waiter
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ message: 'Failed to delete waiter' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Waiter deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}