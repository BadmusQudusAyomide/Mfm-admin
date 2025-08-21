import { useEffect, useState } from 'react'
import { api, setAuthToken } from '../lib/api'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({
    users: 0,
    courses: 0,
    subjects: 0,
    quizzes: 0,
    pdfs: 0,
  })

  useEffect(() => {
    const token = localStorage.getItem('token') || ''
    if (!token) {
      window.location.href = '/login'
      return
    }
    setAuthToken(token)
    ;(async () => {
      try {
        const res = await api.get('/api/auth/me')
        setUser(res.data?.user ?? res.data)
        const name = (res.data?.user ?? res.data)?.name
        if (name) localStorage.setItem('dashboard_name', String(name))

        // Fetch aggregated metrics
        const stats = await api.get('/api/stats').then(r => r.data).catch(() => null)
        if (stats) {
          setCounts({
            users: Number(stats.users || 0),
            courses: Number(stats.courses || 0),
            subjects: Number(stats.subjects || 0),
            quizzes: Number(stats.quizzes || 0),
            pdfs: Number(stats.pdfs || 0),
          })
        }
      } catch (err) {
        localStorage.removeItem('token')
        setAuthToken(undefined)
        window.location.href = '/login'
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            className="text-sm underline"
            onClick={() => {
              localStorage.removeItem('token')
              setAuthToken(undefined)
              window.location.href = '/login'
            }}
          >
            Logout
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Users" value={String(counts.users)} />
          <Stat label="Courses" value={String(counts.courses)} />
          <Stat label="Subjects" value={String(counts.subjects)} />
          <Stat label="Quizzes" value={String(counts.quizzes)} />
          <Stat label="PDFs" value={String(counts.pdfs)} />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-xl border bg-card text-card-foreground p-6">
            <div className="flex items-start gap-4">
              <Avatar name={user?.name} src={user?.profileImage?.url} />
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold">{user?.name}</h2>
                  {user?.role && (
                    <span className="px-2.5 py-0.5 text-xs rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                      {user.role}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Info label="Username" value={user?.username} />
                  <Info label="Level" value={user?.level || '-'} />
                  <Info label="Gender" value={user?.gender || '-'} />
                  <Info label="Phone" value={user?.phone || '-'} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground p-6">
            <h3 className="font-semibold mb-3">Quick actions</h3>
            <ul className="space-y-2 text-sm">
              <li className="opacity-70">• Edit profile (coming soon)</li>
              <li className="opacity-70">• View events (coming soon)</li>
              <li className="opacity-70">• Join groups (coming soon)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Avatar({ name, src }: { name?: string; src?: string }) {
  const initials = (name || '?')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div className="size-14 rounded-full overflow-hidden bg-muted flex items-center justify-center text-sm font-semibold">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-0.5 font-medium break-words">{value || '-'}</div>
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}
