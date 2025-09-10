import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '../../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get all active sessions
    const sessions = await sessionService.getAllActiveSessions()
    
    if (!sessions) {
      return NextResponse.json({
        success: false,
        message: 'No active sessions found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Active sessions retrieved successfully',
      data: sessions.map(session => ({
        id: session.id,
        table_id: session.table_id,
        restaurant_id: session.restaurant_id,
        session_otp: session.session_otp,
        status: session.status,
        total_amount: session.total_amount,
        created_at: session.created_at,
        updated_at: session.updated_at,
        otp_expires_at: session.otp_expires_at
      }))
    }, { status: 200 })

  } catch (error: any) {
    console.error('Get all active sessions error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 