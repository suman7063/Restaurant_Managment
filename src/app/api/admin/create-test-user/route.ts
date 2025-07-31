import { NextRequest, NextResponse } from 'next/server'
import { authService } from '../../../../lib/auth'
import { supabase } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name = 'Test Admin', 
      email = 'admin@test.com', 
      password = '123456',
      role = 'admin',
      restaurant_name = 'Test Restaurant'
    } = body

    // First, create a test restaurant if it doesn't exist
    let restaurant_id = null
    
    // Check if restaurant exists
    const { data: existingRestaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('name', restaurant_name)
      .single()

    if (existingRestaurant) {
      restaurant_id = existingRestaurant.id
    } else {
      // Create test restaurant
      const { data: newRestaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          name: restaurant_name,
          address: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          phone: '1234567890',
          email: 'test@restaurant.com',
          cuisine_type: 'Indian',
          languages: ['en'],
          subscription_plan: 'starter',
          subscription_status: 'active'
        })
        .select('id')
        .single()

      if (restaurantError) {
        throw new Error(`Failed to create restaurant: ${restaurantError.message}`)
      }

      restaurant_id = newRestaurant.id
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existingUser) {
      return NextResponse.json({
        message: 'User already exists with this email',
        user_id: existingUser.id,
        email: existingUser.email
      }, { status: 409 })
    }

    // Create staff user with proper password hashing
    const user = await authService.createStaffUser({
      name,
      email,
      phone: '1234567890',
      role: role as 'admin' | 'owner' | 'waiter' | 'chef',
      restaurant_id,
      language: 'en',
      temporary_password: password
    })

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurant_id: user.restaurant_id
      },
      credentials: {
        email,
        password,
        role
      },
      login_url: '/auth/login'
    })

  } catch (error: any) {
    console.error('Create test user error:', error)
    
    return NextResponse.json(
      { 
        message: error.message || 'Failed to create test user',
        error: error.toString()
      },
      { status: 500 }
    )
  }
}