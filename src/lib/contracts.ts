// Network configuration
export const NETWORK_CONFIGS = {
  314159: {
    // Filecoin Calibration
    name: 'Filecoin Calibration',
    factoryAddress: '0xa0d98DCaDab6e6FF45cd7087F8192d65aa954256', // Your registry address
    rpcUrl: 'https://api.calibration.node.glif.io/rpc/v1',
    blockExplorer: 'https://calibration.filscan.io',
    explorerName: 'Filscan',
  },
  11155111: {
    name: 'Sepolia Testnet',
    factoryAddress: '0x02b77E551a1779f3f091a1523A08e61cd2620f82',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
    explorerName: 'Etherscan',
  },
  10: {
    name: 'OP Mainnet',
    factoryAddress: '0xCE5F5b5B5E4A6be548aE2eB38cE63b5D6cd770b8',
    registryAddress: '0x5A4b81Fb55985a5294326092099F1588ED5B0920',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    explorerName: 'Optimistic Etherscan',
  },
}

// Factory contract ABI
export const AFFIX_FACTORY_ABI = [
  'function getAllEntities() external view returns (address[] memory)',
  'function getEntityCount() external view returns (uint256)',
  'function getEntityByIndex(uint256 index) external view returns (address)',
  'function getEntityDetails(address registryAddress) external view returns (address admin, string memory entityName, bool isRegistered)',
  'function isEntityRegistered(address registryAddress) external view returns (bool)',
  'function getFactoryStats() external view returns (uint256 totalEntities, address factoryOwner)',
  'function owner() external view returns (address)',
]

// Registry contract ABI
export const AFFIX_REGISTRY_ABI = [
  'function verifyDocument(string memory cid) external view returns (bool exists, uint256 timestamp, string memory entityName_, string memory entityUrl_)',
  'function getDocumentDetails(string memory cid) external view returns (bool exists, uint256 timestamp, string memory entityName_, string memory entityUrl_, string memory metadata, address issuedBy)',
  'function entityName() external view returns (string memory)',
  'function entityUrl() external view returns (string memory)',
  'function getDocumentCount() external view returns (uint256)',
  'function owner() external view returns (address)',
  'function getAgentCount() external view returns (uint256)',
  'function getActiveAgents() external view returns (address[] memory)',
  'function getAllDocumentCids() external view returns (string[] memory)',
  'function getRegistryInfo() external view returns (address admin_, string memory entityName_, string memory entityUrl_, uint256 documentCount, uint256 agentCount)',
  'function isValidRegistry() external view returns (bool)',
  'function isAgent(address agent) external view returns (bool)',
  'function canIssueDocuments(address issuer) external view returns (bool)',
  'function issueDocument(string memory cid) external',
  'function issueDocumentWithMetadata(string memory cid, string memory metadata) external',
  'function addAgent(address agent) external',
  'function revokeAgent(address agent) external',
]

export interface RegistryInfo {
  address: string
  entityName: string
  documentCount: bigint
  admin: string
  agentCount: bigint
  isValid: boolean
  activeAgents: string[]
}

export interface VerificationResult {
  registryAddress: string
  entityName: string
  exists: boolean
  timestamp: bigint
  metadata?: string
  issuedBy?: string
  entityUrl?: string
}

export interface DocumentDetails {
  exists: boolean
  timestamp: bigint
  entityName: string
  entityUrl: string
  metadata: string
  issuedBy: string
}
