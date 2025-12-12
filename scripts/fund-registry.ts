import { ethers } from 'ethers'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

/**
 * Fund Registry Script
 *
 * Sends 0.0001 ETH from the relayer wallet to the registry contract.
 * This can be useful for testing or ensuring the registry has a small balance.
 */

const REGISTRY_ADDRESS = '0xa0d98DCaDab6e6FF45cd7087F8192d65aa954256'
const AMOUNT = '0.0001' // ETH
const RPC_URL = 'https://mainnet.optimism.io'
const CHAIN_ID = 10 // OP Mainnet

async function main() {
  console.log('🚀 Fund Registry Script')
  console.log('━'.repeat(50))

  // Get relayer private key
  const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY
  if (!relayerPrivateKey) {
    console.error('❌ RELAYER_PRIVATE_KEY not found in environment variables')
    console.error('Please add it to your .env file')
    process.exit(1)
  }

  // Connect to OP Mainnet
  console.log('🌐 Connecting to OP Mainnet...')
  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const relayerWallet = new ethers.Wallet(relayerPrivateKey, provider)

  console.log('🔗 Relayer wallet:', relayerWallet.address)
  console.log('📍 Registry contract:', REGISTRY_ADDRESS)
  console.log('💰 Amount to send:', AMOUNT, 'ETH')
  console.log('━'.repeat(50))

  // Check relayer balance
  const balance = await provider.getBalance(relayerWallet.address)
  const balanceInEth = ethers.formatEther(balance)
  console.log('💼 Relayer balance:', balanceInEth, 'ETH')

  const amountWei = ethers.parseEther(AMOUNT)
  if (balance < amountWei) {
    console.error('❌ Insufficient balance in relayer wallet')
    console.error(`Need: ${AMOUNT} ETH, Have: ${balanceInEth} ETH`)
    process.exit(1)
  }

  // Check registry current balance
  const registryBalance = await provider.getBalance(REGISTRY_ADDRESS)
  const registryBalanceInEth = ethers.formatEther(registryBalance)
  console.log('📊 Registry current balance:', registryBalanceInEth, 'ETH')
  console.log('━'.repeat(50))

  // Prepare transaction
  console.log('📝 Preparing transaction...')
  const tx = {
    to: REGISTRY_ADDRESS,
    value: amountWei,
    chainId: CHAIN_ID,
  }

  // Estimate gas
  const gasEstimate = await provider.estimateGas({
    from: relayerWallet.address,
    to: REGISTRY_ADDRESS,
    value: amountWei,
  })
  console.log('⛽ Estimated gas:', gasEstimate.toString())

  const feeData = await provider.getFeeData()
  const gasCost = gasEstimate * (feeData.maxFeePerGas || 0n)
  const gasCostInEth = ethers.formatEther(gasCost)
  console.log('💸 Estimated gas cost:', gasCostInEth, 'ETH')

  const totalCost = ethers.formatEther(amountWei + gasCost)
  console.log('💵 Total cost (amount + gas):', totalCost, 'ETH')
  console.log('━'.repeat(50))

  // Send transaction
  console.log('📤 Sending transaction...')
  const txResponse = await relayerWallet.sendTransaction(tx)
  console.log('⏳ Transaction sent:', txResponse.hash)
  console.log('🔗 View on explorer:', `https://optimistic.etherscan.io/tx/${txResponse.hash}`)

  // Wait for confirmation
  console.log('⏰ Waiting for confirmation...')
  const receipt = await txResponse.wait()

  if (receipt?.status === 1) {
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber)
    console.log('━'.repeat(50))

    // Check new balances
    const newRelayerBalance = await provider.getBalance(relayerWallet.address)
    const newRelayerBalanceInEth = ethers.formatEther(newRelayerBalance)
    console.log('💼 New relayer balance:', newRelayerBalanceInEth, 'ETH')

    const newRegistryBalance = await provider.getBalance(REGISTRY_ADDRESS)
    const newRegistryBalanceInEth = ethers.formatEther(newRegistryBalance)
    console.log('📊 New registry balance:', newRegistryBalanceInEth, 'ETH')

    const registryIncrease = ethers.formatEther(newRegistryBalance - registryBalance)
    console.log('📈 Registry balance increased by:', registryIncrease, 'ETH')
    console.log('━'.repeat(50))
    console.log('🎉 Success! Registry funded.')
  } else {
    console.error('❌ Transaction failed')
    process.exit(1)
  }
}

// Run the script
main()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
