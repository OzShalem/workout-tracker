import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Today' },
  { to: '/history', label: 'History' },
  { to: '/progress', label: 'Progress' },
  { to: '/routines', label: 'Routines' },
  { to: '/exercises', label: 'Exercises' },
  { to: '/settings', label: 'Settings' },
]

export function Shell() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Primary">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              isActive ? 'tabbar-link tabbar-link-active' : 'tabbar-link'
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
