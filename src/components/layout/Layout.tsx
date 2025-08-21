import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  // For mobile slide-in/out animations
  const [panelVisible, setPanelVisible] = useState(false) // controls translate class
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

  // When overlay mounts (collapsed -> true), trigger slide-in on next tick
  useEffect(() => {
    if (collapsed) {
      const id = setTimeout(() => setPanelVisible(true), 0)
      return () => clearTimeout(id)
    } else {
      setPanelVisible(false)
      setIsAnimatingOut(false)
    }
  }, [collapsed])

  // ESC to close overlay
  useEffect(() => {
    if (!collapsed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeWithAnimation()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [collapsed])

  function closeWithAnimation() {
    if (!collapsed || isAnimatingOut) return
    setIsAnimatingOut(true)
    setPanelVisible(false)
    // allow transition to complete before unmounting overlay
    setTimeout(() => {
      setCollapsed(false)
      setIsAnimatingOut(false)
    }, 300)
  }
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Mobile sidebar overlay */}
      {collapsed && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeWithAnimation}
          />
          <div className="relative h-full">
            <button
              aria-label="Close sidebar"
              className="absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-md border px-2 py-1 text-sm bg-card"
              onClick={closeWithAnimation}
            >
              ×
            </button>
            <div className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] transform transition-transform duration-300 ease-out ${panelVisible ? 'translate-x-0' : '-translate-x-full'}`}>
              <Sidebar collapsed={false} onNavigate={closeWithAnimation} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onToggleSidebar={() => setCollapsed((v: boolean) => !v)} />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
