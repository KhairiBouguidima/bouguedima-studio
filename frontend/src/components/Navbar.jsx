import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="logo" onClick={() => navigate('/')}>
          <div className="logo-box">ب</div>
          <div className="logo-text">
            <div className="name">بوقديمة</div>
            <div className="sub">لديكورات الجبس</div>
          </div>
        </div>
        <div className="nav-links">
          <a className={isActive('/') ? 'active' : ''} onClick={() => navigate('/')}>الرئيسية</a>
          <a className={isActive('/portfolio') ? 'active' : ''} onClick={() => navigate('/portfolio')}>خدمتنا</a>
          <a onClick={() => navigate('/')}>مراحل الخدمة</a>
          <a onClick={() => navigate('/admin')} style={{color:'#8A8174'}}>دخول الورشة</a>
          <button className="btn-quote" onClick={() => navigate('/quote')}>اطلب السومة</button>
        </div>
      </div>
    </nav>
  )
}
