import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

/**
 * Sponsored Transaction Endpoint
 *
 * This endpoint accepts a request to issue a document on behalf of an agent.
 * The agent must have already set up EIP-7702 delegation via /api/setup-delegation
 *
 * The relayer will:
 * 1. Verify the agent is authorized
 * 2. Call the contract function
 * 3. Pay for gas fees
 *
 * Because of EIP-7702 delegation, msg.sender will be the agent's address,
 * so the document will be correctly attributed to the agent.
 */

const REGISTRY_ABI = [
  'function issueDocument(string memory cid) external',
  'function issueDocumentWithMetadata(string memory cid, string memory metadata) external',
  'function isAgent(address agent) external view returns (bool)',
]

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Sponsored transaction API called')
    const { agentAddress, registryAddress, functionName, args } = await request.json()

    console.log('👤 Agent address:', agentAddress)
    console.log('🏢 Registry address:', registryAddress)
    console.log('📞 Function name:', functionName)
    console.log('📋 Arguments:', args)

    // Validate inputs
    if (!agentAddress || !ethers.isAddress(agentAddress)) {
      return NextResponse.json({ error: 'Valid agent address is required' }, { status: 400 })
    }

    if (!registryAddress || !ethers.isAddress(registryAddress)) {
      return NextResponse.json({ error: 'Valid registry address is required' }, { status: 400 })
    }

    if (!functionName) {
      return NextResponse.json({ error: 'Function name is required' }, { status: 400 })
    }

    // Get relayer private key for transaction sponsorship
    const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY
    if (!relayerPrivateKey) {
      console.error('❌ RELAYER_PRIVATE_KEY not found in environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Connect to OP Mainnet
    const provider = new ethers.JsonRpcProvider('https://mainnet.optimism.io')
    const relayerWallet = new ethers.Wallet(relayerPrivateKey, provider)
    console.log('🔗 Relayer wallet:', relayerWallet.address)

    // Verify the agent is authorized
    const contract = new ethers.Contract(registryAddress, REGISTRY_ABI, provider)
    const isAgent = await contract.isAgent(agentAddress)

    if (!isAgent) {
      console.error('❌ Address is not an authorized agent')
      return NextResponse.json({ error: 'Agent is not authorized' }, { status: 403 })
    }

    console.log('✅ Agent is authorized')

    // Create contract instance pointing to the AGENT's address (not registry)
    // This is the key insight of EIP-7702: we call the agent's address,
    // which has delegated its code to the registry contract
    const delegatedContract = new ethers.Contract(agentAddress, REGISTRY_ABI, relayerWallet)

    console.log('📤 Calling contract function via delegated agent address...')

    // Call the function - relayer pays gas, but msg.sender will be agentAddress
    let tx
    if (functionName === 'issueDocument') {
      tx = await delegatedContract.issueDocument(args[0], {
        gasLimit: 300000,
      })
    } else if (functionName === 'issueDocumentWithMetadata') {
      tx = await delegatedContract.issueDocumentWithMetadata(args[0], args[1], {
        gasLimit: 350000,
      })
    } else {
      return NextResponse.json({ error: 'Unsupported function' }, { status: 400 })
    }

    console.log('⏳ Transaction sent:', tx.hash)

    const receipt = await tx.wait()
    console.log('✅ Transaction confirmed in block:', receipt?.blockNumber)

    return NextResponse.json({
      success: true,
      transactionHash: tx.hash,
      message: 'Document issued successfully (gas sponsored by relayer)',
      sponsored: true,
    })
  } catch (error: any) {
    console.error('❌ Error sponsoring transaction:', error)

    if (error.code === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json(
        { error: 'Relayer has insufficient funds to sponsor transaction' },
        { status: 400 }
      )
    }

    if (error.code === 'NETWORK_ERROR') {
      return NextResponse.json({ error: 'Network connection error' }, { status: 503 })
    }

    if (error.message?.includes('revert') || error.message?.includes('execution reverted')) {
      return NextResponse.json(
        {
          error: 'Transaction reverted. Agent may not have set up delegation or lacks permission.',
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: `Failed to sponsor transaction: ${error.message}` },
      { status: 500 }
    )
  }
}
