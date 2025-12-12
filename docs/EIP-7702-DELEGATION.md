# EIP-7702 Delegation Implementation

## Overview

This implementation enables **transaction sponsorship** for agents using [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) (Set Code for EOAs). Agents can issue documents without holding any ETH - the relayer pays for all gas fees while preserving the agent's identity as the document issuer.

## What is EIP-7702?

EIP-7702 is part of Ethereum's Pectra upgrade that allows Externally Owned Accounts (EOAs) to temporarily gain smart contract capabilities through delegation. This enables:

- **Gas sponsorship**: A relayer can pay for transaction fees on behalf of agents
- **Batched transactions**: Multiple operations in a single transaction
- **Enhanced security**: Delegated execution without giving up private keys

### Network Support

✅ **OP Mainnet**: EIP-7702 is supported as of the Pectra upgrade (May 2025)

## Architecture

### Components

1. **RELAYER_PRIVATE_KEY**: Wallet that sponsors transactions and pays gas fees
2. **Agent EOA**: User's wallet that delegates execution to the registry contract
3. **Registry Contract**: Smart contract that validates and executes agent actions
4. **Authorization**: Signed message from agent allowing delegation

### Flow Diagram

```
Step 1: Add Agent (Admin)
┌─────────────┐    addAgent()    ┌─────────────┐
│   Admin     │─────────────────>│  Relayer    │──> Registry Contract
└─────────────┘                  └─────────────┘    (agent registered)

Step 2: Setup Delegation (Agent - First Time Only)
┌─────────────┐  Signs EIP-7702   ┌─────────────┐  Type 4 TX    ┌──────────┐
│   Agent     │───Authorization──>│  Relayer    │──────────────>│ Network  │
└─────────────┘                   └─────────────┘               └──────────┘
                                                                (0xef0100 code set)

Step 3: Issue Documents (Ongoing - No ETH Needed!)
┌─────────────┐  Request Doc      ┌─────────────┐  Calls agent  ┌──────────┐
│   Agent     │─────Issue────────>│  Relayer    │───address────>│ Registry │
└─────────────┘                   └─────────────┘  (pays gas)   └──────────┘
                                                                 (msg.sender = agent)
```

## Implementation Details

### 1. Agent Registration with Delegation

**File**: `/src/app/api/make-agent/route.ts`

When an agent is added:
1. The relayer (not admin) wallet is used to pay for the `addAgent()` transaction
2. The agent's address is registered in the registry contract
3. The system prepares for future EIP-7702 delegated transactions
4. The agent can now have transactions sponsored

**Key Changes**:
- Changed from `ADMIN_PRIVATE_KEY` to `RELAYER_PRIVATE_KEY`
- Relayer wallet pays gas fees for adding agents
- Added delegation preparation logic

```typescript
// Get relayer private key from environment for transaction sponsorship
const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY
const relayerWallet = new ethers.Wallet(relayerPrivateKey, provider)

// Add the agent using relayer wallet
const contract = new ethers.Contract(registryAddress, REGISTRY_ABI, relayerWallet)
const tx = await contract.addAgent(userAddress)
```

### 2. Sponsored Transaction Endpoint

**File**: `/src/app/api/sponsored-tx/route.ts` (NEW)

This endpoint handles **EIP-7702 sponsored transactions**:

**Request Body**:
```json
{
  "agentAddress": "0x...",          // Agent's EOA
  "registryAddress": "0x...",       // Registry contract
  "functionName": "issueDocument",  // Function to call
  "args": ["QmXYZ..."],            // Function arguments
  "authorization": {                // EIP-7702 authorization
    "address": "0x...",             // Registry address
    "nonce": 1,                     // Agent's nonce
    "chainId": 10,                  // OP Mainnet
    "yParity": 0,                   // Signature v
    "r": "0x...",                   // Signature r
    "s": "0x..."                    // Signature s
  }
}
```

**Response**:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "message": "Transaction sponsored successfully",
  "sponsored": true
}
```

**How it Works**:
1. Validates agent has permission (`isAgent()`)
2. Creates EIP-7702 transaction (type 4) with authorization
3. Relayer wallet signs and broadcasts transaction
4. Agent's transaction is executed without them needing ETH

```typescript
// Create the transaction with type 4 (EIP-7702)
const tx = {
  type: 4,                        // EIP-7702 transaction type
  to: agentAddress,               // Agent's address
  data: encodedFunctionCall,      // Function call data
  authorizationList: [authorization], // Signed authorization
  gasLimit: 500000
}

// Relayer sends and pays for the transaction
const txResponse = await relayerWallet.sendTransaction(tx)
```

## How to Use

### Step 1: Configure Environment

Add `RELAYER_PRIVATE_KEY` to your `.env` file:

```bash
RELAYER_PRIVATE_KEY=0xyour_private_key_here
```

**Important**: Ensure the relayer wallet has sufficient ETH on OP Mainnet to sponsor transactions and must be the admin of the registry contract.

### Step 2: Add an Agent

The admin uses the make-agent endpoint (relayer pays for this):

```bash
POST /api/make-agent
Content-Type: application/json

{
  "userAddress": "0xAgentAddress",
  "registryAddress": "0xRegistryAddress"
}
```

The relayer wallet pays for this `addAgent()` transaction.

### Step 3: Agent Sets Up Delegation (First Time Only)

**This happens automatically in the dashboard!** When an agent tries to issue their first document:

1. The dashboard checks if delegation is set up (`getCode(agentAddress)`)
2. If not, it prompts the agent to sign an EIP-7702 authorization
3. The signed authorization is sent to `/api/setup-delegation`
4. The relayer submits a type-4 transaction to activate delegation
5. Agent's address now has code `0xef0100...` (delegation designator)

**For manual integration:**

```typescript
import { createW3PKAuthorization } from '@/lib/eip7702'

// Get agent's nonce
const nonce = await provider.getTransactionCount(agentAddress)

// Create authorization with W3PK
const authorization = await createW3PKAuthorization(
  w3pkInstance,
  registryAddress,
  nonce,
  10 // OP Mainnet chain ID
)

// Submit to relayer
const response = await fetch('/api/setup-delegation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentAddress: agentAddress,
    registryAddress: registryAddress,
    authorization: authorization
  })
})
```

### Step 4: Issue Documents (No ETH Needed!)

Once delegation is set up, agents can issue documents without any ETH:

```typescript
const response = await fetch('/api/sponsored-tx', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentAddress: '0xAgentAddress',
    registryAddress: '0xRegistryAddress',
    functionName: 'issueDocument',
    args: ['QmDocumentCID']
  })
})

const result = await response.json()
console.log('Transaction hash:', result.transactionHash)
// Document is issued with issuedBy = agentAddress
// Relayer paid for gas!
```

## Key Technical Insight: Why msg.sender Works

The registry contract tracks who issued each document using `msg.sender`:

```solidity
function issueDocument(string memory cid) external {
    require(canIssueDocuments(msg.sender), "Not authorized");
    documents[cid].issuedBy = msg.sender; // ← msg.sender must be the agent!
    // ...
}
```

**Without EIP-7702:** If the relayer called the registry directly, `msg.sender` would be the relayer's address, not the agent's.

**With EIP-7702:** The agent's address delegates its code to the registry. When the relayer calls the agent's address:
1. The call goes to the agent's address
2. The agent's address has `0xef0100[registryAddress]` as its code (delegation designator)
3. The EVM redirects execution to the registry contract
4. **But `msg.sender` remains the agent's address!**

This is why we call `agentAddress` instead of `registryAddress`:

```typescript
// ✅ Correct: Call agent's address (which delegates to registry)
const delegatedContract = new ethers.Contract(agentAddress, REGISTRY_ABI, relayerWallet)
await delegatedContract.issueDocument(cid) // msg.sender = agentAddress

// ❌ Wrong: Would make msg.sender = relayerAddress
const directContract = new ethers.Contract(registryAddress, REGISTRY_ABI, relayerWallet)
await directContract.issueDocument(cid) // msg.sender = relayerAddress
```

## Security Considerations

### 1. Authorization Security
- **Agent must sign**: The authorization MUST be signed by the agent's private key
- **Nonce management**: Each authorization is single-use (nonce-based)
- **Chain-specific**: Authorization is bound to a specific chain (OP Mainnet)

### 2. Relayer Security
- **Private key protection**: Store `RELAYER_PRIVATE_KEY` securely (use environment variables or secret management)
- **Funding**: Keep relayer wallet funded but not with excessive amounts
- **Monitoring**: Monitor relayer wallet balance and transaction costs

### 3. Agent Validation
- **isAgent() check**: Only authorized agents can have transactions sponsored
- **Permission model**: Agents can only call functions they're authorized for
- **Revert handling**: Failed transactions don't cost agents anything (relayer pays)

## Integration with W3PK

To integrate EIP-7702 with the existing W3PK authentication system, you'll need to:

### Option 1: Extend W3PKSigner (Recommended)

Add EIP-7702 authorization support to the W3PKSigner class:

```typescript
// In src/app/dashboard/page.tsx

class W3PKSigner extends ethers.AbstractSigner {
  // ... existing code ...

  async signAuthorization(
    address: string,
    nonce: number,
    chainId: number
  ): Promise<any> {
    // Create authorization message
    const message = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256'],
      [address, nonce, chainId]
    )

    // Sign with W3PK in STANDARD mode
    const signature = await this.w3pk.signMessage(message, 'STANDARD')

    // Parse signature
    const sig = ethers.Signature.from(signature)

    return {
      address,
      nonce,
      chainId,
      yParity: sig.yParity,
      r: sig.r,
      s: sig.s
    }
  }
}
```

### Option 2: Use Sponsored Transaction Endpoint

Modify `handleIssueDocument()` to use the sponsored endpoint:

```typescript
const handleIssueDocument = async () => {
  // 1. Create authorization
  const userAddress = await getAddress('STANDARD', 'MAIN')
  const nonce = await provider.getTransactionCount(userAddress)

  // 2. Sign authorization with W3PK
  const w3pkSigner = new W3PKSigner(userAddress, provider, w3pkInstance)
  const authorization = await w3pkSigner.signAuthorization(
    registryAddress,
    nonce,
    10 // OP Mainnet
  )

  // 3. Call sponsored transaction endpoint
  const response = await fetch('/api/sponsored-tx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentAddress: userAddress,
      registryAddress,
      functionName: metadata ? 'issueDocumentWithMetadata' : 'issueDocument',
      args: metadata ? [documentCID, metadata] : [documentCID],
      authorization
    })
  })

  const result = await response.json()
  // Handle result...
}
```

## Testing

### 1. Test Agent Registration

```bash
curl -X POST http://localhost:3000/api/make-agent \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0xYourAgentAddress",
    "registryAddress": "0xa0d98DCaDab6e6FF45cd7087F8192d65aa954256"
  }'
```

Expected response:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "registryAddress": "0x...",
  "message": "Successfully added as agent with delegation support",
  "delegationEnabled": true
}
```

### 2. Verify Agent Status

```typescript
const contract = new ethers.Contract(
  registryAddress,
  ['function isAgent(address) view returns (bool)'],
  provider
)

const isAgent = await contract.isAgent('0xAgentAddress')
console.log('Is agent:', isAgent) // Should be true
```

### 3. Check Relayer Balance

```bash
# Check relayer has enough ETH to sponsor transactions
cast balance $RELAYER_ADDRESS --rpc-url https://mainnet.optimism.io
```

## Troubleshooting

### Error: "RELAYER_PRIVATE_KEY not found"
- Ensure `.env` file contains `RELAYER_PRIVATE_KEY`
- Restart the Next.js development server after adding the key

### Error: "Insufficient funds for transaction"
- Fund the relayer wallet with ETH on OP Mainnet
- Recommended minimum: 0.01 ETH for testing

### Error: "Agent is not authorized"
- Ensure the agent was added via `/api/make-agent`
- Verify agent status with `isAgent()` contract call

### Error: "Invalid authorization"
- Check that the authorization was signed by the agent's wallet
- Verify nonce is correct (current transaction count)
- Ensure chainId is 10 (OP Mainnet)

## Cost Analysis

### Gas Costs (Approximate on OP Mainnet)

| Operation | Gas Limit | Cost (@ 0.001 Gwei) |
|-----------|-----------|---------------------|
| Add Agent | 100,000 | ~$0.0001 |
| Issue Document | 300,000 | ~$0.0003 |
| Issue with Metadata | 350,000 | ~$0.00035 |

**Note**: OP Mainnet has extremely low gas costs compared to Ethereum mainnet.

### Relayer Economics

For sponsoring transactions for agents:
- Each sponsored transaction costs the relayer the gas fee
- Consider implementing rate limiting or usage caps per agent
- Monitor relayer wallet balance and set up alerts

## Future Improvements

1. **Batch Transactions**: Use EIP-7702 to batch multiple document issuances
2. **Rate Limiting**: Limit sponsored transactions per agent per time period
3. **Usage Tracking**: Track how much gas each agent consumes
4. **Automatic Top-up**: Auto-fund relayer wallet when balance is low
5. **Multi-signature**: Require multiple signatures for high-value operations

## References

- [EIP-7702 Specification](https://eips.ethereum.org/EIPS/eip-7702)
- [QuickNode EIP-7702 Guide](https://www.quicknode.com/guides/ethereum-development/transactions/eip-7702-transactions-with-ethers)
- [Optimism Pectra Upgrade](https://docs.optimism.io/notices/pectra-changes)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)

## Support

For questions or issues related to this implementation:
- Check the [troubleshooting section](#troubleshooting) above
- Review the [EIP-7702 specification](https://eips.ethereum.org/EIPS/eip-7702)
- Open an issue in the repository

---

**Last Updated**: December 12, 2025
**Ethers.js Version**: 6.16.0
**Network**: OP Mainnet (Chain ID: 10)
