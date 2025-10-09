import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../state/useAuth.js'
import { AuthApi } from '../lib/api.js'

export default function SignupPage(){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organization, setOrganization] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, setAuth } = useAuth()

  useEffect(() => { 
    if(user) {
      if(user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    }
  }, [user, navigate])

  async function onSubmit(e){
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await AuthApi.signup(name, email, password, 'issuer', organization)
      // Don't auto-login, just show success message
      setError('') // Clear any previous errors
      alert('Account created successfully! Please login with your credentials.')
      navigate('/login')
    } catch(err){
      setError(err.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{maxWidth:520, margin:'0 auto', padding:'20px'}}>
      <div style={{textAlign:'center', marginBottom:'32px'}}>
        <h1 className="title" style={{marginBottom:'8px'}}>CertChain</h1>
        <p className="subtitle" style={{color:'#6b7280', fontSize:'16px'}}>Create Issuer Account</p>
      </div>
      
      <div className="card" style={{padding:'32px'}}>
        <div style={{display:'flex',gap:12,marginBottom:24}}>
          <button 
            className="btn" 
            style={{background:'#f3f4f6',color:'#6b7280', flex:1}}
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button 
            className="btn" 
            style={{background:'#3b82f6',color:'white', flex:1}}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={onSubmit} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
          <div className="field">
            <label style={{display:'block', marginBottom:'8px', fontWeight:'500', color:'#374151'}}>
              Full Name
            </label>
            <input 
              placeholder="Enter your full name" 
              value={name} 
              onChange={e=>setName(e.target.value)} 
              required
              style={{width:'100%', padding:'12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'16px'}}
            />
          </div>
          
          <div className="field">
            <label style={{display:'block', marginBottom:'8px', fontWeight:'500', color:'#374151'}}>
              Email Address
            </label>
            <input 
              type="email"
              placeholder="Enter your email address" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              required
              style={{width:'100%', padding:'12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'16px'}}
            />
          </div>
          
          <div className="field">
            <label style={{display:'block', marginBottom:'8px', fontWeight:'500', color:'#374151'}}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="Create a secure password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required
              minLength={6}
              style={{width:'100%', padding:'12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'16px'}}
            />
          </div>
          
          <div className="field">
            <label style={{display:'block', marginBottom:'8px', fontWeight:'500', color:'#374151'}}>
              Organization
            </label>
            <input 
              placeholder="Enter your organization name" 
              value={organization} 
              onChange={e=>setOrganization(e.target.value)} 
              style={{width:'100%', padding:'12px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'16px'}}
            />
          </div>
          
          {error && (
            <div className="badge status invalid" style={{marginBottom:12, padding:'12px', borderRadius:'8px'}}>
              {error}
            </div>
          )}
          
          <button 
            className="btn" 
            disabled={loading}
            style={{
              width:'100%', 
              padding:'14px', 
              fontSize:'16px', 
              fontWeight:'600',
              background: loading ? '#9ca3af' : '#3b82f6',
              color:'white',
              border:'none',
              borderRadius:'8px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Issuer Account'}
          </button>
        </form>
        
        <div style={{marginTop:24, padding:'16px', background:'#f8fafc', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
          <div style={{fontWeight:'600', color:'#374151', marginBottom:'8px'}}>Account Type:</div>
          <div style={{color:'#6b7280', fontSize:'14px'}}>
            <strong>Issuer Account</strong> - You will be able to create and issue blockchain-verified certificates to students and professionals.
          </div>
        </div>
      </div>
    </div>
  )
}
