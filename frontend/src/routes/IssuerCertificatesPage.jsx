import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../state/useAuth.js'
import { CertApi } from '../lib/api.js'

export default function IssuerCertificatesPage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, valid, revoked, expired
  const [revoking, setRevoking] = useState(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [selectedCert, setSelectedCert] = useState(null)

  useEffect(() => {
    if (!token) { navigate('/login') }
    if (user && user.role !== 'issuer') { navigate('/dashboard') }
  }, [token, user, navigate])

  useEffect(() => {
    if (token && user && user.role === 'issuer') {
      fetchCertificates()
    }
  }, [token, user])

  async function fetchCertificates() {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:4000/api/cert/issuer-certificates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch certificates')
      }
      
      const data = await response.json()
      setCertificates(data.certificates || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function revokeCertificate(certificateId, reason) {
    try {
      setRevoking(certificateId)
      const response = await fetch(`http://localhost:4000/api/cert/revoke/${certificateId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })
      
      if (!response.ok) {
        throw new Error('Failed to revoke certificate')
      }
      
      await fetchCertificates() // Refresh the list
      setShowRevokeModal(false)
      setRevokeReason('')
      setSelectedCert(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setRevoking(null)
    }
  }

  function openRevokeModal(cert) {
    setSelectedCert(cert)
    setShowRevokeModal(true)
  }

  function isExpired(cert) {
    if (!cert.validUntil) return false
    return new Date(cert.validUntil) < new Date()
  }

  function getCertificateStatus(cert) {
    if (cert.status === 'revoked') return 'revoked'
    if (isExpired(cert)) return 'expired'
    return 'valid'
  }

  const filteredCertificates = certificates.filter(cert => {
    const status = getCertificateStatus(cert)
    if (filter === 'all') return true
    return status === filter
  })

  const validCount = certificates.filter(cert => getCertificateStatus(cert) === 'valid').length
  const revokedCount = certificates.filter(cert => getCertificateStatus(cert) === 'revoked').length
  const expiredCount = certificates.filter(cert => getCertificateStatus(cert) === 'expired').length

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Loading certificates...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '8px 16px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
        <h1 className="title">Issued Certificates</h1>
        <p className="subtitle">Manage and monitor your issued certificates</p>
      </div>

      {error && (
        <div className="badge status invalid" style={{ marginBottom: '20px', padding: '12px' }}>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{validCount}</div>
          <div style={{ color: '#6b7280' }}>Valid Certificates</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{revokedCount}</div>
          <div style={{ color: '#6b7280' }}>Revoked</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{expiredCount}</div>
          <div style={{ color: '#6b7280' }}>Expired</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6b7280' }}>{certificates.length}</div>
          <div style={{ color: '#6b7280' }}>Total Issued</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { key: 'all', label: 'All Certificates' },
          { key: 'valid', label: 'Valid' },
          { key: 'revoked', label: 'Revoked' },
          { key: 'expired', label: 'Expired' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: filter === tab.key ? '#3b82f6' : 'white',
              color: filter === tab.key ? 'white' : '#374151',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Certificates Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0 }}>Certificate Management</h3>
        </div>
        
        {filteredCertificates.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No certificates found for the selected filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Certificate ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Recipient</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Course</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Issued On</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Valid Until</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map(cert => {
                  const status = getCertificateStatus(cert)
                  return (
                    <tr key={cert._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>{cert.certificateId}</td>
                      <td style={{ padding: '12px' }}>{cert.recipientName}</td>
                      <td style={{ padding: '12px' }}>{cert.courseName}</td>
                      <td style={{ padding: '12px' }}>{new Date(cert.issuedOn).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}>
                        {cert.validUntil ? new Date(cert.validUntil).toLocaleDateString() : 'Never'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: status === 'valid' ? '#d1fae5' : 
                                     status === 'revoked' ? '#fee2e2' : 
                                     status === 'expired' ? '#fef3c7' : '#f3f4f6',
                          color: status === 'valid' ? '#065f46' : 
                                 status === 'revoked' ? '#991b1b' : 
                                 status === 'expired' ? '#92400e' : '#374151'
                        }}>
                          {status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => window.open(`http://localhost:5173/verify?cert=${cert.certificateId}`, '_blank')}
                            style={{
                              padding: '6px 12px',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            View
                          </button>
                          {status === 'valid' && (
                            <button
                              onClick={() => openRevokeModal(cert)}
                              style={{
                                padding: '6px 12px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revoke Modal */}
      {showRevokeModal && selectedCert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Revoke Certificate</h3>
            <p style={{ margin: '0 0 16px 0', color: '#6b7280' }}>
              Are you sure you want to revoke certificate <strong>{selectedCert.certificateId}</strong>?
            </p>
            <div className="field">
              <label>Reason for revocation</label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Enter reason for revocation..."
                rows={3}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowRevokeModal(false)
                  setRevokeReason('')
                  setSelectedCert(null)
                }}
                style={{
                  padding: '8px 16px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => revokeCertificate(selectedCert.certificateId, revokeReason)}
                disabled={revoking === selectedCert.certificateId || !revokeReason.trim()}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: revoking === selectedCert.certificateId || !revokeReason.trim() ? 'not-allowed' : 'pointer',
                  opacity: revoking === selectedCert.certificateId || !revokeReason.trim() ? 0.5 : 1
                }}
              >
                {revoking === selectedCert.certificateId ? 'Revoking...' : 'Revoke Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
