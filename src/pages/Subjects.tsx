import { useEffect, useState } from 'react'
import { api, setAuthToken } from '../lib/api'

type Subject = {
  _id: string
  name: string
  code: string
  course?: { _id: string; code: string; title: string }
  description?: string
  createdAt?: string
}
type College = { _id: string; name: string; abbr: string }
type Department = { _id: string; name: string; code: string }
type Course = { _id: string; code: string; title: string }

export default function Subjects() {
  const [items, setItems] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [college, setCollege] = useState('')
  const [department, setDepartment] = useState('')
  const [course, setCourse] = useState('')
  const [description, setDescription] = useState('')

  const [colleges, setColleges] = useState<College[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    if (!token) { window.location.href = '/login'; return }
    setAuthToken(token)
    Promise.all([fetchColleges(), fetchList()])
  }, [])

  async function fetchList() {
    setLoading(true); setError(null)
    try {
      const res = await api.get('/api/catalog/subjects')
      setItems(res.data || [])
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load subjects')
    } finally { setLoading(false) }
  }

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

  async function fetchCourses(departmentId: string) {
    try {
      const res = await api.get('/api/catalog/courses', { params: { department: departmentId } })
      setCourses(res.data || [])
    } catch {}
  }

  useEffect(() => {
    if (college) fetchDepartments(college)
    else setDepartments([])
    setDepartment(''); setCourse(''); setCourses([])
  }, [college])

  useEffect(() => {
    if (department) fetchCourses(department)
    else setCourses([])
    setCourse('')
  }, [department])

  function resetForm() {
    setName(''); setCode(''); setCollege(''); setDepartment(''); setCourse(''); setDescription('')
  }

  async function createSubject() {
    try {
      if (!name || !code || !course) { alert('Name, Code and Course are required'); return }
      await api.post('/api/catalog/subjects', { name, code, course, description: description || undefined })
      resetForm()
      await fetchList()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create subject')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Subjects</h1>
      </div>

      {error && <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-4 text-sm">{error}</div>}

      {/* Create form */}
      <div className="rounded-lg border p-3 space-y-2">
        <div className="font-medium">Create subject</div>
        <div className="grid md:grid-cols-3 gap-2">
          <input className="rounded border px-3 py-2 bg-transparent" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded border px-3 py-2 bg-transparent" placeholder="Code (e.g., MTH101 or 01)" value={code} onChange={(e) => setCode(e.target.value)} />
          <select className="rounded border px-3 py-2 bg-transparent" value={college} onChange={(e) => setCollege(e.target.value)}>
            <option value="">Select college</option>
            {colleges.map(c => <option key={c._id} value={c._id}>{c.abbr} — {c.name}</option>)}
          </select>
          <select className="rounded border px-3 py-2 bg-transparent" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">Select department</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.code} — {d.name}</option>)}
          </select>
          <select className="rounded border px-3 py-2 bg-transparent" value={course} onChange={(e) => setCourse(e.target.value)}>
            <option value="">Select course</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.code} — {c.title}</option>)}
          </select>
          <input className="rounded border px-3 py-2 bg-transparent md:col-span-3" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded border px-3 py-2" onClick={createSubject}>Create subject</button>
          <button className="rounded border px-3 py-2" onClick={resetForm}>Reset</button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-4">Loading subjects...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Code</th>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Course</th>
                <th className="text-left p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s._id} className="border-t">
                  <td className="p-3 font-mono">{s.code}</td>
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.course ? `${s.course.code} — ${s.course.title}` : '—'}</td>
                  <td className="p-3">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
