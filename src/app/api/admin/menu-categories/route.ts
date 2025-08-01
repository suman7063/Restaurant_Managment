import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

// GET - Fetch all menu categories for a restaurant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    const { data: categories, error } = await supabase
      .from('restaurant_menu_categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching menu categories:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch menu categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: categories || []
    });
  } catch (error) {
    console.error('Exception in GET /api/admin/menu-categories:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new menu category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, display_order, is_active, restaurant_id } = body;

    if (!name || !restaurant_id) {
      return NextResponse.json(
        { success: false, error: 'Name and restaurant_id are required' },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from('restaurant_menu_categories')
      .insert({
        name,
        description: description || null,
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
        restaurant_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating menu category:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create menu category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Exception in POST /api/admin/menu-categories:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 