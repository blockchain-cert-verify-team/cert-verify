import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../state/useAuth.js'
import WalletConnection from '../components/WalletConnection.jsx'

export default function RootLayout(){
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <div>
      <nav className="nav">
        <div className="brand">CertChain</div>
        <div className="navlinks">
          <Link to="/">Home</Link>
          <Link to="/login" className={location.pathname==='/login'?'active':''}>Login</Link>
          <Link to="/verify" className={location.pathname==='/verify'?'active':''}>Verify Certificate</Link>
          {user && (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className={location.pathname==='/admin'?'active':''}>Admin Dashboard</Link>
              )}
              <span>Welcome, {user.name}</span>
              <button className="btn" onClick={()=>{ logout(); navigate('/')}}>Logout</button>
            </>
          )}
          <div className="wallet-section">
            <WalletConnection />
          </div>
        </div>
      </nav>
      <main className="container">
        <Outlet />
      </main>
    </div>
  )
}

