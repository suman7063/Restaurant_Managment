import { NextRequest, NextResponse } from 'next/server'
import { sessionService } from '../../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get all session customers
    const customers = await sessionService.getAllSessionCustomers()
    
    if (!customers) {
      return NextResponse.json({
        success: false,
        message: 'No customers found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Session customers retrieved successfully',
      data: customers.map(customer => ({
        id: customer.id,
        session_id: customer.session_id,
        name: customer.name,
        phone: customer.phone,
        joined_at: customer.joined_at
      }))
    }, { status: 200 })

  } catch (error: any) {
    console.error('Get all session customers error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 