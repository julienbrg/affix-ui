import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

const AFFIX_REGISTRY_ADDRESS = '0xE2b7f08d9879594e69784a86c5ca07cCae86A76a'

// Registry ABI for agent functions
const REGISTRY_ABI = [
  'function addAgent(address agent) external',
  'function isAgent(address agent) external view returns (bool)',
  'function name() external view returns (string)',
  'function owner() external view returns (address)',
]

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Make agent API called')
    const { userAddress } = await request.json()
    console.log('👤 User address:', userAddress)

    if (!userAddress) {
      return NextResponse.json({ error: 'User address is required' }, { status: 400 })
    }

    // Validate Ethereum address format
    if (!ethers.isAddress(userAddress)) {
      console.log('❌ Invalid address format:', userAddress)
      return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 })
    }

    // Get admin private key from environment
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY
    if (!adminPrivateKey) {
      console.error('❌ ADMIN_PRIVATE_KEY not found in environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    console.log('✅ Admin private key found')
    console.log('🏢 Using registry address:', AFFIX_REGISTRY_ADDRESS)

    // Connect to Filecoin Calibration network
    const provider = new ethers.JsonRpcProvider('https://api.calibration.node.glif.io/rpc/v1')
    console.log('🌐 Connected to provider')

    const adminWallet = new ethers.Wallet(adminPrivateKey, provider)
    console.log('👑 Admin wallet address:', adminWallet.address)

    // Create contract instance
    const contract = new ethers.Contract(AFFIX_REGISTRY_ADDRESS, REGISTRY_ABI, adminWallet)
    console.log('📄 Contract instance created')

    // Get registry info
    try {
      const registryName = await contract.name()
      console.log('🏢 Registry name:', registryName)
    } catch (e) {
      console.log('⚠️ Could not get registry name')
    }

    // Check if admin wallet is the owner or has permission
    try {
      const owner = await contract.owner()
      console.log('👑 Registry owner:', owner)
      console.log('🔑 Admin wallet:', adminWallet.address)
      console.log(
        '🔒 Is admin the owner?',
        owner.toLowerCase() === adminWallet.address.toLowerCase()
      )
    } catch (e) {
      console.log('⚠️ Could not check ownership')
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
        registryAddress: AFFIX_REGISTRY_ADDRESS,
      })
    }

    // User is not an agent, so make them one
    console.log('🚀 User is not an agent, calling addAgent function...')
    const tx = await contract.addAgent(userAddress)
    console.log('⏳ Transaction sent:', tx.hash)

    const receipt = await tx.wait()
    console.log('✅ Transaction confirmed:', receipt.transactionHash)

    return NextResponse.json({
      success: true,
      transactionHash: tx.hash,
      registryAddress: AFFIX_REGISTRY_ADDRESS,
      message: 'Successfully added as agent',
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
