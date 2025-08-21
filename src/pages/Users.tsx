import { useEffect, useState } from 'react'
import { api, setAuthToken } from '../lib/api'

export default function Users() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'member' | 'exec' | 'admin'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [sort] = useState<string>('-createdAt')
  const [selected, setSelected] = useState<any | null>(null)
  const [counts, setCounts] = useState({ total: 0, admins: 0, execs: 0, active: 0 })

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    if (!token) {
      window.location.href = '/login'
      return
    }
    setAuthToken(token)
    // Fetch overall counts once on mount
    fetchCounts()
  }, [])

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, roleFilter, activeFilter, page, limit, sort])

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        q: q || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        active: activeFilter === 'all' ? undefined : activeFilter === 'active',
        page,
        limit,
        sort,
      }
      const res = await api.get('/api/users', { params })
      const data = res.data?.data ?? res.data?.users ?? res.data
      const pagination = res.data?.pagination
      if (Array.isArray(data)) {
        setUsers(data)
        if (pagination) {
          setTotal(pagination.total || 0)
          setPages(pagination.pages || 1)
        } else {
          // Fallback for older shape
          setTotal(data.length)
          setPages(1)
        }
      } else {
        setError('Unexpected response format from /api/users')
      }
    } catch (e: any) {
      if (e?.response?.status === 403) setError('You are not authorized to view users. Admin/exec role required.')
      else setError(e?.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCounts() {
    try {
      const base = '/api/users'
      const [allRes, adminRes, execRes, activeRes] = await Promise.all([
        api.get(base, { params: { limit: 1 } }),
        api.get(base, { params: { role: 'admin', limit: 1 } }),
        api.get(base, { params: { role: 'exec', limit: 1 } }),
        api.get(base, { params: { active: true, limit: 1 } }),
      ])
      const getTotal = (r: any) => r.data?.pagination?.total ?? (Array.isArray(r.data?.data) ? r.data.data.length : 0)
      setCounts({
        total: getTotal(allRes),
        admins: getTotal(adminRes),
        execs: getTotal(execRes),
        active: getTotal(activeRes),
      })
    } catch (_) {
      // ignore count errors
    }
  }

  // Derived lists
  const current = users

  function resetToFirstPage() {
    setPage(1)
  }

  async function exportCSV() {
    try {
      const params: any = {
        q: q || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        active: activeFilter === 'all' ? undefined : activeFilter === 'active',
        sort,
      }
      const res = await api.get('/api/users/export', { params, responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'users.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Export failed')
    }
  }

  // helpers removed (unused)

  async function changeRole(u: any, role: 'member' | 'exec' | 'admin') {
    try {
      await api.patch(`/api/users/${u._id || u.id}/role`, { role })
      await fetchUsers()
      fetchCounts()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update role')
    }
  }

  async function toggleActive(u: any, makeActive: boolean) {
    try {
      await api.patch(`/api/users/${u._id || u.id}/status`, { active: makeActive })
      await fetchUsers()
      fetchCounts()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update status')
    }
  }

  async function deleteUser(u: any) {
    if (!confirm('Delete this user? This action cannot be undone.')) return
    try {
      await api.delete(`/api/users/${u._id || u.id}`)
      await fetchUsers()
      fetchCounts()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to delete user')
    }
  }

  if (loading) return <div className="p-4">Loading users...</div>

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Users" value={String(counts.total)} />
        <Stat label="Admins" value={String(counts.admins)} />
        <Stat label="Execs" value={String(counts.execs)} />
        <Stat label="Active" value={String(counts.active)} />
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search name, email, username"
            className="w-full md:w-64 rounded border px-3 py-2 bg-transparent"
            value={q}
            onChange={(e) => { setQ(e.target.value); resetToFirstPage() }}
          />
          <select
            className="rounded border px-3 py-2 bg-transparent flex-1 md:flex-none"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as any); resetToFirstPage() }}
          >
            <option value="all">All roles</option>
            <option value="member">Member</option>
            <option value="exec">Exec</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="rounded border px-3 py-2 bg-transparent flex-1 md:flex-none"
            value={activeFilter}
            onChange={(e) => { setActiveFilter(e.target.value as any); resetToFirstPage() }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={exportCSV} className="rounded border px-3 py-2 w-full md:w-auto">Export CSV</button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-4 text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-3">
            {current.map((u) => (
              <div key={u._id || u.id} className="rounded-lg border p-3 bg-card">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border whitespace-nowrap" title={u.active === false ? 'Inactive' : 'Active'}>
                    {u.role || 'member'} {u.active === false ? '• Inactive' : ''}
                  </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">@{u.username || '—'} • {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</div>
                <div className="mt-3 flex items-center gap-3">
                  <button className="text-blue-600 text-sm" onClick={() => setSelected(u)}>View</button>
                  <select className="text-sm border rounded px-1 py-0.5" value={u.role || 'member'} onChange={(e) => changeRole(u, e.target.value as any)}>
                    <option value="member">Member</option>
                    <option value="exec">Exec</option>
                    <option value="admin">Admin</option>
                  </select>
                  {u.active === false ? (
                    <button title="Activate" className="text-green-700" onClick={() => toggleActive(u, true)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a10 10 0 100-20 10 10 0 000 20z" />
                      </svg>
                    </button>
                  ) : (
                    <button title="Deactivate" className="text-amber-700" onClick={() => toggleActive(u, false)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 14.828L14.828 9.172" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a10 10 0 100-20 10 10 0 000 20z" />
                      </svg>
                    </button>
                  )}
                  <button title="Delete" className="text-red-600" onClick={() => deleteUser(u)}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 7h4m-6 0h8l-1-2H8l-1 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Username</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Created</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {current.map((u) => (
                  <tr key={u._id || u.id} className="border-t">
                    <td className="p-3">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.username || '—'}</td>
                    <td className="p-3">
                      <select className="border rounded px-2 py-1 bg-transparent" value={u.role || 'member'} onChange={(e) => changeRole(u, e.target.value as any)}>
                        <option value="member">Member</option>
                        <option value="exec">Exec</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-3">
                      {u.active === false ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border text-amber-700">Inactive</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border text-green-700">Active</span>
                      )}
                    </td>
                    <td className="p-3">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:underline" onClick={() => setSelected(u)}>View</button>
                        {u.active === false ? (
                          <button title="Activate" className="text-green-700" onClick={() => toggleActive(u, true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a10 10 0 100-20 10 10 0 000 20z" />
                            </svg>
                          </button>
                        ) : (
                          <button title="Deactivate" className="text-amber-700" onClick={() => toggleActive(u, false)}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 14.828L14.828 9.172" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a10 10 0 100-20 10 10 0 000 20z" />
                            </svg>
                          </button>
                        )}
                        <button title="Delete" className="text-red-600" onClick={() => deleteUser(u)}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 7h4m-6 0h8l-1-2H8l-1 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {!error && total > 0 && (
        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
          <div>
            Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select className="rounded border px-2 py-1" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); resetToFirstPage() }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <button className="rounded border px-2 py-1" disabled={page === 1} onClick={() => setPage(1)}>First</button>
            <button className="rounded border px-2 py-1" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span>Page {page} / {pages}</span>
            <button className="rounded border px-2 py-1" disabled={page === pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>Next</button>
            <button className="rounded border px-2 py-1" disabled={page === pages} onClick={() => setPage(pages)}>Last</button>
          </div>
        </div>
      )}

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-lg bg-white dark:bg-gray-900 border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">User details</h2>
              <button className="text-sm" onClick={() => setSelected(null)}>Close</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Name" value={selected.name} />
              <Field label="Email" value={selected.email} />
              <Field label="Username" value={selected.username} />
              <Field label="Role" value={selected.role || 'member'} />
              <Field label="Status" value={selected.active === false ? 'Inactive' : 'Active'} />
              <Field label="ID" value={selected._id || selected.id} copy />
              <Field label="Created" value={selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'} />
              <Field label="Phone" value={selected.phone} />
              <Field label="Faculty" value={selected.faculty} />
              <Field label="Department" value={selected.department} />
              <Field label="Level" value={selected.level} />
              <Field label="Gender" value={selected.gender} />
              <Field label="DOB" value={selected.dob ? new Date(selected.dob).toLocaleDateString() : '—'} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, copy = false }: { label: string, value: any, copy?: boolean }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs mb-0.5">{label}</div>
      <div className="flex items-center gap-2">
        <span className="truncate" title={String(value ?? '—')}>{value ?? '—'}</span>
        {copy && value && (
          <button
            className="text-xs px-2 py-0.5 rounded border"
            onClick={() => navigator.clipboard.writeText(String(value))}
          >Copy</button>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  )
}
