import { useState } from 'react'
import { api, setAuthToken } from '../lib/api'
import { Link } from 'react-router-dom'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', { identifier, password })
      const token: string = res.data?.token || res.data?.accessToken || ''
      if (!token) throw new Error('No token returned from server')
      localStorage.setItem('token', token)
      setAuthToken(token)
      window.location.href = '/'
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 p-2 rounded">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email or Username</label>
            <input
              type="text"
              className="w-full rounded border px-3 py-2 bg-transparent"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded border px-3 py-2 bg-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-black text-white py-2 font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}
