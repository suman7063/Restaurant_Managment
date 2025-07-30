"use client"
import { useState } from 'react'
import { testSupabaseConnection, testUsersTable, testCreateUser } from '../../lib/database'

export default function DebugPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(true)
    try {
      const result = await testFunction()
      setResults(prev => ({ ...prev, [testName]: result }))
    } catch (error) {
      setResults(prev => ({ ...prev, [testName]: { success: false, error: error instanceof Error ? error.message : 'Unknown error' } }))
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Database Debug Page</h1>
      
      <div className="space-y-4">
        <button
          onClick={() => runTest('connection', testSupabaseConnection)}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Supabase Connection
        </button>
        
        <button
          onClick={() => runTest('usersTable', testUsersTable)}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Users Table Access
        </button>
        
        <button
          onClick={() => runTest('createUser', testCreateUser)}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Test User Creation
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Test Results:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    </div>
  )
} 