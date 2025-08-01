import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '../../../../lib/supabase';
import { authService } from '../../../../lib/auth';

// GET - Fetch menu items for a restaurant
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
    const includeUnavailable = searchParams.get('includeUnavailable') === 'true';

    if (!restaurantId) {
      return NextResponse.json({ message: 'Restaurant ID is required' }, { status: 400 });
    }

    // Verify user has access to this restaurant
    if (result.user.restaurant_id !== restaurantId) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Fetch menu items
    let query = supabase
      .from('menu_items')
      .select(`
        id,
        name,
        description,
        price,
        category_id,
        prep_time,
        rating,
        image,
        popular,
        available,
        kitchen_station_id,
        is_veg,
        cuisine_type,
        customizations,
        add_ons,
        created_at,
        updated_at,
        restaurant_menu_categories!inner(name)
      `)
      .eq('restaurant_id', restaurantId)
      .is('deleted_at', null);

    if (!includeUnavailable) {
      query = query.eq('available', true);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching menu items:', error);
      return NextResponse.json({ message: 'Failed to fetch menu items' }, { status: 500 });
    }

    // Transform the data to match our MenuItem interface
    const menuItems = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category_id: item.category_id,
      category: item.restaurant_menu_categories,
      prepTime: item.prep_time,
      rating: item.rating,
      image: item.image || '',
      popular: item.popular || false,
      available: item.available,
      kitchen_stations: [], // Legacy field - we now use kitchen_station_id
      is_veg: item.is_veg || false,
      cuisine_type: item.cuisine_type || 'Indian',
      customizations: item.customizations || [],
      add_ons: item.add_ons || []
    }));

    return NextResponse.json({ success: true, data: menuItems });

  } catch (error: any) {
    console.error('Error in GET /api/admin/menu-items:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new menu item
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
    const {
      name,
      description,
      price,
      category_id,
      prep_time,
      image,
      popular = false,
      available = true,
      kitchen_station_id,
      is_veg = false,
      cuisine_type = 'Indian',
      customizations = [],
      add_ons = [],
      restaurant_id
    } = body;

    // Validate required fields
    if (!name || !description || !category_id || !price || !prep_time || !restaurant_id) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Verify user has access to this restaurant
    if (result.user.restaurant_id !== restaurant_id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Validate price and prep_time are positive numbers
    if (price <= 0 || prep_time <= 0) {
      return NextResponse.json({ message: 'Price and prep time must be positive numbers' }, { status: 400 });
    }

    // Create the menu item using admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .insert([{
        name,
        description,
        price: Math.round(price), // Ensure price is an integer (cents)
        category_id,
        prep_time,
        image,
        popular,
        available,
        kitchen_station_id,
        is_veg,
        cuisine_type,
        customizations,
        add_ons,
        restaurant_id,
        rating: 0 // Default rating
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating menu item:', error);
      return NextResponse.json({ message: 'Failed to create menu item' }, { status: 500 });
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
    console.error('Error in POST /api/admin/menu-items:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}