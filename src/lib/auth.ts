import { supabase } from './supabase'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { DatabaseUser } from './database'

export interface AuthSession {
  id: string
  user_id: string
  restaurant_id: string
  session_token: string
  expires_at: string
  created_at: string
  last_activity: string
}

export interface AuthUser extends DatabaseUser {
  restaurant_name?: string
  kitchen_station_name?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface PasswordResetRequest {
  email: string
  restaurant_id?: string
}

export interface PasswordResetConfirm {
  token: string
  new_password: string
}

// Session duration: 8 hours for regular sessions, 30 days for "remember me"
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

// Account locking settings
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

class AuthService {
  // Generate secure session token
  private generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  // Generate secure reset token
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  // Hash password using bcrypt
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  // Verify password against hash
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  // Check if account is locked
  private isAccountLocked(user: DatabaseUser): boolean {
    if (!user.locked_until) return false
    return new Date(user.locked_until) > new Date()
  }

  // Increment login attempts and lock account if necessary
  private async incrementLoginAttempts(userId: string): Promise<void> {
    const { data: user } = await supabase
      .from('users')
      .select('login_attempts')
      .eq('id', userId)
      .single()

    if (!user) return

    const newAttempts = (user.login_attempts || 0) + 1
    const updateData: any = { login_attempts: newAttempts }

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.locked_until = new Date(Date.now() + LOCKOUT_DURATION).toISOString()
    }

    await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
  }

  // Reset login attempts after successful login
  private async resetLoginAttempts(userId: string): Promise<void> {
    await supabase
      .from('users')
      .update({
        login_attempts: 0,
        locked_until: null,
        last_login: new Date().toISOString()
      })
      .eq('id', userId)
  }

  // Create new session
  private async createSession(user: DatabaseUser, rememberMe: boolean = false): Promise<AuthSession> {
    const sessionToken = this.generateSessionToken()
    const duration = rememberMe ? REMEMBER_ME_DURATION : SESSION_DURATION
    const expiresAt = new Date(Date.now() + duration)

    const { data: session, error } = await supabase
      .from('auth_sessions')
      .insert({
        user_id: user.id,
        restaurant_id: user.restaurant_id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        last_activity: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return session
  }

  // Clean up expired sessions
  private async cleanupExpiredSessions(): Promise<void> {
    await supabase
      .from('auth_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
  }

  // Staff login with email and password
  async login(credentials: LoginCredentials, rememberMe: boolean = false): Promise<{ user: AuthUser; session: AuthSession }> {
    const { email, password } = credentials

    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // Clean up expired sessions first
    await this.cleanupExpiredSessions()

    // Find user by email (staff only - customers don't have email/password)
    console.log('🔍 Looking for user with email:', email.toLowerCase().trim())
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        restaurants!inner(name),
        kitchen_stations(name)
      `)
      .eq('email', email.toLowerCase().trim())
      .in('role', ['admin', 'owner', 'waiter', 'chef']) // Only staff roles can login
      .single()

    console.log('🔍 User query result:', { 
      found: user ? 'YES' : 'NO', 
      error: userError?.message,
      userCount: user ? 1 : 0
    })
    
    if (user) {
      console.log('👤 Found user details:', {
        id: user.id,
        email: user.email,
        role: user.role,
        has_password_hash: !!user.password_hash,
        password_hash_length: user.password_hash ? user.password_hash.length : 0,
        is_active: user.is_active,
        restaurant_id: user.restaurant_id
      })
    }

    if (userError || !user) {
      console.log('❌ User lookup failed:', userError?.message || 'User not found')
      throw new Error('Invalid email or password')
    }

    // Check if account is locked
    if (this.isAccountLocked(user)) {
      const lockedUntil = new Date(user.locked_until!)
      throw new Error(`Account is locked until ${lockedUntil.toLocaleString()}`)
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated. Please contact your administrator.')
    }

    // Verify password
    if (!user.password_hash) {
      console.log('❌ No password hash found for user - account not properly configured')
      throw new Error('Account not properly configured. Please contact your administrator.')
    }

    console.log('🔐 Verifying password...')
    console.log('🔐 Password provided:', password ? 'YES' : 'NO', 'Length:', password?.length || 0)
    console.log('🔐 Hash in database:', user.password_hash ? 'YES' : 'NO', 'Length:', user.password_hash?.length || 0)
    
    const isValidPassword = await this.verifyPassword(password, user.password_hash)
    console.log('🔐 Password verification result:', isValidPassword ? 'VALID' : 'INVALID')
    
    if (!isValidPassword) {
      console.log('❌ Password verification failed')
      await this.incrementLoginAttempts(user.id)
      throw new Error('Invalid email or password')
    }
    
    console.log('✅ Password verification successful')

    // Reset login attempts and update last login
    await this.resetLoginAttempts(user.id)

    // Create session
    const session = await this.createSession(user, rememberMe)

    // Return user with restaurant and kitchen station info
    const authUser: AuthUser = {
      ...user,
      restaurant_name: user.restaurants?.name,
      kitchen_station_name: user.kitchen_stations?.name
    }

    return { user: authUser, session }
  }

  // Validate session token
  async validateSession(sessionToken: string): Promise<{ user: AuthUser; session: AuthSession } | null> {
    if (!sessionToken) return null

    // Find session
    const { data: session, error: sessionError } = await supabase
      .from('auth_sessions')
      .select(`
        *,
        users!inner(
          *,
          restaurants!inner(name),
          kitchen_stations(name)
        )
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return null
    }

    // Check if user is still active
    if (!session.users.is_active) {
      await this.logout(sessionToken)
      return null
    }

    // Update last activity
    await supabase
      .from('auth_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', session.id)

    // Return user with restaurant and kitchen station info
    const authUser: AuthUser = {
      ...session.users,
      restaurant_name: session.users.restaurants?.name,
      kitchen_station_name: session.users.kitchen_stations?.name
    }

    return { user: authUser, session }
  }

  // Logout and clean up session
  async logout(sessionToken: string): Promise<void> {
    if (!sessionToken) return

    await supabase
      .from('auth_sessions')
      .delete()
      .eq('session_token', sessionToken)
  }

  // Request password reset
  async requestPasswordReset(request: PasswordResetRequest): Promise<void> {
    const { email, restaurant_id } = request

    // Find user by email
    let query = supabase
      .from('users')
      .select('id, name, restaurant_id, is_active')
      .eq('email', email.toLowerCase().trim())
      .in('role', ['admin', 'owner', 'waiter', 'chef'])

    if (restaurant_id) {
      query = query.eq('restaurant_id', restaurant_id)
    }

    const { data: user, error: userError } = await query.single()

    if (userError || !user) {
      // Don't reveal if email exists for security
      return
    }

    if (!user.is_active) {
      // Don't send reset for inactive accounts
      return
    }

    // Generate reset token
    const resetToken = this.generateResetToken()
    const expiresAt = new Date(Date.now() + (60 * 60 * 1000)) // 1 hour

    // Store reset token
    await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        restaurant_id: user.restaurant_id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      })

    // TODO: Send email with reset link
    // For now, log the token (in production, this would be sent via email)
    console.log(`Password reset token for ${email}: ${resetToken}`)
    console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`)
  }

  // Confirm password reset with token
  async confirmPasswordReset(confirm: PasswordResetConfirm): Promise<void> {
    const { token, new_password } = confirm

    if (!token || !new_password) {
      throw new Error('Token and new password are required')
    }

    if (new_password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    // Find valid reset token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !resetToken) {
      throw new Error('Invalid or expired reset token')
    }

    // Hash new password
    const passwordHash = await this.hashPassword(new_password)

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        login_attempts: 0,
        locked_until: null
      })
      .eq('id', resetToken.user_id)

    if (updateError) {
      throw new Error('Failed to update password')
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id)

    // Invalidate all existing sessions for this user
    await supabase
      .from('auth_sessions')
      .delete()
      .eq('user_id', resetToken.user_id)
  }

  // Get user's role-based dashboard URL
  getDashboardUrl(role: string): string {
    switch (role) {
      case 'owner':
        return '/owner/dashboard'
      case 'admin':
        return '/admin/dashboard'
      case 'waiter':
        return '/waiter/dashboard'
      case 'chef':
        return '/kitchen/dashboard'
      default:
        return '/admin/dashboard'
    }
  }

  // Create new staff user (for admin/owner use)
  async createStaffUser(userData: {
    name: string
    email: string
    phone: string
    role: 'admin' | 'owner' | 'waiter' | 'chef'
    restaurant_id: string
    language?: string
    kitchen_station_id?: string
    temporary_password?: string
  }): Promise<DatabaseUser> {
    const {
      name,
      email,
      phone,
      role,
      restaurant_id,
      language = 'en',
      kitchen_station_id,
      temporary_password
    } = userData

    // Generate temporary password if not provided
    const tempPassword = temporary_password || crypto.randomBytes(8).toString('hex')
    const passwordHash = await this.hashPassword(tempPassword)

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email: email.toLowerCase().trim(),
        phone,
        role,
        restaurant_id,
        language,
        kitchen_station_id,
        password_hash: passwordHash,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`)
    }

    // TODO: Send invitation email with temporary password
    console.log(`Staff user created: ${email}`)
    console.log(`Temporary password: ${tempPassword}`)
    console.log(`They should change this password on first login`)

    return user
  }
}

export const authService = new AuthService()