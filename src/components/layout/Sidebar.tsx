import { Link, useLocation } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/quizzes', label: 'Quizzes' },
  { to: '/subjects', label: 'Subjects' },
  { to: '/colleges', label: 'Colleges' },
  { to: '/departments', label: 'Departments' },
  { to: '/courses', label: 'Courses' },
  { to: '/tutorials', label: 'Courses/Tutorials' },
  { to: '/settings', label: 'Settings' },
  // Future: { to: '/events', label: 'Events' }, { to: '/groups', label: 'Groups' }
]

export default function Sidebar({ collapsed, onNavigate }: { collapsed: boolean, onNavigate?: () => void }) {
  const { pathname } = useLocation()
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} transition-all duration-200 shrink-0 border-r bg-card text-card-foreground min-h-screen p-4`}
      aria-label="Sidebar">
      <div className="text-lg font-bold mb-6 truncate" title="Admin">
        {collapsed ? 'A' : 'Admin'}
      </div>
      <nav className="space-y-1">
        {nav.map((n) => {
          const active = pathname === n.to
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex items-center gap-3 rounded px-3 py-2 text-sm hover:bg-muted ${active ? 'bg-muted' : ''}`}
              onClick={() => { if (onNavigate) onNavigate() }}
            >
              <span className="inline-block w-4 h-4 rounded bg-muted-foreground/20" />
              {!collapsed && <span className="truncate">{n.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
