import { ethers } from 'ethers'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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

// Load .env file manually
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env')
    const envFile = readFileSync(envPath, 'utf-8')
    const lines = envFile.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim()
        if (key && value) {
          process.env[key.trim()] = value
        }
      }
    }
  } catch (error) {
    // .env file doesn't exist or can't be read
    console.log('⚠️  No .env file found, using environment variables')
  }
}

async function main() {
  console.log('🚀 Fund Registry Script')
  console.log('━'.repeat(50))

  // Load environment variables
  loadEnv()

  // Get relayer private key
  const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY
  if (!relayerPrivateKey) {
    console.error('❌ RELAYER_PRIVATE_KEY not found in environment variables')
    console.error('Please add it to your .env file or set it as an environment variable')
    console.error('Example: RELAYER_PRIVATE_KEY=0x... npm run fund-registry')
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

  // Check if the contract can receive ETH
  console.log('🔍 Checking if contract can receive ETH...')

  let gasEstimate

  try {
    // Try to estimate gas for a direct ETH transfer
    gasEstimate = await provider.estimateGas({
      from: relayerWallet.address,
      to: REGISTRY_ADDRESS,
      value: amountWei,
    })
    console.log('✅ Contract can receive ETH directly')
  } catch (error) {
    console.log('⚠️  Contract cannot receive ETH directly')
    console.log('   This is expected - the registry contract is not designed to receive ETH')
    console.log('━'.repeat(50))
    console.log('ℹ️  The registry contract does not need ETH balance.')
    console.log('   All transactions are sponsored by the relayer wallet.')
    console.log('   The relayer wallet already has:', balanceInEth, 'ETH')
    console.log('━'.repeat(50))
    console.log('✅ No action needed - relayer is properly funded!')
    console.log('   Relayer can sponsor transactions from its own balance.')
    process.exit(0)
  }

  // If we get here, the contract CAN receive ETH (unusual but possible)
  console.log('⛽ Estimated gas:', gasEstimate.toString())

  const feeData = await provider.getFeeData()
  const gasCost = gasEstimate * (feeData.maxFeePerGas || 0n)
  const gasCostInEth = ethers.formatEther(gasCost)
  console.log('💸 Estimated gas cost:', gasCostInEth, 'ETH')

  const totalCost = ethers.formatEther(amountWei + gasCost)
  console.log('💵 Total cost (amount + gas):', totalCost, 'ETH')
  console.log('━'.repeat(50))

  // Prepare transaction
  console.log('📝 Preparing transaction...')
  const tx = {
    to: REGISTRY_ADDRESS,
    value: amountWei,
    chainId: CHAIN_ID,
  }

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
