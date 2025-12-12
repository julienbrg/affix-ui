# Scripts

Utility scripts for the Affix application.

## fund-registry.mjs

Checks the relayer wallet balance and verifies it can sponsor transactions.

**Note:** The registry contract does not need ETH - it cannot receive direct transfers. All transactions are sponsored by the relayer wallet, which pays gas fees from its own balance.

### Usage

```bash
npm run fund-registry
```

### What it does

1. Loads `RELAYER_PRIVATE_KEY` from `.env`
2. Connects to OP Mainnet
3. Checks relayer wallet balance
4. Checks if registry contract can receive ETH
5. If registry can't receive ETH (expected): Reports relayer is ready
6. If registry can receive ETH (unusual): Sends 0.0001 ETH to it

### Requirements

- `RELAYER_PRIVATE_KEY` must be set in `.env` file (automatically loaded)
- OR set as environment variable: `RELAYER_PRIVATE_KEY=0x... npm run fund-registry`
- Relayer wallet must have sufficient ETH on OP Mainnet (> 0.0001 ETH + gas)
- No additional dependencies needed (uses Node.js built-ins + ethers.js)

### Example Output (Normal Case)

```
🚀 Fund Registry Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Connecting to OP Mainnet...
🔗 Relayer wallet: 0x502fb0dFf6A2adbF43468C9888D1A26943eAC6D1
📍 Registry contract: 0xa0d98DCaDab6e6FF45cd7087F8192d65aa954256
💰 Amount to send: 0.0001 ETH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 Relayer balance: 0.001220342074136406 ETH
📊 Registry current balance: 0.0 ETH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Checking if contract can receive ETH...
⚠️  Contract cannot receive ETH directly
   This is expected - the registry contract is not designed to receive ETH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️  The registry contract does not need ETH balance.
   All transactions are sponsored by the relayer wallet.
   The relayer wallet already has: 0.001220342074136406 ETH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ No action needed - relayer is properly funded!
   Relayer can sponsor transactions from its own balance.
✅ Script completed successfully
```

### Understanding the Output

The script confirms that:
- ✅ The relayer wallet has ETH (can sponsor transactions)
- ✅ The registry contract doesn't need ETH (it's a pure logic contract)
- ✅ The EIP-7702 implementation works by having the relayer pay from its own balance

### Troubleshooting

**Error: RELAYER_PRIVATE_KEY not found**
- Add `RELAYER_PRIVATE_KEY=0x...` to your `.env` file

**Error: Insufficient balance**
- Fund the relayer wallet with ETH on OP Mainnet
- Get OP Mainnet ETH from a bridge or faucet

**Error: Transaction failed**
- Check the transaction on Optimistic Etherscan
- Verify the registry address is correct
- Ensure OP Mainnet is accessible
