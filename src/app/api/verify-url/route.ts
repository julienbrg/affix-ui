import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { NETWORK_CONFIGS, DEFAULT_NETWORK } from '@/lib/contracts'

const REGISTRY_ABI = ['function entityUrl() external view returns (string)']

const RUKH_WEB_READER_URL = 'https://rukh.w3hc.org/web-reader/llm'

interface WebReaderResponse {
  title: string
  url: string
  text: string
  links: { text: string; url: string }[]
}

async function verifyUrl(address: string) {
  if (!ethers.isAddress(address)) {
    throw new Error('Invalid Ethereum address')
  }

  const network = NETWORK_CONFIGS[DEFAULT_NETWORK]
  const provider = new ethers.JsonRpcProvider(network.rpcUrl)
  const contract = new ethers.Contract(address, REGISTRY_ABI, provider)

  let registryUrl: string
  try {
    registryUrl = await contract.entityUrl()
  } catch {
    throw new Error(
      'Failed to read URL from registry contract. Contract may not have entityUrl() function.'
    )
  }

  if (!registryUrl || registryUrl.trim() === '') {
    throw new Error('No URL found in registry contract')
  }

  const response = await fetch(`${RUKH_WEB_READER_URL}?url=${encodeURIComponent(registryUrl)}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch webpage content: ${response.status} ${response.statusText}`)
  }

  const data: WebReaderResponse = await response.json()

  if (!data || typeof data.text !== 'string' || !Array.isArray(data.links)) {
    throw new Error('Invalid response from webpage reader')
  }

  const searchAddress = address.toLowerCase()
  const found =
    data.text.toLowerCase().includes(searchAddress) ||
    data.links.some(link => link.url?.toLowerCase().includes(searchAddress))

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
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 })
    }

    const result = await verifyUrl(address)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('Error in verify-url:', error.message)
    return NextResponse.json({ error: `Verification failed: ${error.message}` }, { status: 500 })
  }
}
