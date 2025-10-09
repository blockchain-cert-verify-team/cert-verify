import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../state/useAuth.js'
import { AuthApi } from '../lib/api.js'

export default function LoginPage(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const navigate = useNavigate()
  const { user, setAuth } = useAuth()

  useEffect(()=>{ 
    if(user) {
      if(user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    }
  },[user,navigate])

  async function onSubmit(e){
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await AuthApi.login(email,password)
      setAuth({ token: res.token, user: res.user })
      if(res.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch(err){
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{maxWidth:520, margin:'0 auto'}}>
      <h1 className="title">CertChain</h1>
      <p className="subtitle">Admin/Issuer Login</p>
      <div className="card">
        <div style={{display:'flex',gap:12,marginBottom:16}}>
          <button className="btn" style={{background:'#e5e7eb',color:'#111827'}}>Login</button>
          <button 
            className="btn" 
            style={{background:'#f3f4f6',color:'#6b7280'}}
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input placeholder="Enter your email" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          {error && <div className="badge status invalid" style={{marginBottom:12}}>{error}</div>}
          <button className="btn" disabled={loading}>{loading?'Logging in...':'Login'}</button>
        </form>
        <div style={{marginTop:16,color:'#6b7280',fontSize:14}}>
          <div><strong>Demo credentials:</strong></div>
          <div style={{marginTop:8}}>
            <div><strong>Admin:</strong> admin@example.com / admin123</div>
            <div style={{color:'#9ca3af',fontSize:12}}>→ Access to Admin Dashboard (User Management)</div>
          </div>
          <div style={{marginTop:8}}>
            <div><strong>Issuer:</strong> charan33official@gmail.com / [your password]</div>
            <div style={{color:'#9ca3af',fontSize:12}}>→ Access to Issuer Dashboard (Certificate Issuance)</div>
          </div>
        </div>
      </div>
    </div>
  )
}

