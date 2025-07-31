import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '../../../../lib/supabase';
import { authService } from '../../../../lib/auth';
import bcrypt from 'bcryptjs';

// GET - Fetch chefs for a restaurant
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

    // Fetch chefs with their kitchen station assignments
    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        phone,
        is_active,
        created_at,
        updated_at,
        kitchen_station:kitchen_stations(
          id,
          name,
          cuisine_types
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('role', 'chef')
      .is('deleted_at', null);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: chefs, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching chefs:', error);
      return NextResponse.json({ message: 'Failed to fetch chefs' }, { status: 500 });
    }

    // Transform data to include kitchen station info
    const transformedChefs = (chefs || []).map(chef => {
      // Handle kitchen_station which might be null, array, or object
      const kitchenStation = Array.isArray(chef.kitchen_station) 
        ? chef.kitchen_station[0] 
        : chef.kitchen_station;
      
      return {
        id: chef.id,
        name: chef.name,
        email: chef.email,
        phone: chef.phone,
        is_active: chef.is_active,
        kitchen_station: kitchenStation,
        kitchen_station_name: kitchenStation?.name || 'Unassigned',
        specialty: kitchenStation?.cuisine_types?.join(', ') || 'General',
        created_at: chef.created_at,
        updated_at: chef.updated_at,
        status: chef.is_active ? 'active' : 'inactive'
      };
    });

    return NextResponse.json({ success: true, chefs: transformedChefs });

  } catch (error: any) {
    console.error('Error in GET /api/admin/chefs:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new chef
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
    const { name, email, phone, password, kitchen_station_id, restaurant_id } = body;

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

    // If kitchen_station_id is provided, verify it belongs to the restaurant
    if (kitchen_station_id) {
      const { data: kitchenStation } = await supabase
        .from('kitchen_stations')
        .select('id')
        .eq('id', kitchen_station_id)
        .eq('restaurant_id', restaurant_id)
        .is('deleted_at', null)
        .single();

      if (!kitchenStation) {
        return NextResponse.json({ message: 'Invalid kitchen station' }, { status: 400 });
      }
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create the chef using admin client to bypass RLS
    const { data: chef, error } = await supabaseAdmin
      .from('users')
      .insert([{
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim(),
        password_hash,
        role: 'chef',
        restaurant_id,
        kitchen_station_id: kitchen_station_id || null,
        is_active: true
      }])
      .select(`
        id,
        name,
        email,
        phone,
        is_active,
        created_at,
        updated_at,
        kitchen_station:kitchen_stations(
          id,
          name,
          cuisine_types
        )
      `)
      .single();

    if (error) {
      console.error('Error creating chef:', error);
      return NextResponse.json({ message: `Failed to create chef: ${error.message}` }, { status: 500 });
    }

    // Transform the response
    const kitchenStation = Array.isArray(chef.kitchen_station) 
      ? chef.kitchen_station[0] 
      : chef.kitchen_station;
    
    const transformedChef = {
      id: chef.id,
      name: chef.name,
      email: chef.email,
      phone: chef.phone,
      is_active: chef.is_active,
      kitchen_station: kitchenStation,
      kitchen_station_name: kitchenStation?.name || 'Unassigned',
      specialty: kitchenStation?.cuisine_types?.join(', ') || 'General',
      created_at: chef.created_at,
      updated_at: chef.updated_at,
      status: 'active'
    };

    return NextResponse.json({ success: true, chef: transformedChef });

  } catch (error: any) {
    console.error('Error in POST /api/admin/chefs:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a chef
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
      return NextResponse.json({ message: 'Missing chef id' }, { status: 400 });
    }

    // Fetch chef to verify restaurant
    const { data: chef, error: chefUpdateError } = await supabase
      .from('users')
      .select('restaurant_id, role')
      .eq('id', id)
      .eq('role', 'chef')
      .single();

    if (chefUpdateError || !chef) {
      return NextResponse.json({ message: 'Chef not found' }, { status: 404 });
    }

    if (chef.restaurant_id !== result.user.restaurant_id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // If kitchen_station_id is being updated, verify it belongs to the restaurant
    if (fields.kitchen_station_id) {
      const { data: kitchenStation } = await supabase
        .from('kitchen_stations')
        .select('id')
        .eq('id', fields.kitchen_station_id)
        .eq('restaurant_id', result.user.restaurant_id)
        .is('deleted_at', null)
        .single();

      if (!kitchenStation) {
        return NextResponse.json({ message: 'Invalid kitchen station' }, { status: 400 });
      }
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

    // Update chef
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
        updated_at,
        kitchen_station:kitchen_stations(
          id,
          name,
          cuisine_types
        )
      `);

    if (error) {
      console.error('Database error updating chef:', error);
      return NextResponse.json({ 
        message: 'Failed to update chef', 
        error: error.message 
      }, { status: 500 });
    }

    // Check if any rows were updated
    if (!data || data.length === 0) {
      return NextResponse.json({ 
        message: 'Chef not found or no changes made' 
      }, { status: 404 });
    }

    // Transform response
    const updatedChef = data[0];
    const kitchenStation = Array.isArray(updatedChef.kitchen_station) 
      ? updatedChef.kitchen_station[0] 
      : updatedChef.kitchen_station;
    
    const transformedChef = {
      id: updatedChef.id,
      name: updatedChef.name,
      email: updatedChef.email,
      phone: updatedChef.phone,
      is_active: updatedChef.is_active,
      kitchen_station: kitchenStation,
      kitchen_station_name: kitchenStation?.name || 'Unassigned',
      specialty: kitchenStation?.cuisine_types?.join(', ') || 'General',
      created_at: updatedChef.created_at,
      updated_at: updatedChef.updated_at,
      status: updatedChef.is_active ? 'active' : 'inactive'
    };

    return NextResponse.json({ success: true, chef: transformedChef });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Soft delete a chef
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
      return NextResponse.json({ message: 'Missing chef id' }, { status: 400 });
    }

    // Fetch chef to verify restaurant
    const { data: chef, error: chefDeleteError } = await supabase
      .from('users')
      .select('restaurant_id, role')
      .eq('id', id)
      .eq('role', 'chef')
      .single();

    if (chefDeleteError || !chef) {
      return NextResponse.json({ message: 'Chef not found' }, { status: 404 });
    }

    if (chef.restaurant_id !== result.user.restaurant_id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Soft delete the chef
    const { error } = await supabaseAdmin
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ message: 'Failed to delete chef' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Chef deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}