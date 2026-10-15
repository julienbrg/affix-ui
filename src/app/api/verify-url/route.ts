import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { NETWORK_CONFIGS, DEFAULT_NETWORK } from '@/lib/contracts'

// Registry ABI to get the URL
const REGISTRY_ABI = ['function entityUrl() external view returns (string)']

async function verifyUrl(address: string) {
  console.log('🔧 Starting verification process for address:', address)

  // Validate Ethereum address format
  if (!ethers.isAddress(address)) {
    console.log('❌ Invalid address format:', address)
    throw new Error('Invalid Ethereum address')
  }
  console.log('✅ Address format is valid')

  const network = NETWORK_CONFIGS[DEFAULT_NETWORK]
  console.log(`🌐 Connecting to ${network.name}...`)
  const provider = new ethers.JsonRpcProvider(network.rpcUrl)

  // Create contract instance
  const contract = new ethers.Contract(address, REGISTRY_ABI, provider)
  console.log('📄 Contract instance created successfully')

  // Get the URL from the registry contract
  let registryUrl: string
  try {
    console.log('📖 Reading URL from registry contract...')
    registryUrl = await contract.entityUrl()
    console.log('🌐 URL from registry:', registryUrl)
  } catch (error: any) {
    console.error('❌ Failed to get URL from registry contract:', error.message)
    throw new Error(
      'Failed to read URL from registry contract. Contract may not have entityUrl() function.'
    )
  }

  if (!registryUrl || registryUrl.trim() === '') {
    console.log('❌ No URL found in registry contract')
    throw new Error('No URL found in registry contract')
  }
  console.log('✅ URL successfully retrieved from contract')

  // Call the Rukh API to fetch the webpage content
  const rukhApiUrl = `https://rukh.w3hc.org/web-reader?url=${encodeURIComponent(registryUrl)}`
  console.log('📞 Calling Rukh API with URL:', rukhApiUrl)

  const response = await fetch(rukhApiUrl, {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  })

  console.log('📡 Rukh API response status:', response.status, response.statusText)

  if (!response.ok) {
    console.error('❌ Rukh API response not ok:', response.status, response.statusText)
    throw new Error(`Failed to fetch webpage content: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  console.log('📄 Rukh API response received, content length:', data?.content?.length || 0)

  // Check if the response has the expected structure
  if (!data || typeof data.content !== 'string') {
    console.error('❌ Invalid response structure from Rukh API:', typeof data?.content)
    throw new Error('Invalid response from webpage reader')
  }
  console.log('✅ Rukh API response structure is valid')

  // Search for the registry address in the content (case-insensitive)
  const content = data.content.toLowerCase()
  const searchAddress = address.toLowerCase()

  console.log('🔍 Searching for address in content...')
  console.log('🔍 Search address:', searchAddress)
  console.log('🔍 Content length:', content.length)
  console.log('🔍 Content preview (first 500 chars):', content.substring(0, 500))

  // Check for different address formats
  const addressWithoutChecksum = searchAddress
  const addressWithChecksum = address // original case

  // Try to find any occurrence of the address pattern (with or without 0x)
  const addressPattern = searchAddress.replace('0x', '')
  const foundExact = content.includes(searchAddress)
  const foundWithChecksum = content.includes(addressWithChecksum.toLowerCase())
  const foundPattern = content.includes(addressPattern)

  console.log('🔍 Search results:')
  console.log('  - Exact match (lowercase):', foundExact)
  console.log('  - With checksum:', foundWithChecksum)
  console.log('  - Pattern without 0x:', foundPattern)

  // Search for any part of the address
  const addressChunk = searchAddress.substring(2, 20) // Get a chunk from the middle
  const foundChunk = content.includes(addressChunk)
  console.log('  - Address chunk found:', foundChunk, `(${addressChunk})`)

  // Find where "0x" appears in the content to see if there are any addresses
  const ox_indices: number[] = []
  let idx = content.indexOf('0x')
  while (idx !== -1 && ox_indices.length < 10) {
    ox_indices.push(idx)
    idx = content.indexOf('0x', idx + 1)
  }
  console.log('🔍 Found "0x" at indices:', ox_indices)
  ox_indices.forEach(i => {
    console.log(
      `  -> Content around index ${i}: "${content.substring(Math.max(0, i - 10), Math.min(content.length, i + 50))}"`
    )
  })

  const found = foundExact || foundWithChecksum || foundPattern
  console.log(
    `🔍 Registry address ${address} ${found ? '✅ FOUND' : '❌ NOT FOUND'} in webpage content`
  )

  return {
    verified: found,
    registryAddress: address,
    registryUrl: registryUrl,
    message: found
      ? 'Registry address found in webpage content'
      : 'Registry address not found in webpage content',
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Verify URL API called (GET method)')
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    console.log('📍 Registry address from query params:', address)

    if (!address) {
      console.log('❌ Missing address parameter')
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 })
    }

    const result = await verifyUrl(address)

    console.log('✅ Verification completed successfully')
    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('❌ Error in verify-url (GET):', error.message)
    return NextResponse.json({ error: `Verification failed: ${error.message}` }, { status: 500 })
  }
}
