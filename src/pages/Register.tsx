import { useState } from 'react'
import { api, setAuthToken } from '../lib/api'
import { Link } from 'react-router-dom'

export default function Register() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/api/auth/register', {
        name,
        username,
        email,
        password,
      })
      const token: string = res.data?.token || res.data?.accessToken || ''
      if (!token) throw new Error('No token returned from server')
      localStorage.setItem('token', token)
      setAuthToken(token)
      window.location.href = '/'
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Create account</h1>
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 p-2 rounded">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input
              type="text"
              className="w-full rounded border px-3 py-2 bg-transparent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              className="w-full rounded border px-3 py-2 bg-transparent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded border px-3 py-2 bg-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-black text-white py-2 font-medium disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
