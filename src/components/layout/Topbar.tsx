import { useEffect, useState } from 'react'

export default function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [name, setName] = useState<string>('')
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dashboard_name')
      if (raw) setName(raw)
    } catch {}
  }, [])

  return (
    <header className="h-14 border-b bg-card text-card-foreground flex items-center px-4 justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          aria-label="Toggle sidebar"
          className="inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 text-sm hover:bg-muted"
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <div className="font-semibold">Admin Dashboard</div>
      </div>
      <div className="text-sm text-muted-foreground truncate max-w-[50%]">
        {name || 'Welcome'}
      </div>
    </header>
  )
}
