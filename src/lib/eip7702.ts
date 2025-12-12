import { ethers } from 'ethers'

/**
 * EIP-7702 Authorization Utility
 *
 * This module provides helpers for creating and managing EIP-7702 authorizations
 * that enable transaction sponsorship via delegation.
 */

export interface EIP7702Authorization {
  address: string
  nonce: number
  chainId: number
  yParity: number
  r: string
  s: string
}

/**
 * Create the authorization message hash for EIP-7702
 * This follows the EIP-7702 specification for authorization format
 */
export function createAuthorizationHash(
  delegateAddress: string,
  nonce: number,
  chainId: number
): string {
  // EIP-7702 uses a specific message format:
  // keccak256(abi.encode(MAGIC, chainId, nonce, address))
  // MAGIC = 0x05 (EIP-7702 magic byte)

  const MAGIC = '0x05'

  // Encode: MAGIC || chainId || nonce || address (32 bytes each)
  const encoded = ethers.solidityPacked(
    ['uint8', 'uint256', 'uint256', 'address'],
    [MAGIC, chainId, nonce, delegateAddress]
  )

  return ethers.keccak256(encoded)
}

/**
 * Create an EIP-7702 authorization using W3PK signing
 *
 * @param w3pk - W3PK instance
 * @param delegateAddress - Address of the contract to delegate to
 * @param nonce - Current nonce of the authorizing account
 * @param chainId - Chain ID (10 for OP Mainnet)
 * @returns EIP-7702 authorization object
 */
export async function createW3PKAuthorization(
  w3pk: any,
  delegateAddress: string,
  nonce: number,
  chainId: number
): Promise<EIP7702Authorization> {
  // Create the authorization hash
  const authHash = createAuthorizationHash(delegateAddress, nonce, chainId)

  console.log('🔐 Creating EIP-7702 authorization:', {
    delegate: delegateAddress,
    nonce,
    chainId,
    hash: authHash
  })

  // Sign with W3PK in STANDARD mode using rawHash
  const signResult = await w3pk.signMessage(authHash, {
    mode: 'STANDARD',
    tag: 'MAIN',
    signingMethod: 'rawHash'
  })

  // Parse the signature
  const sig = ethers.Signature.from(signResult.signature)

  const authorization: EIP7702Authorization = {
    address: delegateAddress,
    nonce,
    chainId,
    yParity: sig.yParity,
    r: sig.r,
    s: sig.s
  }

  console.log('✅ Authorization created:', {
    yParity: authorization.yParity,
    r: authorization.r.slice(0, 10) + '...',
    s: authorization.s.slice(0, 10) + '...'
  })

  return authorization
}

/**
 * Create an EIP-7702 authorization using a standard ethers Signer
 *
 * @param signer - Ethers.js signer
 * @param delegateAddress - Address of the contract to delegate to
 * @param nonce - Current nonce of the authorizing account
 * @param chainId - Chain ID (10 for OP Mainnet)
 * @returns EIP-7702 authorization object
 */
export async function createAuthorization(
  signer: ethers.Signer,
  delegateAddress: string,
  nonce: number,
  chainId: number
): Promise<EIP7702Authorization> {
  // Create the authorization hash
  const authHash = createAuthorizationHash(delegateAddress, nonce, chainId)

  console.log('🔐 Creating EIP-7702 authorization:', {
    delegate: delegateAddress,
    nonce,
    chainId,
    hash: authHash
  })

  // Sign the hash
  const signature = await signer.signMessage(ethers.getBytes(authHash))

  // Parse the signature
  const sig = ethers.Signature.from(signature)

  const authorization: EIP7702Authorization = {
    address: delegateAddress,
    nonce,
    chainId,
    yParity: sig.yParity,
    r: sig.r,
    s: sig.s
  }

  console.log('✅ Authorization created:', {
    yParity: authorization.yParity,
    r: authorization.r.slice(0, 10) + '...',
    s: authorization.s.slice(0, 10) + '...'
  })

  return authorization
}

/**
 * Validate an EIP-7702 authorization structure
 */
export function isValidAuthorization(auth: any): auth is EIP7702Authorization {
  return (
    typeof auth === 'object' &&
    typeof auth.address === 'string' &&
    ethers.isAddress(auth.address) &&
    typeof auth.nonce === 'number' &&
    typeof auth.chainId === 'number' &&
    typeof auth.yParity === 'number' &&
    typeof auth.r === 'string' &&
    typeof auth.s === 'string' &&
    auth.r.startsWith('0x') &&
    auth.s.startsWith('0x')
  )
}
