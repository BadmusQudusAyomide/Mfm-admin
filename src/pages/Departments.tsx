import { useEffect, useState } from 'react'
import { api, setAuthToken } from '../lib/api'

 type College = { _id: string; name: string; abbr: string }
 type Department = { _id: string; name: string; code: string; college: College; createdAt?: string }

export default function Departments() {
  const [items, setItems] = useState<Department[]>([])
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [college, setCollege] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    if (!token) { window.location.href = '/login'; return }
    setAuthToken(token)
    Promise.all([fetchColleges(), fetchList()])
  }, [])

  async function fetchColleges() {
    try {
      const res = await api.get('/api/catalog/colleges')
      setColleges(res.data || [])
    } catch (e) { /* ignore */ }
  }

  async function fetchList() {
    setLoading(true); setError(null)
    try {
      const res = await api.get('/api/catalog/departments')
      setItems(res.data || [])
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load departments')
    } finally { setLoading(false) }
  }

  async function createItem() {
    try {
      if (!name || !code || !college) { alert('Name, Code and College are required'); return }
      await api.post('/api/catalog/departments', { name, code, college })
      setName(''); setCode(''); setCollege('')
      await fetchList()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create department')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Departments</h1>
      </div>

      {error && <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-4 text-sm">{error}</div>}

      <div className="rounded-lg border p-3 space-y-2">
        <div className="font-medium">Create department</div>
        <div className="grid md:grid-cols-3 gap-2">
          <input className="rounded border px-3 py-2 bg-transparent" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded border px-3 py-2 bg-transparent" placeholder="Code (e.g., CSE)" value={code} onChange={(e) => setCode(e.target.value)} />
          <select className="rounded border px-3 py-2 bg-transparent" value={college} onChange={(e) => setCollege(e.target.value)}>
            <option value="">Select college</option>
            {colleges.map(c => <option key={c._id} value={c._id}>{c.abbr} — {c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded border px-3 py-2" onClick={createItem}>Create</button>
        </div>
      </div>

      {loading ? (
        <div className="p-4">Loading departments...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Code</th>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">College</th>
                <th className="text-left p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d._id} className="border-t">
                  <td className="p-3 font-mono">{d.code}</td>
                  <td className="p-3">{d.name}</td>
                  <td className="p-3">{d.college?.abbr || '—'}</td>
                  <td className="p-3">{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
