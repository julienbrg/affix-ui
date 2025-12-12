import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

/**
 * Setup Delegation Endpoint
 *
 * This endpoint receives an EIP-7702 authorization from an agent
 * and submits it to the network via the relayer.
 *
 * After this is done once, the agent can issue documents without paying gas.
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Setup delegation API called')
    const { agentAddress, registryAddress, authorization } = await request.json()

    console.log('👤 Agent address:', agentAddress)
    console.log('🏢 Registry address:', registryAddress)

    // Validate inputs
    if (!agentAddress || !ethers.isAddress(agentAddress)) {
      return NextResponse.json({ error: 'Valid agent address is required' }, { status: 400 })
    }

    if (!registryAddress || !ethers.isAddress(registryAddress)) {
      return NextResponse.json({ error: 'Valid registry address is required' }, { status: 400 })
    }

    if (!authorization) {
      return NextResponse.json({ error: 'Authorization is required' }, { status: 400 })
    }

    // Validate authorization structure
    const { isValidAuthorization } = await import('@/lib/eip7702')
    if (!isValidAuthorization(authorization)) {
      return NextResponse.json({ error: 'Invalid authorization format' }, { status: 400 })
    }

    // Get relayer private key
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY
    if (!relayerPrivateKey) {
      console.error('❌ RELAYER_PRIVATE_KEY not found in environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Connect to OP Mainnet
    const provider = new ethers.JsonRpcProvider('https://mainnet.optimism.io')
    const relayerWallet = new ethers.Wallet(relayerPrivateKey, provider)
    console.log('🔗 Relayer wallet:', relayerWallet.address)

    // Create an EIP-7702 transaction that sets up the delegation
    // This is a "no-op" transaction that just establishes the delegation
    console.log('📤 Submitting EIP-7702 delegation transaction...')

    const tx = {
      type: 4, // EIP-7702 transaction type
      to: agentAddress, // Agent's address
      data: '0x', // Empty data - just setting up delegation
      value: 0,
      gasLimit: 100000,
      authorizationList: [authorization],
    }

    const txResponse = await relayerWallet.sendTransaction(tx)
    console.log('⏳ Transaction sent:', txResponse.hash)

    const receipt = await txResponse.wait()
    console.log('✅ Delegation transaction confirmed in block:', receipt?.blockNumber)

    return NextResponse.json({
      success: true,
      transactionHash: txResponse.hash,
      message: 'Delegation set up successfully. Agent can now issue documents without ETH.',
      delegationActive: true,
    })
  } catch (error: any) {
    console.error('❌ Error setting up delegation:', error)

    if (error.code === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json(
        { error: 'Relayer has insufficient funds' },
        { status: 400 }
      )
    }

    if (error.code === 'NETWORK_ERROR') {
      return NextResponse.json({ error: 'Network connection error' }, { status: 503 })
    }

    if (error.message?.includes('revert') || error.message?.includes('execution reverted')) {
      return NextResponse.json(
        { error: 'Delegation transaction reverted - check authorization signature' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: `Failed to set up delegation: ${error.message}` },
      { status: 500 }
    )
  }
}
