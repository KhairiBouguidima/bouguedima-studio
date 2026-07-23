import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path
  const goTo = (path) => {
    setMenuOpen(false)
    navigate(path)
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="logo">
          <div className="logo-box" onClick={() => setMenuOpen(open => !open)}>ب</div>
          <div className="logo-text" onClick={() => goTo('/')}>
            <div className="name">بوقـديمة</div>
            <div className="sub">لديكورات الجبس</div>
          </div>
        </div>
        <div className={`nav-links${menuOpen ? ' open' : ''}`}>
          <a className={isActive('/') ? 'active' : ''} onClick={() => goTo('/')}>الرئيسية</a>
          <a className={isActive('/portfolio') ? 'active' : ''} onClick={() => goTo('/portfolio')}>خدمتنا</a>
          <a onClick={() => goTo('/')}>مراحل الخدمة</a>
          <a onClick={() => goTo('/admin')} style={{ color: '#8A8174' }}>دخول الورشة</a>
          <button className="btn-quote" onClick={() => goTo('/quote')}>اطلب السومة</button>
        </div>
      </div>
    </nav>
  )
}
