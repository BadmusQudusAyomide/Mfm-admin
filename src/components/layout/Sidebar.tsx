import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, ListChecks, BookOpen, Building2, Boxes, GraduationCap, FileText, Settings } from 'lucide-react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/quizzes', label: 'Quizzes', icon: ListChecks },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/colleges', label: 'Colleges', icon: Building2 },
  { to: '/departments', label: 'Departments', icon: Boxes },
  { to: '/courses', label: 'Courses', icon: GraduationCap },
  { to: '/tutorials', label: 'Courses/Tutorials', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
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
              {n.icon ? <n.icon size={18} className="shrink-0 text-muted-foreground" /> : <span className="inline-block w-4 h-4 rounded bg-muted-foreground/20" />}
              {!collapsed && <span className="truncate">{n.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
