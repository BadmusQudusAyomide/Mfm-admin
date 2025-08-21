import { useEffect, useState } from 'react'
import { api, setAuthToken } from '../lib/api'

 type College = { _id: string; name: string; abbr: string }
 type Department = { _id: string; name: string; code: string }
 type Course = { _id: string; code: string; title: string; level: string; departmentRef?: Department; collegeRef?: College; createdAt?: string }

export default function Courses() {
  const [items, setItems] = useState<Course[]>([])
  const [colleges, setColleges] = useState<College[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState('100')
  const [college, setCollege] = useState('')
  const [department, setDepartment] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    if (!token) { window.location.href = '/login'; return }
    setAuthToken(token)
    Promise.all([fetchColleges(), fetchList()])
  }, [])

  useEffect(() => {
    if (college) fetchDepartments(college)
    else setDepartments([])
    setDepartment('')
  }, [college])

  async function fetchColleges() {
    try {
      const res = await api.get('/api/catalog/colleges')
      setColleges(res.data || [])
    } catch {}
  }

  async function fetchDepartments(collegeId: string) {
    try {
      const res = await api.get('/api/catalog/departments', { params: { college: collegeId } })
      setDepartments(res.data || [])
    } catch {}
  }

  async function fetchList() {
    setLoading(true); setError(null)
    try {
      const res = await api.get('/api/catalog/courses')
      setItems(res.data || [])
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load courses')
    } finally { setLoading(false) }
  }

  async function createItem() {
    try {
      if (!code || !title || !level || !department) { alert('Code, Title, Level, Department are required'); return }
      await api.post('/api/catalog/courses', { code, title, level, department })
      setCode(''); setTitle(''); setLevel('100'); setCollege(''); setDepartment('')
      await fetchList()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create course')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Courses</h1>
      </div>

      {error && <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-4 text-sm">{error}</div>}

      <div className="rounded-lg border p-3 space-y-2">
        <div className="font-medium">Create course</div>
        <div className="grid md:grid-cols-4 gap-2">
          <input className="rounded border px-3 py-2 bg-transparent" placeholder="Code (e.g., CSC101)" value={code} onChange={(e) => setCode(e.target.value)} />
          <input className="rounded border px-3 py-2 bg-transparent" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select className="rounded border px-3 py-2 bg-transparent" value={level} onChange={(e) => setLevel(e.target.value)}>
            {['100','200','300','400','500','600','700'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select className="rounded border px-3 py-2 bg-transparent" value={college} onChange={(e) => setCollege(e.target.value)}>
            <option value="">Select college</option>
            {colleges.map(c => <option key={c._id} value={c._id}>{c.abbr} — {c.name}</option>)}
          </select>
          <select className="rounded border px-3 py-2 bg-transparent" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">Select department</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.code} — {d.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded border px-3 py-2" onClick={createItem}>Create</button>
        </div>
      </div>

      {loading ? (
        <div className="p-4">Loading courses...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Code</th>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Level</th>
                <th className="text-left p-3 font-medium">Department</th>
                <th className="text-left p-3 font-medium">College</th>
                <th className="text-left p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id} className="border-t">
                  <td className="p-3 font-mono">{c.code}</td>
                  <td className="p-3">{c.title}</td>
                  <td className="p-3">{c.level}</td>
                  <td className="p-3">{c.departmentRef?.code || '—'}</td>
                  <td className="p-3">{c.collegeRef?.abbr || '—'}</td>
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
