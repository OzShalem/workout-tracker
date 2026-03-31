import { NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n/translations'

export function Shell() {
  const { t } = useI18n()
  const tabs = [
    { to: '/', label: t('tabToday') },
    { to: '/history', label: t('tabHistory') },
    { to: '/progress', label: t('tabProgress') },
    { to: '/routines', label: t('tabRoutines') },
    { to: '/exercises', label: t('tabExercises') },
    { to: '/settings', label: t('tabSettings') },
  ]

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
