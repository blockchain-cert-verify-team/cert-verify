import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthApi } from '../lib/api.js'
import useAuth from '../state/useAuth.js'

export default function AdminPage(){
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, pending, approved, rejected

  useEffect(() => {
    if(!token){ navigate('/login') }
    if(user && user.role !== 'admin'){ navigate('/dashboard') }
  }, [token, user, navigate])

  useEffect(() => {
    if(token && user && user.role === 'admin') {
      fetchUsers()
    }
  }, [token, user])

  async function fetchUsers(){
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch(err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function approveUser(userId){
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/admin/issuers/${userId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to approve user')
      }
      
      await fetchUsers() // Refresh the list
    } catch(err) {
      setError(err.message)
    }
  }

  async function rejectUser(userId){
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/admin/issuers/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to reject user')
      }
      
      await fetchUsers() // Refresh the list
    } catch(err) {
      setError(err.message)
    }
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true
    if (filter === 'pending') return user.approvalStatus === 'pending'
    if (filter === 'approved') return user.approvalStatus === 'approved'
    if (filter === 'rejected') return user.approvalStatus === 'rejected'
    return true
  })

  const pendingCount = users.filter(u => u.approvalStatus === 'pending').length
  const approvedCount = users.filter(u => u.approvalStatus === 'approved').length
  const rejectedCount = users.filter(u => u.approvalStatus === 'rejected').length

  if (loading) {
    return (
      <div style={{maxWidth:1200, margin:'0 auto', padding:'20px'}}>
        <div style={{textAlign:'center', padding:'40px'}}>
          <div>Loading admin dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{maxWidth:1200, margin:'0 auto', padding:'20px'}}>
      <div style={{marginBottom:'32px'}}>
        <h1 className="title">Admin Dashboard</h1>
        <p className="subtitle">Manage Issuer Accounts and Approvals</p>
      </div>

      {error && (
        <div className="badge status invalid" style={{marginBottom:'20px', padding:'12px'}}>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px', marginBottom:'32px'}}>
        <div className="card" style={{textAlign:'center', padding:'20px'}}>
          <div style={{fontSize:'24px', fontWeight:'bold', color:'#3b82f6'}}>{pendingCount}</div>
          <div style={{color:'#6b7280'}}>Pending Approval</div>
        </div>
        <div className="card" style={{textAlign:'center', padding:'20px'}}>
          <div style={{fontSize:'24px', fontWeight:'bold', color:'#10b981'}}>{approvedCount}</div>
          <div style={{color:'#6b7280'}}>Approved Issuers</div>
        </div>
        <div className="card" style={{textAlign:'center', padding:'20px'}}>
          <div style={{fontSize:'24px', fontWeight:'bold', color:'#ef4444'}}>{rejectedCount}</div>
          <div style={{color:'#6b7280'}}>Rejected</div>
        </div>
        <div className="card" style={{textAlign:'center', padding:'20px'}}>
          <div style={{fontSize:'24px', fontWeight:'bold', color:'#6b7280'}}>{users.length}</div>
          <div style={{color:'#6b7280'}}>Total Users</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{display:'flex', gap:'8px', marginBottom:'24px'}}>
        {[
          { key: 'all', label: 'All Users' },
          { key: 'pending', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding:'8px 16px',
              border:'1px solid #d1d5db',
              borderRadius:'6px',
              background: filter === tab.key ? '#3b82f6' : 'white',
              color: filter === tab.key ? 'white' : '#374151',
              cursor:'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="card" style={{padding:'0', overflow:'hidden'}}>
        <div style={{padding:'20px', borderBottom:'1px solid #e5e7eb'}}>
          <h3 style={{margin:0}}>User Management</h3>
        </div>
        
        {filteredUsers.length === 0 ? (
          <div style={{padding:'40px', textAlign:'center', color:'#6b7280'}}>
            No users found for the selected filter.
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f8fafc'}}>
                  <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #e5e7eb'}}>Name</th>
                  <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #e5e7eb'}}>Email</th>
                  <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #e5e7eb'}}>Organization</th>
                  <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #e5e7eb'}}>Role</th>
                  <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #e5e7eb'}}>Status</th>
                  <th style={{padding:'12px', textAlign:'left', borderBottom:'1px solid #e5e7eb'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id} style={{borderBottom:'1px solid #f3f4f6'}}>
                    <td style={{padding:'12px'}}>{user.name}</td>
                    <td style={{padding:'12px'}}>{user.email}</td>
                    <td style={{padding:'12px'}}>{user.organization || 'N/A'}</td>
                    <td style={{padding:'12px'}}>
                      <span style={{
                        padding:'4px 8px',
                        borderRadius:'4px',
                        fontSize:'12px',
                        fontWeight:'500',
                        background: user.role === 'admin' ? '#fef3c7' : user.role === 'issuer' ? '#dbeafe' : '#f3f4f6',
                        color: user.role === 'admin' ? '#92400e' : user.role === 'issuer' ? '#1e40af' : '#374151'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{padding:'12px'}}>
                      <span style={{
                        padding:'4px 8px',
                        borderRadius:'4px',
                        fontSize:'12px',
                        fontWeight:'500',
                        background: user.approvalStatus === 'approved' ? '#d1fae5' : 
                                   user.approvalStatus === 'pending' ? '#fef3c7' : 
                                   user.approvalStatus === 'rejected' ? '#fee2e2' : '#f3f4f6',
                        color: user.approvalStatus === 'approved' ? '#065f46' : 
                               user.approvalStatus === 'pending' ? '#92400e' : 
                               user.approvalStatus === 'rejected' ? '#991b1b' : '#374151'
                      }}>
                        {user.approvalStatus || 'none'}
                      </span>
                    </td>
                    <td style={{padding:'12px'}}>
                      {user.role === 'issuer' && user.approvalStatus === 'pending' && (
                        <div style={{display:'flex', gap:'8px'}}>
                          <button
                            onClick={() => approveUser(user._id)}
                            style={{
                              padding:'6px 12px',
                              background:'#10b981',
                              color:'white',
                              border:'none',
                              borderRadius:'4px',
                              cursor:'pointer',
                              fontSize:'12px'
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectUser(user._id)}
                            style={{
                              padding:'6px 12px',
                              background:'#ef4444',
                              color:'white',
                              border:'none',
                              borderRadius:'4px',
                              cursor:'pointer',
                              fontSize:'12px'
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {user.role === 'issuer' && user.approvalStatus === 'approved' && (
                        <span style={{color:'#10b981', fontSize:'12px'}}>✓ Approved</span>
                      )}
                      {user.role === 'issuer' && user.approvalStatus === 'rejected' && (
                        <span style={{color:'#ef4444', fontSize:'12px'}}>✗ Rejected</span>
                      )}
                      {user.role === 'admin' && (
                        <span style={{color:'#6b7280', fontSize:'12px'}}>Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
