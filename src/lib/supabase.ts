import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we're in development mode and environment variables are missing
const isDevelopment = process.env.NODE_ENV === 'development'
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url' && 
  supabaseAnonKey !== 'your_supabase_anon_key'

if (!hasValidCredentials) {
  if (isDevelopment) {
    console.warn('⚠️  Supabase credentials not configured.')
    console.warn('📝 To set up Supabase:')
    console.warn('1. Create a .env.local file in your project root')
    console.warn('2. Add your Supabase credentials:')
    console.warn('   NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url')
    console.warn('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key')
    console.warn('3. Restart your development server')
    console.warn('4. Run the database schema from supabase/schema.sql')
    console.warn('')
    console.warn('🔄 Running in development mode with dummy data...')
  } else {
    console.error('❌ Supabase credentials are required for production!')
    throw new Error('Missing Supabase environment variables')
  }
}

// Create Supabase client with fallback for development
export const supabase = hasValidCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = hasValidCredentials 