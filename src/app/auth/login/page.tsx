"use client"
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { generateCSRFToken } from '../../../lib/authMiddleware'
import { Input } from '../../../components/ui'

// Client-side version of getDashboardUrl
function getDashboardUrl(role: string): string {
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

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [csrfToken, setCsrfToken] = useState<string>(() => {
    // Only generate CSRF token on client side to prevent hydration mismatch
    if (typeof window !== 'undefined') {
      return generateCSRFToken()
    }
    return ''
  })
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password')
      }

      console.log('Starting login process...')

      // Call login API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
          redirectUrl,
          csrfToken
        })
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      const result = await response.json()
      console.log('Response data:', result)

      if (!response.ok) {
        throw new Error(result.message || 'Login failed')
      }

      // Redirect to dashboard or specified URL
      const targetUrl = result.redirectUrl || getDashboardUrl(result.user.role)
      console.log('Target URL:', targetUrl)
      console.log('User role:', result.user?.role)
      console.log('About to redirect...')
      
      // Add a small delay to ensure state updates
      setTimeout(() => {
        console.log('Executing router.push...')
        router.push(targetUrl)
      }, 100)
      
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white mx-8 rounded-lg shadow-lg">
          <div className="px-4 py-8 sm:px-10">
            <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
              <h2 className="text-center text-3xl font-bold text-gray-900">
                Staff Login
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Sign in to your restaurant management account
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <Input
                type="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />

              <Input
                type="password"
                label="Password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="px-3 py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me for 30 days
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Staff Only</span>
                </div>
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>Customers don&apos;t need to login.</p>
                <p>Just scan the QR code on your table to order.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white mx-8 rounded-lg shadow-lg">
            <div className="px-4 py-8 sm:px-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}