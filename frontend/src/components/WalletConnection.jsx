import { useState, useEffect } from 'react'
import useWallet from '../state/useWallet'
import useAuth from '../state/useAuth'

const WalletConnection = () => {
  const { user } = useAuth()
  const { 
    isConnected, 
    address, 
    chainId, 
    balance, 
    isConnecting, 
    error,
    connectWallet, 
    disconnectWallet,
    switchToLocalhost,
    linkWallet,
    unlinkWallet,
    getWalletStatus
  } = useWallet()

  const [showDetails, setShowDetails] = useState(false)
  const [linkedWallet, setLinkedWallet] = useState(null)
  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState('')

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleConnect = async () => {
    try {
      await connectWallet()
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
  }

  const handleSwitchNetwork = async () => {
    try {
      await switchToLocalhost()
    } catch (error) {
      console.error('Network switch failed:', error)
    }
  }

  const handleLinkWallet = async () => {
    if (!isConnected || !address) return
    
    setIsLinking(true)
    setLinkError('')
    
    try {
      const result = await linkWallet(address)
      setLinkedWallet(address)
      console.log('✅ Wallet linked successfully:', result)
    } catch (error) {
      setLinkError(error.message)
      console.error('❌ Failed to link wallet:', error)
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlinkWallet = async () => {
    setIsLinking(true)
    setLinkError('')
    
    try {
      await unlinkWallet()
      setLinkedWallet(null)
      console.log('✅ Wallet unlinked successfully')
    } catch (error) {
      setLinkError(error.message)
      console.error('❌ Failed to unlink wallet:', error)
    } finally {
      setIsLinking(false)
    }
  }

  // Load wallet status on component mount
  useEffect(() => {
    if (user) {
      getWalletStatus()
        .then(status => {
          setLinkedWallet(status.walletAddress)
        })
        .catch(error => {
          console.error('Failed to load wallet status:', error)
        })
    }
  }, [user])

  const isLocalhost = chainId === 31337 // Localhost chain ID

  if (!isConnected) {
    return (
      <div className="wallet-connection">
        <button 
          onClick={handleConnect}
          disabled={isConnecting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
        </button>
        {error && (
          <div className="mt-2 text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="wallet-connection">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">
            {formatAddress(address)}
          </span>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-500 hover:text-gray-700"
        >
          {showDetails ? '▼' : '▶'}
        </button>
        
        <button
          onClick={handleDisconnect}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Disconnect
        </button>
        
        {/* Wallet Linking Controls */}
        {user && (
          <div style={{ marginLeft: '8px' }}>
            {linkedWallet === address ? (
              <button
                onClick={handleUnlinkWallet}
                disabled={isLinking}
                className="text-green-600 hover:text-green-800 text-sm"
                style={{ 
                  padding: '4px 8px', 
                  border: '1px solid #10b981', 
                  borderRadius: '4px',
                  backgroundColor: '#f0fdf4'
                }}
              >
                {isLinking ? 'Unlinking...' : '✓ Linked'}
              </button>
            ) : (
              <button
                onClick={handleLinkWallet}
                disabled={isLinking}
                className="text-blue-600 hover:text-blue-800 text-sm"
                style={{ 
                  padding: '4px 8px', 
                  border: '1px solid #3b82f6', 
                  borderRadius: '4px',
                  backgroundColor: '#eff6ff'
                }}
              >
                {isLinking ? 'Linking...' : 'Link to Account'}
              </button>
            )}
          </div>
        )}
      </div>

      {showDetails && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
          <div className="space-y-2">
            <div>
              <span className="font-medium">Address:</span>
              <span className="ml-2 font-mono text-xs">{address}</span>
            </div>
            
            <div>
              <span className="font-medium">Network:</span>
              <span className="ml-2">
                {isLocalhost ? 'Localhost 8545' : `Chain ID: ${chainId}`}
              </span>
            </div>
            
            <div>
              <span className="font-medium">Balance:</span>
              <span className="ml-2">{balance?.toFixed(4)} ETH</span>
            </div>

            {!isLocalhost && (
              <div className="mt-2">
                <button
                  onClick={handleSwitchNetwork}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs"
                >
                  Switch to Localhost
                </button>
              </div>
            )}

            {/* Wallet Linking Status */}
            {user && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div><b>Account Status:</b></div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {linkedWallet === address ? (
                    <span style={{ color: '#10b981' }}>✓ Wallet linked to your account</span>
                  ) : linkedWallet ? (
                    <span style={{ color: '#f59e0b' }}>⚠ Different wallet linked to account</span>
                  ) : (
                    <span style={{ color: '#6b7280' }}>No wallet linked to account</span>
                  )}
                </div>
                {linkError && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {linkError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletConnection

