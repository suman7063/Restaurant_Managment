import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    console.log('Testing menu items for restaurant:', restaurantId);
    
    // Test 1: Check all menu items
    const { data: allItems, error: allError } = await supabase
      .from('menu_items')
      .select('*')
      .limit(5);

    console.log('All menu items:', { allItems, allError });

    // Test 2: Check menu items for specific restaurant
    let restaurantItems = null;
    let restaurantError = null;
    
    if (restaurantId) {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .is('deleted_at', null);

      restaurantItems = data;
      restaurantError = error;
    }

    console.log('Restaurant menu items:', { restaurantItems, restaurantError });

    return NextResponse.json({
      message: 'Menu items test',
      allItems: allItems?.length || 0,
      allError: allError?.message,
      restaurantItems: restaurantItems?.length || 0,
      restaurantError: restaurantError?.message,
      sampleItems: allItems?.slice(0, 2) || []
    });

  } catch (error) {
    console.error('Test menu API error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 