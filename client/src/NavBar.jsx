import { NavLink } from 'react-router-dom'
import { useAuth } from './AuthContext'

const LINKS = [
  { to: '/closet', label: 'Closet', icon: '👗' },
  { to: '/occasions', label: 'Occasions', icon: '📅' },
  { to: '/influencers', label: 'Follow', icon: '✨' },
  { to: '/feed', label: 'Feed', icon: '🪞' },
  { to: '/gap', label: 'Shop', icon: '💅' },
  { to: '/chat', label: 'Stylist', icon: '💬' },
  { to: '/notifications', label: 'Alerts', icon: '🔔' },
]

export default function NavBar() {
  const { logout } = useAuth()
  return (
    <nav className="fg-navbar">
      <span className="fg-navbar-brand">Fairy <i>Godrobe</i></span>
      <div className="fg-navbar-links">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => `fg-navbar-link ${isActive ? 'fg-navbar-link-active' : ''}`}>
            <span>{l.icon}</span> {l.label}
          </NavLink>
        ))}
        <button className="fg-navbar-logout" onClick={logout}>Log out</button>
      </div>
    </nav>
  )
}
