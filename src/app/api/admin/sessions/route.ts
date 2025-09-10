import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/authMiddleware';
import { supabase } from '../../../../lib/supabase';

// GET /api/admin/sessions - Get all sessions (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await requireAuth(request, ['admin', 'owner']);
    
    let user = null;
    let restaurantId = null;
    
    if ('error' in authResult) {
      console.log('❌ Authentication failed:', authResult.error.status);
      
      // Check if this is a development environment and allow bypass
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  DEVELOPMENT: Bypassing authentication for admin sessions');
        
        // Use the actual restaurant ID from the database for development
        restaurantId = '0534f507-9ea4-40e9-8b05-4de784984f79';
      } else {
        return authResult.error;
      }
    } else {
      user = authResult.user;
      restaurantId = user.restaurant_id;
    }

    // Get real sessions from database for today only
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
    
    const { data: sessions, error } = await supabase
      .from('table_sessions')
      .select(`
        *,
        restaurant_tables (
          table_number,
          qr_code
        )
      `)
      .eq('restaurant_id', restaurantId)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)
      .is('deleted_at', null)
      .order('status', { ascending: false }) // Active sessions first (active > billed > cleared)
      .order('created_at', { ascending: false }); // Then by creation time

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch sessions',
        error: error.message
      }, { status: 500 });
    }

    const activeSessions = sessions?.filter(s => s.status === 'active') || [];
    const totalRevenue = sessions?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      message: 'Sessions retrieved successfully',
      data: {
        sessions: sessions || [],
        totalSessions: sessions?.length || 0,
        activeSessions: activeSessions.length,
        totalRevenue
      }
    });

  } catch (error: any) {
    console.error('Get sessions error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
} 