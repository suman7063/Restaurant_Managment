import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if we can connect to Supabase
    const { data: tables, error } = await supabase
      .from('restaurant_tables')
      .select('*')
      .limit(5);

    console.log('Tables query result:', { tables, error });

    if (error) {
      return NextResponse.json({
        error: 'Supabase connection failed',
        details: error.message
      }, { status: 500 });
    }

    // Test 2: Try to find the specific table
    const { data: specificTable, error: specificError } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('qr_code', 'table-1-a4e52985-pwwc97-1754074817328')
      .single();

    console.log('Specific table query result:', { specificTable, specificError });

    return NextResponse.json({
      message: 'Supabase connection successful',
      totalTables: tables?.length || 0,
      testTable: specificTable,
      testError: specificError
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 