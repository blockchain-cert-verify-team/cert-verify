import { create } from 'zustand'
import { ethers } from 'ethers'

const useWallet = create((set, get) => ({
  // Wallet state
  isConnected: false,
  address: null,
  chainId: null,
  balance: null,
  isConnecting: false,
  error: null,

  // Contract info
  contractAddress: '0x7988Ac7787ceBf2946c90E5bB93873fdAc3d818A', // Sepolia contract
  contractABI: null,

  // Actions
  connectWallet: async () => {
    set({ isConnecting: true, error: null })
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const address = accounts[0]
      
      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      })

      // Get balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })

      set({
        isConnected: true,
        address,
        chainId: parseInt(chainId, 16),
        balance: parseInt(balance, 16) / Math.pow(10, 18), // Convert wei to ETH
        isConnecting: false,
        error: null
      })

      // Set up event listeners
      get().setupEventListeners()

      // Auto-link wallet if not already linked
      try {
        await get().getWalletStatus()
      } catch (error) {
        console.log('Wallet not linked, will need to link manually')
      }

      return { address, chainId: parseInt(chainId, 16) }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      set({
        isConnected: false,
        address: null,
        chainId: null,
        balance: null,
        isConnecting: false,
        error: error.message
      })
      throw error
    }
  },

  disconnectWallet: () => {
    set({
      isConnected: false,
      address: null,
      chainId: null,
      balance: null,
      error: null
    })
  },

  switchToSepolia: async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia 11155111
      })
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xaa36a7', // 11155111 in hex
                chainName: 'Sepolia',
                rpcUrls: ['https://sepolia.infura.io/v3/77500932fa5142a88b06de9ac9a9c8c1'],
                nativeCurrency: {
                  name: 'SepoliaETH',
                  symbol: 'SepoliaETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          })
        } catch (addError) {
          throw new Error('Failed to add Sepolia network to MetaMask')
        }
      } else {
        throw switchError
      }
    }
  },

  switchToLocalhost: async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // Localhost 31337
      })
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7a69', // 31337 in hex
                chainName: 'Localhost 8545',
                rpcUrls: ['http://localhost:8545'],
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: [],
              },
            ],
          })
        } catch (addError) {
          throw new Error('Failed to add Localhost network to MetaMask')
        }
      } else {
        throw switchError
      }
    }
  },

  setupEventListeners: () => {
    if (!window.ethereum) return

    // Listen for account changes
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        get().disconnectWallet()
      } else {
        get().connectWallet()
      }
    })

    // Listen for chain changes
    window.ethereum.on('chainChanged', (chainId) => {
      set({ chainId: parseInt(chainId, 16) })
    })
  },

  // Contract interaction methods
  issueCertificate: async (holderName, courseName, validUntil, ipfsHash) => {
    if (!get().isConnected) {
      throw new Error('Wallet not connected')
    }

    try {
      // Ensure we're on Sepolia
      await get().switchToSepolia()

      // Load contract ABI (you'll need to add this)
      const contractABI = get().contractABI
      if (!contractABI) {
        throw new Error('Contract ABI not loaded')
      }

      // Create contract instance
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(get().contractAddress, contractABI, signer)

      // Call the issueCertificate function
      const tx = await contract.issueCertificate(holderName, courseName, validUntil, ipfsHash)
      
      // Wait for transaction to be mined
      const receipt = await tx.wait()
      
      return {
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      }
    } catch (error) {
      console.error('Error issuing certificate on blockchain:', error)
      throw error
    }
  },

  // Load contract ABI
  loadContractABI: async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/cert/contract/abi`)
      const abi = await response.json()
      set({ contractABI: abi })
      return abi
    } catch (error) {
      console.error('Error loading contract ABI:', error)
      throw error
    }
  },

  // Link wallet to user account
  linkWallet: async (walletAddress) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/cert/link-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('certchain_token')}`
        },
        body: JSON.stringify({ walletAddress })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }
      
      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error linking wallet:', error)
      throw error
    }
  },

  // Unlink wallet from user account
  unlinkWallet: async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/cert/unlink-wallet`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('certchain_token')}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }
      
      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error unlinking wallet:', error)
      throw error
    }
  },

  // Get wallet status from server
  getWalletStatus: async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/cert/wallet-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('certchain_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to get wallet status')
      }
      
      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error getting wallet status:', error)
      throw error
    }
  }
}))

export default useWallet

