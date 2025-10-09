import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../state/useAuth.js'
import { CertApi, AuthApi } from '../lib/api.js'

export default function DashboardPage(){
  const { token, user, setAuth } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    certificateId: '',
    recipientName: '',
    recipientEmail: '',
    courseName: '',
    issuedOn: new Date().toISOString().slice(0,10),
  })
  const [submitting,setSubmitting]=useState(false)
  const [result,setResult]=useState(null)
  const [error,setError]=useState('')

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
      const payload = {
        certificateId: form.certificateId.trim(),
        recipientName: form.recipientName.trim(),
        recipientEmail: form.recipientEmail.trim() || undefined,
        courseName: form.courseName.trim(),
        issuedOn: form.issuedOn,
      }
      const res = await CertApi.issue(payload)
      setResult(res)
    }catch(err){
      setError(err.response?.data?.message || 'Failed to issue certificate')
    }finally{ setSubmitting(false) }
  }

  return (
    <div>
      <h1 className="title">Issuer Dashboard</h1>
      <p className="subtitle">Issue blockchain certificates to students</p>

      <div className="grid two">
        <div className="card">
          <h3>Issue New Certificate</h3>
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
              </div>
              {result.qr && (
                <img src={result.qr} alt="Certificate QR" style={{width:200,height:200,background:'#fff',padding:8,borderRadius:12,border:'1px solid #e5e7eb'}} />
              )}
              <div style={{marginTop:12}}>
                <div><b>Verify URL:</b> <a href={result.verifyUrl} target="_blank" rel="noreferrer">Open</a></div>
                <div><b>IPFS Hash:</b> {result.ipfsHash || '—'}</div>
                <div><b>Student Hash:</b> {result.studentHash || '—'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


