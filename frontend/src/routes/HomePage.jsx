import { Link } from 'react-router-dom'

export default function HomePage(){
  return (
    <div>
      <h1 className="title">CertChain</h1>
      <p className="subtitle">Issuer Authentication</p>

      <div className="grid two" style={{marginTop:24}}>
        <div className="card">
          <div className="badge">Issue Certificates</div>
          <h2>Create and issue blockchain-verified certificates</h2>
          <p style={{color:'#6b7280'}}>Create and issue blockchain-verified certificates to students and professionals</p>
          <Link to="/login" className="btn" style={{marginTop:12}}>Go to Issuer Dashboard</Link>
        </div>
        <div className="card">
          <div className="badge">Scan QR Codes</div>
          <h2>Use your mobile camera to scan certificate QR codes</h2>
          <p style={{color:'#6b7280'}}>Instant verification using blockchain-backed data</p>
          <Link to="/verify" className="btn secondary" style={{marginTop:12}}>Open Camera Scanner</Link>
        </div>
      </div>
    </div>
  )
}

