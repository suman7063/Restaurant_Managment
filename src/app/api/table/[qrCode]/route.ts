import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode } = await params;

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      );
    }

    // Query the table using the QR code
    const { data: table, error } = await supabase
      .from('restaurant_tables')
      .select(`
        id,
        table_number,
        qr_code,
        status,
        waiter_id,
        guests,
        revenue,
        restaurant_id,
        created_at,
        updated_at,
        restaurant:restaurants(
          id,
          name,
          address,
          phone,
          email
        )
      `)
      .eq('qr_code', qrCode)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Database error: ' + error.message },
        { status: 500 }
      );
    }

    if (!table) {
      return NextResponse.json(
        { error: 'Table not found or invalid QR code' },
        { status: 404 }
      );
    }

    // Check if table is available
    if (table.status === 'cleaning' || table.status === 'reserved') {
      return NextResponse.json(
        { error: 'Table is currently not available' },
        { status: 400 }
      );
    }

    // Return table information
    return NextResponse.json({
      table: {
        id: table.id,
        table_number: table.table_number,
        status: table.status,
        qr_code: table.qr_code,
        restaurant_id: table.restaurant_id,
        waiter_id: table.waiter_id,
        guests: table.guests,
        revenue: table.revenue,
        restaurant: table.restaurant
      }
    });

  } catch (error) {
    console.error('Error fetching table by QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 