import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { authService } from '../../../../lib/auth';

// GET - Fetch kitchen stations for a restaurant
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

    if (!restaurantId) {
      return NextResponse.json({ message: 'Restaurant ID is required' }, { status: 400 });
    }

    // Verify user has access to this restaurant
    if (result.user.restaurant_id !== restaurantId) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Fetch kitchen stations
    const { data: kitchenStations, error } = await supabase
      .from('kitchen_stations')
      .select(`
        id,
        name,
        description,
        cuisine_types,
        is_active
      `)
      .eq('restaurant_id', restaurantId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching kitchen stations:', error);
      return NextResponse.json({ message: 'Failed to fetch kitchen stations' }, { status: 500 });
    }

    return NextResponse.json({ success: true, kitchenStations: kitchenStations || [] });

  } catch (error: any) {
    console.error('Error in GET /api/admin/kitchen-stations:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}