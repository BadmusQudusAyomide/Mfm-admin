import { useEffect, useRef, useState } from 'react'
import { api, setAuthToken } from '../lib/api'

type Quiz = {
  _id: string
  title: string
  description?: string
  subject?: any
  isActive?: boolean
  createdAt?: string
}

export default function Quizzes() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<Quiz[]>([])
  const [q, setQ] = useState('')
  const [active, setActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)

  // create/edit form
  const [editing, setEditing] = useState<Quiz | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [csvDryRun, setCsvDryRun] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    if (!token) { window.location.href = '/login'; return }
    setAuthToken(token)
  }, [])

  useEffect(() => { fetchList() }, [q, active, page, limit])

  async function fetchList() {
    setLoading(true); setError(null)
    try {
      const params: any = { q: q || undefined, active: active === 'all' ? undefined : active === 'active', page, limit }
      const res = await api.get('/api/quiz', { params })
      const data = res.data?.data ?? res.data
      if (Array.isArray(data)) {
        setItems(data)
        const p = res.data?.pagination
        setTotal(p?.total ?? data.length)
        setPages(p?.pages ?? 1)
      } else {
        setError('Unexpected response format')
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load quizzes')
    } finally { setLoading(false) }
  }

  function resetForm() {
    setEditing(null)
    setTitle('')
    setDescription('')
    setSubject('')
    if (fileRef.current) fileRef.current.value = ''
    setCsvDryRun(true)
  }

  async function saveQuiz() {
    try {
      if (!title || !subject) { alert('Title and Subject are required'); return }
      if (editing) {
        await api.put(`/api/quiz/${editing._id}`, { title, description, subject })
      } else {
        await api.post('/api/quiz', { title, description, subject })
      }
      resetForm(); await fetchList()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save quiz')
    }
  }

  async function toggleActive(quiz: Quiz, on: boolean) {
    try { await api.patch(`/api/quiz/${quiz._id}/active`, { isActive: on }); await fetchList() }
    catch (e: any) { setError(e?.response?.data?.message || 'Failed to update') }
  }

  async function remove(quiz: Quiz) {
    if (!confirm('Delete this quiz? This cannot be undone.')) return
    try { await api.delete(`/api/quiz/${quiz._id}`); await fetchList() }
    catch (e: any) { setError(e?.response?.data?.message || 'Failed to delete quiz') }
  }

  async function uploadCSV(quiz: Quiz) {
    if (!fileRef.current || !fileRef.current.files || fileRef.current.files.length === 0) { alert('Choose a CSV file first'); return }
    const form = new FormData()
    form.append('csv', fileRef.current.files[0])
    try {
      const url = `/api/quiz/${quiz._id}/questions/csv?dryRun=${csvDryRun ? 'true' : 'false'}`
      await api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert(csvDryRun ? 'CSV validated successfully' : 'CSV uploaded successfully')
      if (!csvDryRun) await fetchList()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'CSV upload failed')
    }
  }

  const current = items

  if (loading) return <div className="p-4">Loading quizzes...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Quizzes</h1>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input className="w-full md:w-64 rounded border px-3 py-2 bg-transparent" placeholder="Search title/description" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
          <select className="rounded border px-3 py-2 bg-transparent" value={active} onChange={(e) => { setActive(e.target.value as any); setPage(1) }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="rounded border px-2 py-1" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {error && <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-4 text-sm">{error}</div>}

      {/* Editor */}
      <div className="rounded-lg border p-3 space-y-2">
        <div className="font-medium">{editing ? 'Edit quiz' : 'Create quiz'}</div>
        <div className="grid md:grid-cols-3 gap-2">
          <input className="rounded border px-3 py-2 bg-transparent" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="rounded border px-3 py-2 bg-transparent" placeholder="Subject ID" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <input className="rounded border px-3 py-2 bg-transparent" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded border px-3 py-2" onClick={saveQuiz}>{editing ? 'Save changes' : 'Create quiz'}</button>
          {editing && <button className="rounded border px-3 py-2" onClick={resetForm}>Cancel</button>}
        </div>
      </div>

      {/* Mobile list */}
      <div className="md:hidden space-y-3">
        {current.map((qz) => (
          <div key={qz._id} className="rounded-lg border p-3 bg-card">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-medium">{qz.title}</div>
                <div className="text-xs text-muted-foreground">{qz.subject?.name || qz.subject?.code || '—'}</div>
              </div>
              {qz.isActive ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border text-green-700">Active</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border text-amber-700">Inactive</span>
              )}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{qz.createdAt ? new Date(qz.createdAt).toLocaleDateString() : '—'}</div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button className="text-blue-600 text-sm" onClick={() => { setEditing(qz); setTitle(qz.title); setDescription(qz.description || ''); setSubject(qz.subject?._id || '') }}>Edit</button>
              {qz.isActive ? (
                <button className="text-amber-700 text-sm" onClick={() => toggleActive(qz, false)}>Deactivate</button>
              ) : (
                <button className="text-green-700 text-sm" onClick={() => toggleActive(qz, true)}>Activate</button>
              )}
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept=".csv" className="text-xs" />
                <label className="text-xs inline-flex items-center gap-1"><input type="checkbox" checked={csvDryRun} onChange={(e) => setCsvDryRun(e.target.checked)} />Dry run</label>
                <button className="text-blue-600 text-sm" onClick={() => uploadCSV(qz)}>Upload</button>
              </div>
              <button className="text-red-600 text-sm" onClick={() => remove(qz)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium">Subject</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Created</th>
              <th className="text-left p-3 font-medium">CSV</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {current.map((qz) => (
              <tr key={qz._id} className="border-t">
                <td className="p-3">{qz.title}</td>
                <td className="p-3">{qz.subject?.name || qz.subject?.code || '—'}</td>
                <td className="p-3">
                  {qz.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border text-green-700">Active</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border text-amber-700">Inactive</span>
                  )}
                </td>
                <td className="p-3">{qz.createdAt ? new Date(qz.createdAt).toLocaleDateString() : '—'}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <input ref={fileRef} type="file" accept=".csv" className="text-xs" />
                    <label className="text-xs inline-flex items-center gap-1"><input type="checkbox" checked={csvDryRun} onChange={(e) => setCsvDryRun(e.target.checked)} />Dry run</label>
                    <button className="text-blue-600 hover:underline" onClick={() => uploadCSV(qz)}>Upload</button>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button className="text-blue-600 hover:underline" onClick={() => { setEditing(qz); setTitle(qz.title); setDescription(qz.description || ''); setSubject(qz.subject?._id || '') }}>Edit</button>
                    {qz.isActive ? (
                      <button className="text-amber-700 hover:underline" onClick={() => toggleActive(qz, false)}>Deactivate</button>
                    ) : (
                      <button className="text-green-700 hover:underline" onClick={() => toggleActive(qz, true)}>Activate</button>
                    )}
                    <button className="text-red-600 hover:underline" onClick={() => remove(qz)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
          <div>Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}</div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="rounded border px-2 py-1" disabled={page === 1} onClick={() => setPage(1)}>First</button>
            <button className="rounded border px-2 py-1" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span>Page {page} / {pages}</span>
            <button className="rounded border px-2 py-1" disabled={page === pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next</button>
            <button className="rounded border px-2 py-1" disabled={page === pages} onClick={() => setPage(pages)}>Last</button>
          </div>
        </div>
      )}
    </div>
  )
}
