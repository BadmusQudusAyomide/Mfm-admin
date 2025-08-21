import { useState } from 'react'
import { api } from '../lib/api'

export default function Settings() {
  const [role, setRole] = useState<'admin' | 'exec'>('admin')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function onPromote(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    setLoading(true)
    try {
      const res = await api.post('/api/auth/promote-self', { role, code })
      setMsg(res.data?.message || 'Role updated')
    } catch (error: any) {
      setErr(error?.response?.data?.message || error.message || 'Failed to promote')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <div className="max-w-md bg-white dark:bg-gray-800 rounded-xl border p-4">
        <h2 className="text-lg font-semibold mb-3">Promote Account</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Enter the promotion code provided by the server admin to elevate your role.
        </p>
        {msg && <div className="mb-3 text-sm text-green-700 bg-green-50 dark:bg-green-900/30 p-2 rounded">{msg}</div>}
        {err && <div className="mb-3 text-sm text-red-700 bg-red-50 dark:bg-red-900/30 p-2 rounded">{err}</div>}
        <form onSubmit={onPromote} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Target role</label>
            <select
              className="w-full rounded border px-3 py-2 bg-transparent"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'exec')}
            >
              <option value="admin">Admin</option>
              <option value="exec">Exec</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Promotion code</label>
            <input
              type="password"
              className="w-full rounded border px-3 py-2 bg-transparent"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto rounded bg-black text-white px-4 py-2 disabled:opacity-50"
          >
            {loading ? 'Promoting...' : 'Promote me'}
          </button>
        </form>
      </div>
    </div>
  )
}
