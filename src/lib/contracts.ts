// Network configuration
export const NETWORK_CONFIGS = {
  677: {
    name: 'BOT Chain',
    factoryAddress: '0x217e2225a623412A7e9F43Bc0207c1bD1ed4f9Dc',
    registryAddress: '0x94E5E95128aA2684B0A51b5Ea30C601e6f72aeB7',
    rpcUrl: 'https://rpc.botchain.ai',
    blockExplorer: 'https://scan.botchain.ai',
    explorerName: 'BOT Chain Explorer',
  },
}

export const DEFAULT_NETWORK = 677

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
  'function transferOwnership(address newOwner) external',
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
