import { useState } from 'react'
import { CertApi } from '../lib/api.js'
import { Scanner } from '@yudiel/react-qr-scanner'

export default function VerifyPage(){
  const [certificateId,setCertificateId]=useState('')
  const [verifying,setVerifying]=useState(false)
  const [result,setResult]=useState(null)
  const [error,setError]=useState('')
  const [showScanner,setShowScanner]=useState(false)

  async function verifyId(){
    setVerifying(true); setError(''); setResult(null)
    try{ const res = await CertApi.verifyById(certificateId.trim()); setResult(res) }
    catch(err){ setError(err.response?.data?.message || 'Verification failed') }
    finally{ setVerifying(false) }
  }

  async function onScan(data){
    if(!data) return
    try{
      const res = await CertApi.verifyQr(typeof data==='string'?data:JSON.stringify(data))
      setResult(res)
      setShowScanner(false)
    }catch(err){ setError('Invalid QR or verification failed') }
  }

  return (
    <div style={{maxWidth:720, margin:'0 auto'}}>
      <h1 className="title">Certificate Verification</h1>
      <p className="subtitle">Enter a certificate ID to verify its authenticity</p>

      <div className="grid two">
        <div className="card">
          <div className="field" style={{display:'flex',gap:12,alignItems:'center'}}>
            <input placeholder="e.g., CERT-12345678" value={certificateId} onChange={e=>setCertificateId(e.target.value)} />
            <button className="btn" onClick={verifyId} disabled={verifying || !certificateId}> {verifying?'Verifying...':'Verify'} </button>
          </div>
          <div style={{margin:'12px 0',textAlign:'center',color:'#6b7280'}}>or</div>
          <div className="card" style={{background:'#eff6ff'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:700,marginBottom:4}}>QR Code Scanning</div>
                <div style={{color:'#6b7280'}}>Use your mobile camera to scan certificate QR codes</div>
              </div>
              <button className="btn secondary" onClick={()=>setShowScanner(v=>!v)}>{showScanner?'Close Scanner':'Open Camera Scanner'}</button>
            </div>
            {showScanner && (
              <div style={{marginTop:12}}>
                <Scanner onDecode={onScan} onError={()=>{}} style={{width:'100%'}}/>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Status</h3>
          {!result && <p style={{color:'#6b7280'}}>Enter an ID or scan a QR code to see verification details.</p>}
          {error && <div className="badge status invalid" style={{marginBottom:12}}>{error}</div>}
          {result && (
            <div>
              <div className={`badge status ${result.isValid?'valid':'invalid'}`} style={{marginBottom:12}}>
                {result.isValid?'VALID':'INVALID'}
              </div>
              <div><b>Certificate ID:</b> {result.certificate?.certificateId}</div>
              <div><b>Recipient:</b> {result.certificate?.recipientName}</div>
              <div><b>Course:</b> {result.certificate?.courseName}</div>
              <div><b>Issued On:</b> {result.certificate ? new Date(result.certificate.issuedOn).toDateString() : '—'}</div>
              {result.certificate?.ipfsHash && <div><b>IPFS:</b> {result.certificate.ipfsHash}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


