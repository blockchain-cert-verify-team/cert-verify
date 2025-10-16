import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../state/useAuth.js'
import useWallet from '../state/useWallet.js'
import { CertApi, AuthApi } from '../lib/api.js'

export default function DashboardPage(){
  const { token, user, setAuth } = useAuth()
  const { isConnected, address, chainId, connectWallet, issueCertificate, loadContractABI } = useWallet()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    certificateId: '',
    recipientName: '',
    recipientEmail: '',
    courseName: '',
    issuedOn: new Date().toISOString().slice(0,10),
    validUntil: '', // Add expiration date field
  })
  const [submitting,setSubmitting]=useState(false)
  const [result,setResult]=useState(null)
  const [error,setError]=useState('')
  const [activeTab, setActiveTab] = useState('issue') // issue, certificates

  useEffect(()=>{
    if(!token){ navigate('/login') }
    if(user && user.role === 'admin'){ navigate('/admin') }
  },[token,user,navigate])

  useEffect(()=>{
    async function fetchMe(){
      if(token && !user){
        try{ const res = await AuthApi.me(); setAuth({ token, user: { id: res.user.sub, role: res.user.role, email: res.user.email, name: res.user.email.split('@')[0] } }) }
        catch(_){}
      }
    }
    fetchMe()
  },[token,user,setAuth])

  function updateField(e){
    const { name, value } = e.target
    setForm(prev=>({ ...prev, [name]: value }))
  }

  async function onSubmit(e){
    e.preventDefault()
    setSubmitting(true); setError(''); setResult(null)
    try{
      // If wallet is connected, issue on blockchain via MetaMask first
      let blockchainResult = null
      if (isConnected && address) {
        try {
          console.log('🦊 Issuing certificate on blockchain via MetaMask...')
          
          // Load contract ABI if not already loaded
          await loadContractABI()
          
          // Convert validUntil to timestamp
          const validUntilTimestamp = form.validUntil 
            ? Math.floor(new Date(form.validUntil).getTime() / 1000)
            : Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year from now
          
          // Issue on blockchain via MetaMask first
          blockchainResult = await issueCertificate(
            form.recipientName.trim(),
            form.courseName.trim(),
            validUntilTimestamp,
            '' // Empty IPFS hash for now, will be updated after backend processing
          )
          
          console.log('✅ MetaMask blockchain transaction successful:', blockchainResult)
        } catch (blockchainError) {
          console.error('❌ MetaMask blockchain transaction failed:', blockchainError)
          throw new Error(`Blockchain transaction failed: ${blockchainError.message}`)
        }
      }
      
      // Issue certificate in database (backend will handle IPFS and email)
      const payload = {
        certificateId: form.certificateId.trim(),
        recipientName: form.recipientName.trim(),
        recipientEmail: form.recipientEmail.trim() || undefined,
        courseName: form.courseName.trim(),
        issuedOn: form.issuedOn,
        validUntil: form.validUntil || undefined,
        useMetaMask: isConnected && address, // Flag to indicate MetaMask is being used
        blockchainTxHash: blockchainResult?.hash // Pass the transaction hash if available
      }
      const res = await CertApi.issue(payload)
      
      // If we have a blockchain result, update the response
      if (blockchainResult) {
        setResult({
          ...res,
          blockchainTxHash: blockchainResult.hash,
          blockchainBlockNumber: blockchainResult.blockNumber,
          blockchainGasUsed: blockchainResult.gasUsed
        })
      } else {
        setResult(res)
      }
    }catch(err){
      setError(err.response?.data?.message || 'Failed to issue certificate')
    }finally{ setSubmitting(false) }
  }

  return (
    <div>
      <h1 className="title">Issuer Dashboard</h1>
      <p className="subtitle">Issue and manage blockchain certificates</p>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('issue')}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: activeTab === 'issue' ? '#3b82f6' : 'white',
            color: activeTab === 'issue' ? 'white' : '#374151',
            cursor: 'pointer'
          }}
        >
          Issue Certificate
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: activeTab === 'certificates' ? '#3b82f6' : 'white',
            color: activeTab === 'certificates' ? 'white' : '#374151',
            cursor: 'pointer'
          }}
        >
          View Certificates
        </button>
      </div>

      {activeTab === 'issue' && (
        <div className="grid two">
          <div className="card">
            <h3>Issue New Certificate</h3>
            
            {/* Wallet Connection Status */}
            <div style={{ 
              padding: '12px', 
              marginBottom: '16px', 
              borderRadius: '8px', 
              backgroundColor: isConnected ? '#f0f9ff' : '#fef3c7',
              border: `1px solid ${isConnected ? '#0ea5e9' : '#f59e0b'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: isConnected ? '#10b981' : '#f59e0b' 
                }}></div>
                <span style={{ fontWeight: '500', color: isConnected ? '#0c4a6e' : '#92400e' }}>
                  {isConnected ? `Connected to ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'MetaMask not connected'}
                </span>
              </div>
              {!isConnected && (
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#92400e' }}>
                  Connect MetaMask to issue certificates on the blockchain
                </p>
              )}
            </div>
            
            <form onSubmit={onSubmit}>
              <div className="field">
                <label>Student Name</label>
                <input name="recipientName" placeholder="Enter student name" value={form.recipientName} onChange={updateField} />
              </div>
              <div className="field">
                <label>Course</label>
                <input name="courseName" placeholder="Enter course name" value={form.courseName} onChange={updateField} />
              </div>
              <div className="field">
                <label>Date of Issue</label>
                <input type="date" name="issuedOn" value={form.issuedOn} onChange={updateField} />
              </div>
              <div className="field">
                <label>Valid Until (optional)</label>
                <input type="date" name="validUntil" value={form.validUntil} onChange={updateField} />
                <small style={{ color: '#6b7280' }}>Leave empty for no expiration</small>
              </div>
              <div className="field">
                <label>Certificate ID</label>
                <input name="certificateId" placeholder="e.g., CERT-12345678" value={form.certificateId} onChange={updateField} />
              </div>
              <div className="field">
                <label>Recipient Email (optional)</label>
                <input name="recipientEmail" placeholder="name@example.com" value={form.recipientEmail} onChange={updateField} />
              </div>
              {error && <div className="badge status invalid" style={{marginBottom:12}}>{error}</div>}
              <button className="btn" disabled={submitting}>{submitting?'Issuing...':'Issue Certificate'}</button>
            </form>
          </div>

          <div className="card">
            <h3>Result</h3>
            {!result && <p style={{color:'#6b7280'}}>Issue a certificate to see QR code and verification details here.</p>}
            {result && (
              <div>
                <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:16}}>
                  <span className={`badge status ${result.certificate?.status==='valid'?'valid':'invalid'}`}>{result.certificate?.status?.toUpperCase()}</span>
                  {result.blockchainTxHash && <a className="badge" href={`https://sepolia.etherscan.io/tx/${result.blockchainTxHash}`} target="_blank" rel="noreferrer">View Tx</a>}
                  {result.blockchainError && <span className="badge" style={{backgroundColor:'#ef4444',color:'white'}}>Blockchain Error</span>}
                </div>
                {result.qr && (
                  <img src={result.qr} alt="Certificate QR" style={{width:200,height:200,background:'#fff',padding:8,borderRadius:12,border:'1px solid #e5e7eb'}} />
                )}
                <div style={{marginTop:12}}>
                  <div><b>Verify URL:</b> <a href={result.verifyUrl} target="_blank" rel="noreferrer">Open</a></div>
                  <div><b>IPFS Hash:</b> {result.ipfsHash || '—'}</div>
                  <div><b>Student Hash:</b> {result.studentHash || '—'}</div>
                  
                  {/* Blockchain Information */}
                  {result.blockchainTxHash && (
                    <div style={{marginTop:12,padding:12,backgroundColor:'#f0f9ff',borderRadius:8,border:'1px solid #0ea5e9'}}>
                      <h4 style={{margin:'0 0 8px 0',color:'#0c4a6e'}}>🦊 Blockchain Transaction</h4>
                      <div><b>Transaction Hash:</b> <a href={`https://sepolia.etherscan.io/tx/${result.blockchainTxHash}`} target="_blank" rel="noreferrer">{result.blockchainTxHash.slice(0,10)}...</a></div>
                      <div><b>Block Number:</b> {result.blockchainBlockNumber}</div>
                      <div><b>Gas Used:</b> {result.blockchainGasUsed}</div>
                    </div>
                  )}
                  
                  {result.blockchainError && (
                    <div style={{marginTop:12,padding:12,backgroundColor:'#fef2f2',borderRadius:8,border:'1px solid #ef4444'}}>
                      <h4 style={{margin:'0 0 8px 0',color:'#991b1b'}}>❌ Blockchain Error</h4>
                      <div style={{color:'#991b1b',fontSize:'14px'}}>{result.blockchainError}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'certificates' && (
        <div>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            Click "View Certificates" to see all your issued certificates with management options.
          </p>
          <button
            onClick={() => navigate('/issuer-certificates')}
            className="btn"
            style={{ background: '#3b82f6' }}
          >
            View All Certificates
          </button>
        </div>
      )}
    </div>
  )
}


