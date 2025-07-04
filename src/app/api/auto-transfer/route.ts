import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Auto-transfer API called')
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

    // Connect to Filecoin Calibration network
    const provider = new ethers.JsonRpcProvider('https://api.calibration.node.glif.io/rpc/v1')
    console.log('🌐 Connected to provider')

    const adminWallet = new ethers.Wallet(adminPrivateKey, provider)
    console.log('👑 Admin wallet address:', adminWallet.address)

    // Check admin balance first
    const adminBalance = await provider.getBalance(adminWallet.address)
    const adminBalanceEth = ethers.formatEther(adminBalance)
    console.log('💰 Admin balance:', adminBalanceEth, 'FIL')

    // Check if admin has enough balance (at least 0.002 FIL to be safe)
    const transferAmount = ethers.parseEther('0.001') // 0.001 tFIL
    const minRequiredBalance = ethers.parseEther('0.002') // 0.002 tFIL minimum

    if (adminBalance < minRequiredBalance) {
      console.error('❌ Admin wallet has insufficient balance')
      return NextResponse.json(
        { error: 'Admin wallet has insufficient balance for transfer' },
        { status: 400 }
      )
    }

    // Check user's current balance to confirm they need funds
    const userBalance = await provider.getBalance(userAddress)
    const userBalanceEth = ethers.formatEther(userBalance)
    console.log('👤 User current balance:', userBalanceEth, 'FIL')

    // If user already has balance > 0.0001 FIL, don't transfer
    if (userBalance > ethers.parseEther('0.0001')) {
      console.log('✅ User already has sufficient balance')
      return NextResponse.json({
        success: true,
        message: 'User already has sufficient balance',
        userBalance: userBalanceEth,
        transferSkipped: true,
      })
    }

    console.log('💸 Starting transfer of 0.001 tFIL to user...')

    // Get current gas price and estimate gas limit for Filecoin network
    const gasPrice = await provider.getFeeData()
    console.log('⛽ Current gas price:', gasPrice.gasPrice?.toString())

    // First, let's try to estimate gas to see if the transaction will work
    try {
      const gasEstimate = await provider.estimateGas({
        to: userAddress,
        value: transferAmount,
        from: adminWallet.address,
      })
      console.log('⛽ Estimated gas:', gasEstimate.toString())
    } catch (gasError: any) {
      console.warn('⚠️ Gas estimation failed:', gasError.message)
      // Continue anyway, but this gives us a warning
    }

    // Create transaction with proper gas limit for Filecoin
    const tx = await adminWallet.sendTransaction({
      to: userAddress,
      value: transferAmount,
      //   gasLimit: 10000000, // Higher gas limit for Filecoin Calibration (1M gas)
      //   gasPrice: gasPrice.gasPrice, // Use network's current gas price
    })

    console.log('⏳ Transaction sent:', tx.hash)

    // Wait for confirmation
    const receipt = await tx.wait()
    console.log('✅ Transaction confirmed:', receipt?.hash)

    // Check if transaction was successful (status = 1)
    if (receipt?.status === 0) {
      throw new Error(
        'Transaction was mined but failed (reverted). The recipient address may not be able to receive funds.'
      )
    }

    // Get updated balances
    const newAdminBalance = await provider.getBalance(adminWallet.address)
    const newUserBalance = await provider.getBalance(userAddress)

    console.log('💰 New admin balance:', ethers.formatEther(newAdminBalance), 'FIL')
    console.log('👤 New user balance:', ethers.formatEther(newUserBalance), 'FIL')

    return NextResponse.json({
      success: true,
      transactionHash: tx.hash,
      transferAmount: '0.001',
      newUserBalance: ethers.formatEther(newUserBalance),
      newAdminBalance: ethers.formatEther(newAdminBalance),
      blockNumber: receipt?.blockNumber,
      message: 'Successfully transferred 0.001 tFIL to user',
    })
  } catch (error: any) {
    console.error('❌ Error in auto-transfer:', error)

    // Handle specific error cases
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json(
        { error: 'Admin wallet has insufficient funds for transfer' },
        { status: 400 }
      )
    }

    if (error.code === 'NETWORK_ERROR') {
      return NextResponse.json({ error: 'Network connection error' }, { status: 503 })
    }

    // Check for nonce errors
    if (error.message?.includes('nonce')) {
      return NextResponse.json(
        { error: 'Transaction nonce error - please try again' },
        { status: 500 }
      )
    }

    // Check for gas estimation errors
    if (error.message?.includes('gas')) {
      return NextResponse.json(
        { error: 'Gas estimation failed - network may be congested' },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: `Transfer failed: ${error.message}` }, { status: 500 })
  }
}
