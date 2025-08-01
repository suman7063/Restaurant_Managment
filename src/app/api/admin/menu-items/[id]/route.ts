import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '../../../../../lib/supabase';
import { authService } from '../../../../../lib/auth';

// PUT - Update a menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: menuItemId } = await params;
    const body = await request.json();

    // First, verify the menu item exists and belongs to the user's restaurant
    const { data: existingItem, error: fetchError } = await supabase
      .from('menu_items')
      .select('restaurant_id')
      .eq('id', menuItemId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingItem) {
      return NextResponse.json({ message: 'Menu item not found' }, { status: 404 });
    }

    // Verify user has access to this restaurant
    if (result.user.restaurant_id !== existingItem.restaurant_id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    
    // Only include fields that are provided and valid
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category_id !== undefined) updateData.category_id = body.category_id;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.popular !== undefined) updateData.popular = body.popular;
    if (body.available !== undefined) updateData.available = body.available;
    if (body.kitchen_station_id !== undefined) updateData.kitchen_station_id = body.kitchen_station_id;
    if (body.is_veg !== undefined) updateData.is_veg = body.is_veg;
    if (body.cuisine_type !== undefined) updateData.cuisine_type = body.cuisine_type;
    if (body.customizations !== undefined) updateData.customizations = body.customizations;
    if (body.add_ons !== undefined) updateData.add_ons = body.add_ons;

    // Handle price validation if provided
    if (body.price !== undefined) {
      if (body.price <= 0) {
        return NextResponse.json({ message: 'Price must be a positive number' }, { status: 400 });
      }
      updateData.price = Math.round(body.price); // Ensure price is an integer (cents)
    }

    // Handle prep_time validation if provided
    if (body.prep_time !== undefined) {
      if (body.prep_time <= 0) {
        return NextResponse.json({ message: 'Prep time must be a positive number' }, { status: 400 });
      }
      updateData.prep_time = body.prep_time;
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update the menu item using admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .update(updateData)
      .eq('id', menuItemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating menu item:', error);
      return NextResponse.json({ message: 'Failed to update menu item' }, { status: 500 });
    }

    // Transform the data to match our MenuItem interface
    const menuItem = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      price: data.price,
      category_id: data.category_id,
      prepTime: data.prep_time,
      rating: data.rating,
      image: data.image || '',
      popular: data.popular || false,
      available: data.available,
      kitchen_stations: [], // Legacy field
      is_veg: data.is_veg || false,
      cuisine_type: data.cuisine_type || 'Indian',
      customizations: data.customizations || [],
      add_ons: data.add_ons || []
    };

    return NextResponse.json({ success: true, data: menuItem });

  } catch (error: any) {
    console.error('Error in PUT /api/admin/menu-items/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Soft delete a menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: menuItemId } = await params;

    // First, verify the menu item exists and belongs to the user's restaurant
    const { data: existingItem, error: fetchError } = await supabase
      .from('menu_items')
      .select('restaurant_id, name')
      .eq('id', menuItemId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingItem) {
      return NextResponse.json({ message: 'Menu item not found' }, { status: 404 });
    }

    // Verify user has access to this restaurant
    if (result.user.restaurant_id !== existingItem.restaurant_id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Soft delete the menu item by setting deleted_at timestamp
    const { error } = await supabaseAdmin
      .from('menu_items')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', menuItemId);

    if (error) {
      console.error('Error deleting menu item:', error);
      return NextResponse.json({ message: 'Failed to delete menu item' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Menu item "${existingItem.name}" has been deleted successfully` 
    });

  } catch (error: any) {
    console.error('Error in DELETE /api/admin/menu-items/[id]:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}