import { useEffect, useState } from 'react'
import { api, setAuthToken } from '../lib/api'

 type College = { _id: string; name: string; abbr: string; createdAt?: string }

export default function Colleges() {
  const [items, setItems] = useState<College[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [abbr, setAbbr] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    if (!token) { window.location.href = '/login'; return }
    setAuthToken(token)
    fetchList()
  }, [])

  async function fetchList() {
    setLoading(true); setError(null)
    try {
      const res = await api.get('/api/catalog/colleges')
      setItems(res.data || [])
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load colleges')
    } finally { setLoading(false) }
  }

  async function createItem() {
    try {
      if (!name || !abbr) { alert('Name and Abbreviation are required'); return }
      await api.post('/api/catalog/colleges', { name, abbr })
      setName(''); setAbbr('')
      await fetchList()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create college')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Colleges</h1>
      </div>

      {error && <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-4 text-sm">{error}</div>}

      <div className="rounded-lg border p-3 space-y-2">
        <div className="font-medium">Create college</div>
        <div className="grid md:grid-cols-3 gap-2">
          <input className="rounded border px-3 py-2 bg-transparent" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded border px-3 py-2 bg-transparent" placeholder="Abbreviation (e.g., ENG)" value={abbr} onChange={(e) => setAbbr(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded border px-3 py-2" onClick={createItem}>Create</button>
        </div>
      </div>

      {loading ? (
        <div className="p-4">Loading colleges...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Abbr</th>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id} className="border-t">
                  <td className="p-3 font-mono">{c.abbr}</td>
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
