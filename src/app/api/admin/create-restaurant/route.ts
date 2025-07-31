import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Create a default restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name: 'Sample Restaurant',
        address: '123 Main Street',
        city: 'Sample City',
        state: 'Sample State',
        phone: '+1234567890',
        email: 'info@samplerestaurant.com',
        cuisine_type: 'Indian',
        languages: ['en'],
        subscription_plan: 'starter',
        subscription_status: 'active'
      })
      .select()
      .single();

    if (restaurantError) {
      console.error('Error creating restaurant:', restaurantError);
      return NextResponse.json(
        { error: 'Failed to create restaurant' },
        { status: 500 }
      );
    }

    // Create a default admin user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        name: 'Test Admin',
        email: 'admin@samplerestaurant.com',
        phone: '+1234567890',
        role: 'admin',
        language: 'en',
        restaurant_id: restaurant.id,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      restaurant,
      user
    });

  } catch (error) {
    console.error('Error in create-restaurant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 