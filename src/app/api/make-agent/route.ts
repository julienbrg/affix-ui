import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

// Registry ABI for agent functions
const REGISTRY_ABI = [
  'function addAgent(address agent) external',
  'function isAgent(address agent) external view returns (bool)',
  'function entityName() external view returns (string)',
  'function admin() external view returns (address)',
]

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Make agent API called')
    const { userAddress, registryAddress } = await request.json()
    console.log('👤 User address:', userAddress)
    console.log('🏢 Registry address:', registryAddress)

    if (!userAddress) {
      return NextResponse.json({ error: 'User address is required' }, { status: 400 })
    }

    if (!registryAddress) {
      return NextResponse.json({ error: 'Registry address is required' }, { status: 400 })
    }

    // Validate Ethereum address formats
    if (!ethers.isAddress(userAddress)) {
      console.log('❌ Invalid user address format:', userAddress)
      return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 })
    }

    if (!ethers.isAddress(registryAddress)) {
      console.log('❌ Invalid registry address format:', registryAddress)
      return NextResponse.json({ error: 'Invalid registry address' }, { status: 400 })
    }

    // Get relayer private key from environment for transaction sponsorship
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY
    if (!relayerPrivateKey) {
      console.error('❌ RELAYER_PRIVATE_KEY not found in environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    console.log('✅ Relayer private key found')
    console.log('🏢 Using registry address:', registryAddress)

    // Connect to OP Mainnet
    const provider = new ethers.JsonRpcProvider('https://mainnet.optimism.io')
    console.log('🌐 Connected to provider')

    const relayerWallet = new ethers.Wallet(relayerPrivateKey, provider)
    console.log('🔗 Relayer wallet address:', relayerWallet.address)

    // Create contract instance with relayer wallet for sponsoring transactions
    const contract = new ethers.Contract(registryAddress, REGISTRY_ABI, relayerWallet)
    console.log('📄 Contract instance created')

    // Get registry info
    try {
      const registryName = await contract.entityName()
      console.log('🏢 Registry name:', registryName)
    } catch (e) {
      console.log('⚠️ Could not get registry name')
    }

    // Check if relayer wallet has permission to add agents
    try {
      const admin = await contract.admin()
      console.log('👑 Registry admin:', admin)
      console.log('🔗 Relayer wallet:', relayerWallet.address)
      console.log(
        '🔒 Is relayer wallet the registry admin?',
        admin.toLowerCase() === relayerWallet.address.toLowerCase()
      )
    } catch (e) {
      console.log('⚠️ Could not check admin status')
    }

    // Check if user is already an agent
    console.log('🔍 Checking if user is already an agent...')
    const isAlreadyAgent = await contract.isAgent(userAddress)
    console.log('📊 Is already agent:', isAlreadyAgent)

    if (isAlreadyAgent) {
      console.log('✅ User is already an agent - returning success')
      return NextResponse.json({
        success: true,
        message: 'User is already an agent',
        alreadyAgent: true,
        registryAddress: registryAddress,
      })
    }

    // User is not an agent, so make them one
    console.log('🚀 User is not an agent, calling addAgent function...')
    const addAgentTx = await contract.addAgent(userAddress)
    console.log('⏳ Add agent transaction sent:', addAgentTx.hash)

    const addAgentReceipt = await addAgentTx.wait()
    console.log('✅ Add agent transaction confirmed:', addAgentReceipt.transactionHash)

    return NextResponse.json({
      success: true,
      transactionHash: addAgentTx.hash,
      registryAddress: registryAddress,
      message: 'Successfully added as agent. Relayer will sponsor future transactions.',
      alreadyAgent: false,
    })
  } catch (error: any) {
    console.error('❌ Error making user an agent:', error)

    // Handle specific error cases
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json({ error: 'Insufficient funds for transaction' }, { status: 400 })
    }

    if (error.code === 'NETWORK_ERROR') {
      return NextResponse.json({ error: 'Network connection error' }, { status: 503 })
    }

    // Check for permission errors
    if (error.message?.includes('revert') || error.message?.includes('execution reverted')) {
      return NextResponse.json(
        { error: 'Permission denied: Admin wallet may not have permission to add agents' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: `Failed to make user an agent: ${error.message}` },
      { status: 500 }
    )
  }
}
