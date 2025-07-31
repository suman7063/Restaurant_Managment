import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { authService } from '../../../../lib/auth';

// POST - Assign waiter to table(s)
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
    const { waiterId, tableIds, restaurant_id } = body;

    // Validate required fields
    if (!waiterId || !tableIds || !Array.isArray(tableIds) || !restaurant_id) {
      return NextResponse.json({ message: 'Missing required fields: waiterId, tableIds (array), restaurant_id' }, { status: 400 });
    }

    // Verify user has access to this restaurant
    if (result.user.restaurant_id !== restaurant_id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Verify waiter exists and belongs to the restaurant
    const { data: waiter, error: waiterError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', waiterId)
      .eq('role', 'waiter')
      .eq('restaurant_id', restaurant_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (waiterError || !waiter) {
      return NextResponse.json({ message: 'Waiter not found or inactive' }, { status: 404 });
    }

    // Verify all tables exist and belong to the restaurant
    const { data: tables, error: tablesError } = await supabase
      .from('restaurant_tables')
      .select('id, table_number')
      .in('id', tableIds)
      .eq('restaurant_id', restaurant_id)
      .is('deleted_at', null);

    if (tablesError || !tables || tables.length !== tableIds.length) {
      return NextResponse.json({ message: 'One or more tables not found' }, { status: 404 });
    }

    // Update table assignments
    const { error: updateError } = await supabase
      .from('restaurant_tables')
      .update({ 
        waiter_id: waiterId,
        updated_at: new Date().toISOString()
      })
      .in('id', tableIds);

    if (updateError) {
      console.error('Error assigning waiter to tables:', updateError);
      return NextResponse.json({ message: 'Failed to assign waiter to tables' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Waiter ${waiter.name} assigned to ${tables.length} table(s)`,
      waiter: waiter,
      tables: tables
    });

  } catch (error: any) {
    console.error('Error in POST /api/admin/assign-waiter:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Unassign waiter from table(s)
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
    const tableIds = searchParams.get('tableIds')?.split(',');
    const restaurant_id = searchParams.get('restaurant_id');

    if (!tableIds || !restaurant_id) {
      return NextResponse.json({ message: 'Missing required parameters: tableIds, restaurant_id' }, { status: 400 });
    }

    // Verify user has access to this restaurant
    if (result.user.restaurant_id !== restaurant_id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Verify tables exist and belong to the restaurant
    const { data: tables, error: tablesError } = await supabase
      .from('restaurant_tables')
      .select('id, table_number')
      .in('id', tableIds)
      .eq('restaurant_id', restaurant_id)
      .is('deleted_at', null);

    if (tablesError || !tables || tables.length === 0) {
      return NextResponse.json({ message: 'Tables not found' }, { status: 404 });
    }

    // Unassign waiter from tables
    const { error: updateError } = await supabase
      .from('restaurant_tables')
      .update({ 
        waiter_id: null,
        updated_at: new Date().toISOString()
      })
      .in('id', tableIds);

    if (updateError) {
      console.error('Error unassigning waiter from tables:', updateError);
      return NextResponse.json({ message: 'Failed to unassign waiter from tables' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Waiter unassigned from ${tables.length} table(s)`,
      tables: tables
    });

  } catch (error: any) {
    console.error('Error in DELETE /api/admin/assign-waiter:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}