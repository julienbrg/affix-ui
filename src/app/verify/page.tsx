'use client'

import {
  Container,
  Heading,
  Text,
  Box,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Icon,
  Flex,
  HStack,
  Badge,
  Spinner,
  Textarea,
  Divider,
  Progress,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react'
import { useAppKitAccount, useAppKitProvider, useAppKitNetwork } from '@reown/appkit/react'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import {
  FiSearch,
  FiFile,
  FiHash,
  FiExternalLink,
  FiCheck,
  FiX,
  FiCalendar,
  FiUser,
  FiUpload,
  FiDatabase,
  FiShield,
} from 'react-icons/fi'
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers'
import { getDocumentCID } from '../lib/documentHash'

// Network configuration
const NETWORK_CONFIGS = {
  11155111: {
    name: 'Sepolia Testnet',
    factoryAddress: '0x02b77E551a1779f3f091a1523A08e61cd2620f82', // Replace with actual Sepolia factory address
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY', // Replace with actual Sepolia RPC
    blockExplorer: 'https://sepolia.etherscan.io',
  },
  314159: {
    name: 'Filecoin Calibration',
    factoryAddress: '0x1928Fb336C74432e129142c7E3ee57856486eFfa',
    rpcUrl: 'https://api.calibration.node.glif.io/rpc/v1',
    blockExplorer: 'https://calibration.filscan.io/en/message',
  },
}

// Factory contract ABI - from actual Etherscan contract
const VERIDOCS_FACTORY_ABI = [
  'function getAllInstitutions() external view returns (address[] memory)',
  'function getInstitutionCount() external view returns (uint256)',
  'function getInstitutionByIndex(uint256 index) external view returns (address)',
  'function getInstitutionDetails(address registryAddress) external view returns (address admin, string memory institutionName, bool isRegistered)',
  'function isInstitutionRegistered(address registryAddress) external view returns (bool)',
  'function getFactoryStats() external view returns (uint256 totalInstitutions, address factoryOwner)',
  'function owner() external view returns (address)',
]

// Registry contract ABI - from actual contract source
const VERIDOCS_REGISTRY_ABI = [
  'function verifyDocument(string memory cid) external view returns (bool exists, uint256 timestamp, string memory institutionName_)',
  'function getDocumentDetails(string memory cid) external view returns (bool exists, uint256 timestamp, string memory institutionName_, string memory metadata, address issuedBy)',
  'function institutionName() external view returns (string memory)',
  'function getDocumentCount() external view returns (uint256)',
  'function admin() external view returns (address)',
  'function getAgentCount() external view returns (uint256)',
  'function getActiveAgents() external view returns (address[] memory)',
  'function getAllDocumentCids() external view returns (string[] memory)',
  'function getRegistryInfo() external view returns (address admin_, string memory institutionName_, uint256 documentCount, uint256 agentCount)',
  'function isValidRegistry() external view returns (bool)',
  'function isAgent(address agent) external view returns (bool)',
  'function canIssueDocuments(address issuer) external view returns (bool)',
]

interface RegistryInfo {
  address: string
  institutionName: string
  documentCount: bigint
  admin: string
  agentCount: bigint
  isValid: boolean
  activeAgents: string[]
}

interface VerificationResult {
  registryAddress: string
  institutionName: string
  exists: boolean
  timestamp: bigint
  metadata?: string
  issuedBy?: string
}

interface DocumentDetails {
  exists: boolean
  timestamp: bigint
  institutionName: string
  metadata: string
  issuedBy: string
}

export default function VerifyPage() {
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const { chainId, caipNetwork } = useAppKitNetwork()
  const [cidInput, setCidInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isLoadingRegistries, setIsLoadingRegistries] = useState(false)
  const [documentCID, setDocumentCID] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressStatus, setProgressStatus] = useState('')
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([])
  const [registries, setRegistries] = useState<RegistryInfo[]>([])
  const [totalRegistries, setTotalRegistries] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const t = useTranslation()

  // Get current network configuration
  const currentNetwork = NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS]

  // Debug network detection
  useEffect(() => {
    console.log('🌐 Current Network Info:')
    console.log('Chain ID:', chainId)
    console.log('CAIP Network:', caipNetwork)
    console.log('Network Name:', caipNetwork?.name)
    console.log('Current Network Config:', currentNetwork)
    console.log('Is Filecoin Calibration?', chainId === 314159)
    console.log('Is Sepolia?', chainId === 11155111)
  }, [chainId, caipNetwork, currentNetwork])

  // Load all registries on component mount and when network changes
  useEffect(() => {
    if (currentNetwork) {
      loadAllRegistries()
    }
  }, [currentNetwork])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 10MB',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      setSelectedFile(file)
      setVerificationResults([])
      setDocumentCID(null)
      setCidInput('')
    }
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setVerificationResults([])
    setDocumentCID(null)
    setCidInput('')
    setProgress(0)
    setProgressStatus('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const loadAllRegistries = async () => {
    if (!currentNetwork) {
      console.error('❌ No network configuration found for chain ID:', chainId)
      toast({
        title: 'Unsupported Network',
        description: 'Please switch to Sepolia or Filecoin Calibration network',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    console.log('🔄 Loading all registries from factory...')
    console.log('📍 Factory Address:', currentNetwork.factoryAddress)
    console.log('🌐 Current Network:', currentNetwork.name)
    console.log('🌐 RPC URL:', currentNetwork.rpcUrl)

    setIsLoadingRegistries(true)

    try {
      const ethersProvider = new JsonRpcProvider(currentNetwork.rpcUrl)
      const factoryContract = new Contract(
        currentNetwork.factoryAddress,
        VERIDOCS_FACTORY_ABI,
        ethersProvider
      )

      console.log('📞 Getting institution count and addresses...')

      // Get total number of institutions and their addresses
      const [institutionCount, registryAddresses] = await Promise.all([
        factoryContract.getInstitutionCount(),
        factoryContract.getAllInstitutions(),
      ])

      console.log('📊 Raw institution count from contract:', institutionCount)
      console.log('📊 Institution count as number:', Number(institutionCount))
      console.log('📋 Raw registry addresses from contract:', registryAddresses)
      console.log('📋 Registry addresses length:', registryAddresses.length)

      setTotalRegistries(Number(institutionCount))

      console.log('📊 Total institutions found:', institutionCount.toString())
      console.log('📋 Registry addresses:', registryAddresses)

      // Get detailed info for each registry
      const registryInfoPromises = registryAddresses.map(async (registryAddress: string) => {
        try {
          console.log(`📍 Loading info for registry: ${registryAddress}`)

          // Check if registry is valid and get basic details from factory
          const [admin, institutionName, isRegistered] =
            await factoryContract.getInstitutionDetails(registryAddress)

          console.log(`📊 Factory details for ${registryAddress}:`, {
            admin,
            institutionName,
            isRegistered,
          })

          if (!isRegistered) {
            console.log(`⚠️ Registry ${registryAddress} is not registered with factory`)
            return {
              address: registryAddress,
              institutionName: 'Unregistered Registry',
              documentCount: BigInt(0),
              admin: 'Unknown',
              agentCount: BigInt(0),
              isValid: false,
              activeAgents: [],
            }
          }

          // Load comprehensive registry details - FIX: Use individual calls instead of getRegistryInfo
          const registryContract = new Contract(
            registryAddress,
            VERIDOCS_REGISTRY_ABI,
            ethersProvider
          )

          // GET DATA USING INDIVIDUAL CONTRACT CALLS (more reliable)
          const [
            registryAdmin,
            registryInstitutionName,
            documentCount,
            agentCount,
            isValid,
            activeAgents,
          ] = await Promise.all([
            registryContract.admin().catch(() => admin), // Fallback to factory admin
            registryContract.institutionName().catch(() => institutionName), // Fallback to factory name
            registryContract.getDocumentCount().catch(() => BigInt(0)), // Use individual call - THIS IS THE FIX!
            registryContract.getAgentCount().catch(() => BigInt(0)),
            registryContract.isValidRegistry().catch(() => false),
            registryContract.getActiveAgents().catch(() => []),
          ])

          // DEBUG: Compare getRegistryInfo vs individual calls
          try {
            const [regInfoAdmin, regInfoName, regInfoDocCount, regInfoAgentCount] =
              await registryContract.getRegistryInfo()
            console.log('🔍 COMPARISON - getRegistryInfo() vs individual calls:')
            console.log('  getRegistryInfo documentCount:', regInfoDocCount.toString())
            console.log('  getDocumentCount():', documentCount.toString())
            console.log(
              '  ⚠️ VALUES MATCH?',
              regInfoDocCount.toString() === documentCount.toString()
            )
          } catch (e) {
            console.log('⚠️ getRegistryInfo comparison failed:', e)
          }

          console.log(`✅ Loaded registry info for ${institutionName} (FIXED):`, {
            address: registryAddress,
            institutionName: registryInstitutionName,

            // USING CORRECT INDIVIDUAL CALLS
            documentCount_CORRECT: documentCount,
            documentCount_toString: documentCount.toString(),
            documentCount_Number: Number(documentCount.toString()),

            agentCount: agentCount,
            agentCount_toString: agentCount.toString(),
            agentCount_Number: Number(agentCount.toString()),

            admin: registryAdmin,
            isValid,
            activeAgents: activeAgents.length,
          })

          return {
            address: registryAddress,
            institutionName: registryInstitutionName,
            documentCount,
            admin: registryAdmin,
            agentCount,
            isValid,
            activeAgents,
          }
        } catch (error) {
          console.error(`❌ Failed to load registry info for ${registryAddress}:`, error)
          return {
            address: registryAddress,
            institutionName: 'Failed to Load',
            documentCount: BigInt(0),
            admin: 'Failed to Load',
            agentCount: BigInt(0),
            isValid: false,
            activeAgents: [],
          }
        }
      })

      const registryInfos = await Promise.all(registryInfoPromises)

      // Debug registry info
      console.log('📊 All registry info loaded:')
      registryInfos.forEach((registry, index) => {
        console.log(`Registry ${index + 1}:`, {
          name: registry.institutionName,
          documentCount: registry.documentCount.toString(),
          documentCountAsNumber: Number(registry.documentCount.toString()),
          agentCount: registry.agentCount.toString(),
          agentCountAsNumber: Number(registry.agentCount.toString()),
        })
      })

      // Filter out invalid registries if needed
      const validRegistries = registryInfos.filter(
        registry => registry.institutionName !== 'Failed to Load'
      )

      setRegistries(validRegistries)

      // Calculate totals with proper BigInt handling
      const totalDocs = validRegistries.reduce(
        (sum, r) => sum + Number(r.documentCount.toString()),
        0
      )
      const totalAgents = validRegistries.reduce(
        (sum, r) => sum + Number(r.agentCount.toString()),
        0
      )

      console.log('📊 Calculated totals:', { totalDocs, totalAgents })
      console.log('✅ Valid registries loaded successfully:', validRegistries.length)
      console.log('📋 Registry details:', validRegistries)
    } catch (error) {
      console.error('❌ Error loading registries:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        chainId: chainId,
        factoryAddress: currentNetwork?.factoryAddress,
        networkName: currentNetwork?.name,
      })
      toast({
        title: 'Failed to load registries',
        description: `Could not connect to the factory contract on ${currentNetwork?.name}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoadingRegistries(false)
    }
  }

  const handleVerifyDocument = async () => {
    // Check if we have either a file or a CID input
    if (!selectedFile && !cidInput.trim()) {
      toast({
        title: 'No document provided',
        description: 'Please upload a file or enter a document CID/hash',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (registries.length === 0) {
      toast({
        title: 'No registries available',
        description: 'Please wait for registries to load or refresh the page',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (!currentNetwork) {
      toast({
        title: 'Unsupported Network',
        description: 'Please switch to a supported network',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    console.log('🔍 Starting multi-registry verification...')

    setIsVerifying(true)
    setVerificationResults([])
    setProgress(0)
    setProgressStatus('')

    try {
      let finalCID = cidInput.trim()

      // If we have a file, calculate its CID first
      if (selectedFile) {
        console.log('📄 File selected:', selectedFile.name, '| Size:', selectedFile.size, 'bytes')

        setProgress(10)
        setProgressStatus('Computing document hash (CID)...')

        console.log('🔢 Computing IPFS hash using getDocumentCID...')
        finalCID = await getDocumentCID(selectedFile)

        setDocumentCID(finalCID)
        setCidInput(finalCID) // Update input field for user reference

        console.log('✅ CID calculation successful!')
        console.log('🆔 Generated CID:', finalCID)
      }

      // Now verify the document across all registries
      setProgress(30)
      setProgressStatus(`Verifying document across ${registries.length} registries...`)

      console.log('📄 CID to verify:', finalCID)
      console.log('🏛️ Checking across', registries.length, 'registries')

      const ethersProvider = new JsonRpcProvider(currentNetwork.rpcUrl)
      const results: VerificationResult[] = []

      // Check each registry
      for (let i = 0; i < registries.length; i++) {
        const registry = registries[i]
        const progressValue = 30 + ((i + 1) / registries.length) * 60

        setProgress(progressValue)
        setProgressStatus(`Checking ${registry.institutionName}... (${i + 1}/${registries.length})`)

        try {
          console.log(
            `🔍 Checking registry ${i + 1}/${registries.length}:`,
            registry.institutionName
          )

          const registryContract = new Contract(
            registry.address,
            VERIDOCS_REGISTRY_ABI,
            ethersProvider
          )

          // First try basic verification
          const [exists, timestamp, institutionName] =
            await registryContract.verifyDocument(finalCID)

          let metadata = ''
          let issuedBy = ''

          // If document exists, get detailed information
          if (exists) {
            try {
              const [, , , detailMetadata, detailIssuedBy] =
                await registryContract.getDocumentDetails(finalCID)
              metadata = detailMetadata
              issuedBy = detailIssuedBy
            } catch (detailError) {
              console.log('⚠️ Could not get detailed info, using basic verification result')
            }
          }

          const result: VerificationResult = {
            registryAddress: registry.address,
            institutionName,
            exists,
            timestamp,
            metadata,
            issuedBy,
          }

          results.push(result)

          console.log(`✅ Registry ${institutionName} result:`, {
            exists,
            timestamp: timestamp.toString(),
          })
        } catch (error) {
          console.error(`❌ Error checking registry ${registry.institutionName}:`, error)
          // Add error result
          results.push({
            registryAddress: registry.address,
            institutionName: registry.institutionName,
            exists: false,
            timestamp: BigInt(0),
            metadata: '',
            issuedBy: '',
          })
        }
      }

      setProgress(100)
      const foundInRegistries = results.filter(r => r.exists).length
      setProgressStatus(
        foundInRegistries > 0
          ? `Document found in ${foundInRegistries} registry(ies)! ✅`
          : 'Document not found in any registry ❌'
      )

      setVerificationResults(results)

      if (foundInRegistries > 0) {
        console.log('🎉 Document verification SUCCESS in', foundInRegistries, 'registries!')
      } else {
        console.log('⚠️ Document NOT FOUND in any registry')
      }

      // Reset progress after delay
      setTimeout(() => {
        setProgress(0)
        setProgressStatus('')
      }, 3000)
    } catch (error: any) {
      console.error('❌ Error during verification process:', error)

      // Reset progress on error
      setProgress(0)
      setProgressStatus('')

      let errorMessage = 'An error occurred during verification'
      if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: 'Verification Failed',
        description: errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true,
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const formatTimestamp = (timestamp: bigint) => {
    if (timestamp === BigInt(0)) return 'Not available'
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to clipboard',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }

  const foundResults = verificationResults.filter(r => r.exists)
  const notFoundResults = verificationResults.filter(r => !r.exists)

  // Show error if unsupported network
  if (!currentNetwork) {
    return (
      <main>
        <Container maxW="container.lg" py={20}>
          <VStack spacing={8}>
            <Box textAlign="center">
              <Heading as="h1" size="xl" mb={4} color="red.400">
                Unsupported Network
              </Heading>
              <Text fontSize="lg" color="gray.400" mb={6}>
                Please switch to one of the supported networks:
              </Text>
              <VStack spacing={2}>
                <Text color="blue.300">• Sepolia Testnet (Chain ID: 11155111)</Text>
                <Text color="green.300">• Filecoin Calibration (Chain ID: 314159)</Text>
              </VStack>
              <Text fontSize="sm" color="gray.500" mt={4}>
                Current Chain ID: {chainId || 'Unknown'}
              </Text>
            </Box>
          </VStack>
        </Container>
      </main>
    )
  }

  return (
    <main>
      <Container maxW="container.lg" py={20}>
        <VStack spacing={8} align="stretch">
          <header>
            <Heading as="h1" size="xl" mb={2}>
              Verify Documents
            </Heading>
            <Text fontSize="lg" color="gray.400">
              Verify document authenticity across all registered institutions
            </Text>
            <Badge colorScheme="blue" mt={2}>
              Network: {currentNetwork.name}
            </Badge>
          </header>

          {/* Registry Status */}
          <section aria-label="Registry Status">
            <Box
              bg="whiteAlpha.100"
              p={4}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.600"
            >
              <HStack justify="space-between" mb={4}>
                <HStack>
                  <Icon as={FiDatabase} color="blue.300" />
                  <Text fontSize="md" fontWeight="medium">
                    Registry Status
                  </Text>
                </HStack>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadAllRegistries}
                  isLoading={isLoadingRegistries}
                  loadingText="Loading..."
                >
                  Refresh
                </Button>
              </HStack>

              {isLoadingRegistries ? (
                <HStack>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="gray.400">
                    Loading registries...
                  </Text>
                </HStack>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Box textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="blue.300">
                      {totalRegistries}
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      Total Registries
                    </Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="green.300">
                      {registries.reduce((sum, r) => {
                        console.log(`📊 Processing Registry: ${r.institutionName}`)
                        console.log(`  - Raw documentCount:`, r.documentCount)
                        console.log(`  - Type:`, typeof r.documentCount)
                        console.log(`  - toString():`, r.documentCount.toString())
                        console.log(`  - As hex:`, '0x' + r.documentCount.toString(16))
                        console.log(`  - Number(toString()):`, Number(r.documentCount.toString()))
                        console.log(`  - Direct Number():`, Number(r.documentCount))

                        // SAFER CONVERSION METHOD
                        let docCount = 0
                        try {
                          const strValue = r.documentCount.toString()
                          console.log(`  - String value: "${strValue}"`)

                          if (strValue === '0' || strValue === '') {
                            docCount = 0
                          } else {
                            // Try parsing as integer
                            const parsed = parseInt(strValue, 10)
                            docCount = isNaN(parsed) ? 0 : Math.min(parsed, 1000) // Cap at 1000 for safety
                          }

                          console.log(`  - Final docCount used:`, docCount)
                          console.log(`  - Running sum before:`, sum)
                          console.log(`  - Running sum after:`, sum + docCount)
                          console.log(`  -------------------------`)
                        } catch (error) {
                          console.error(
                            `❌ Error converting documentCount for ${r.institutionName}:`,
                            error
                          )
                          docCount = 0
                        }

                        return sum + docCount
                      }, 0)}
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      Total Documents
                    </Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="purple.300">
                      {registries.reduce((sum, r) => {
                        let agentCount = 0
                        try {
                          const strValue = r.agentCount.toString()
                          agentCount = strValue === '0' ? 0 : parseInt(strValue, 10)
                          if (isNaN(agentCount)) agentCount = 0
                        } catch (error) {
                          console.error(
                            `❌ Error converting agentCount for ${r.institutionName}:`,
                            error
                          )
                          agentCount = 0
                        }
                        return sum + agentCount
                      }, 0)}
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      Total Agents
                    </Text>
                  </Box>
                </SimpleGrid>
              )}

              {registries.length > 0 && (
                <Accordion allowMultiple mt={4}>
                  <AccordionItem border="none">
                    <AccordionButton
                      bg="whiteAlpha.100"
                      borderRadius="md"
                      _hover={{ bg: 'whiteAlpha.200' }}
                    >
                      <Box flex="1" textAlign="left">
                        <Text fontSize="sm" fontWeight="medium">
                          View Registry Details ({registries.length} registries)
                        </Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4} pt={4}>
                      <VStack spacing={3} align="stretch">
                        {registries.map((registry, index) => (
                          <Box
                            key={registry.address}
                            bg="whiteAlpha.50"
                            p={3}
                            borderRadius="md"
                            border="1px solid"
                            borderColor="gray.700"
                          >
                            <HStack justify="space-between" mb={2}>
                              <Text fontSize="sm" fontWeight="medium" color="blue.300">
                                {registry.institutionName}
                              </Text>
                              <HStack spacing={2}>
                                <Badge colorScheme={registry.isValid ? 'green' : 'red'} size="sm">
                                  {(() => {
                                    try {
                                      const strValue = registry.documentCount.toString()
                                      const parsed = parseInt(strValue, 10)
                                      return isNaN(parsed) ? 0 : parsed
                                    } catch (e) {
                                      return 0
                                    }
                                  })()}{' '}
                                  docs
                                </Badge>
                                <Badge colorScheme="purple" size="sm">
                                  {(() => {
                                    try {
                                      const strValue = registry.agentCount.toString()
                                      const parsed = parseInt(strValue, 10)
                                      return isNaN(parsed) ? 0 : parsed
                                    } catch (e) {
                                      return 0
                                    }
                                  })()}{' '}
                                  agents
                                </Badge>
                              </HStack>
                            </HStack>
                            <Text
                              fontSize="xs"
                              fontFamily="mono"
                              color="gray.400"
                              cursor="pointer"
                              onClick={() => copyToClipboard(registry.address)}
                              _hover={{ color: 'gray.300' }}
                              mb={1}
                            >
                              {registry.address}
                            </Text>
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="gray.500">
                                Admin: {registry.admin}
                              </Text>
                              <Badge colorScheme={registry.isValid ? 'green' : 'gray'} size="xs">
                                {registry.isValid ? 'Valid' : 'Invalid'}
                              </Badge>
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              )}
            </Box>
          </section>

          {/* Document Upload & CID Generation */}
          <section aria-label="Document Upload">
            <Box borderRadius="md">
              <VStack spacing={6} align="stretch">
                {!selectedFile ? (
                  <Box
                    borderWidth={2}
                    borderStyle="dashed"
                    borderColor="gray.500"
                    borderRadius="lg"
                    p={8}
                    textAlign="center"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{
                      borderColor: '#45a2f8',
                      bg: 'whiteAlpha.50',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <VStack spacing={3}>
                      <Icon as={FiUpload} boxSize={8} color="gray.400" />
                      <Box>
                        <Text fontSize="md" fontWeight="medium" mb={1}>
                          Drop your document here, or{' '}
                          <Text as="span" color="#45a2f8" textDecoration="underline">
                            browse
                          </Text>
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Supports PDF, DOC, DOCX, TXT (Max 10MB)
                        </Text>
                      </Box>
                    </VStack>
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileSelect}
                    />
                  </Box>
                ) : (
                  <VStack spacing={4}>
                    <Box
                      bg="whiteAlpha.200"
                      borderRadius="lg"
                      p={4}
                      border="1px solid"
                      borderColor="gray.600"
                      w="100%"
                    >
                      <Flex justify="space-between" align="center">
                        <HStack spacing={3}>
                          <Icon as={FiFile} boxSize={5} color="#45a2f8" />
                          <Box>
                            <Text fontSize="md" fontWeight="medium" noOfLines={1}>
                              {selectedFile.name}
                            </Text>
                            <Text fontSize="sm" color="gray.400">
                              {formatFileSize(selectedFile.size)}
                            </Text>
                          </Box>
                        </HStack>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleFileRemove}
                          leftIcon={<Icon as={FiX} />}
                          _hover={{ bg: 'whiteAlpha.200' }}
                        >
                          Remove
                        </Button>
                      </Flex>
                    </Box>

                    {/* CID Display */}
                    {documentCID && (
                      <Box
                        bg="blue.900"
                        border="1px solid"
                        borderColor="blue.500"
                        borderRadius="md"
                        p={4}
                        w="100%"
                      >
                        <HStack spacing={3} mb={2}>
                          <Icon as={FiHash} color="blue.300" />
                          <Text fontSize="sm" color="blue.300" fontWeight="medium">
                            Document CID
                          </Text>
                        </HStack>
                        <Box
                          bg="whiteAlpha.100"
                          p={2}
                          borderRadius="sm"
                          cursor="pointer"
                          onClick={() => copyToClipboard(documentCID)}
                          _hover={{ bg: 'whiteAlpha.200' }}
                        >
                          <Text
                            fontSize="xs"
                            color="blue.300"
                            fontFamily="mono"
                            wordBreak="break-all"
                          >
                            {documentCID}
                          </Text>
                        </Box>
                        <Text fontSize="xs" color="gray.400" mt={1}>
                          Click to copy • This CID will be used for verification
                        </Text>
                      </Box>
                    )}
                  </VStack>
                )}

                {/* Alternative CID Input */}
                <Box>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold" mb={3}>
                      Or enter document CID/hash directly
                    </FormLabel>
                    <Input
                      value={cidInput}
                      onChange={e => setCidInput(e.target.value)}
                      placeholder="Enter IPFS CID or hash here"
                      size="lg"
                      bg="whiteAlpha.200"
                      border="1px solid"
                      borderColor="gray.600"
                      _focus={{
                        borderColor: '#45a2f8',
                        boxShadow: '0 0 0 1px #45a2f8',
                      }}
                    />
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      {selectedFile
                        ? 'CID will be calculated from uploaded file during verification'
                        : 'Enter the IPFS hash manually or upload a document above'}
                    </Text>
                  </FormControl>
                </Box>

                {/* Progress Status Bar */}
                {progress > 0 && (
                  <Box
                    bg="whiteAlpha.200"
                    borderRadius="md"
                    p={4}
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                  >
                    <VStack spacing={3}>
                      <Text fontSize="sm" fontWeight="medium" color="blue.300">
                        {progressStatus}
                      </Text>
                      <Progress
                        value={progress}
                        size="sm"
                        colorScheme="blue"
                        w="100%"
                        bg="whiteAlpha.200"
                        borderRadius="full"
                      />
                    </VStack>
                  </Box>
                )}

                {/* Verify Button */}
                <Button
                  onClick={handleVerifyDocument}
                  bg="#45a2f8"
                  color="white"
                  _hover={{ bg: '#3182ce' }}
                  _disabled={{
                    bg: 'gray.600',
                    color: 'gray.400',
                    cursor: 'not-allowed',
                  }}
                  isDisabled={(!selectedFile && !cidInput.trim()) || registries.length === 0}
                  isLoading={isVerifying}
                  loadingText="Verifying..."
                  size="lg"
                  leftIcon={<Icon as={FiShield} />}
                  w="100%"
                >
                  Verify Across All Registries
                </Button>

                {!selectedFile && !cidInput.trim() && (
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    Upload a document or enter a CID to verify
                  </Text>
                )}
              </VStack>
            </Box>
          </section>

          {/* Verification Results */}
          {verificationResults.length > 0 && (
            <section aria-label="Verification Results">
              <VStack spacing={6} align="stretch">
                {/* Summary */}
                <Box
                  bg={foundResults.length > 0 ? 'green.900' : 'orange.900'}
                  border="1px solid"
                  borderColor={foundResults.length > 0 ? 'green.500' : 'orange.500'}
                  borderRadius="md"
                  p={6}
                >
                  <HStack spacing={3} mb={4}>
                    <Icon
                      as={foundResults.length > 0 ? FiCheck : FiX}
                      color={foundResults.length > 0 ? 'green.300' : 'orange.300'}
                      boxSize={6}
                    />
                    <Heading size="md" color={foundResults.length > 0 ? 'green.300' : 'orange.300'}>
                      {foundResults.length > 0 ? `Document Verified ✅` : 'Document Not Found ❌'}
                    </Heading>
                  </HStack>

                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="white">
                        {verificationResults.length}
                      </Text>
                      <Text fontSize="sm" color="gray.300">
                        Registries Checked
                      </Text>
                    </Box>
                    <Box textAlign="center">
                      <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        color={foundResults.length > 0 ? 'green.300' : 'orange.300'}
                      >
                        {foundResults.length}
                      </Text>
                      <Text fontSize="sm" color="gray.300">
                        Document Found In
                      </Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="gray.300">
                        {notFoundResults.length}
                      </Text>
                      <Text fontSize="sm" color="gray.300">
                        Not Found In
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Found Results */}
                {foundResults.length > 0 && (
                  <Box>
                    <Heading size="md" mb={4} color="green.300">
                      ✅ Verified Institutions ({foundResults.length})
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      {foundResults.map((result, index) => (
                        <Box
                          key={`found-${index}`}
                          bg="green.900"
                          border="1px solid"
                          borderColor="green.500"
                          borderRadius="md"
                          p={4}
                        >
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <Text fontSize="lg" fontWeight="medium" color="green.300">
                                {result.institutionName}
                              </Text>
                              <Badge colorScheme="green">Verified</Badge>
                            </HStack>

                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              <VStack align="stretch" spacing={2}>
                                <HStack justify="space-between">
                                  <Text fontSize="sm" color="green.300">
                                    Issued At:
                                  </Text>
                                  <Text fontSize="sm" color="green.200">
                                    {formatTimestamp(result.timestamp)}
                                  </Text>
                                </HStack>

                                <HStack justify="space-between">
                                  <Text fontSize="sm" color="green.300">
                                    Registry:
                                  </Text>
                                  <Text
                                    fontSize="xs"
                                    fontFamily="mono"
                                    color="green.200"
                                    cursor="pointer"
                                    onClick={() => copyToClipboard(result.registryAddress)}
                                    _hover={{ color: 'green.100' }}
                                  >
                                    {result.registryAddress}
                                  </Text>
                                </HStack>
                              </VStack>

                              {result.issuedBy && (
                                <VStack align="stretch" spacing={2}>
                                  <HStack justify="space-between">
                                    <Text fontSize="sm" color="green.300">
                                      Issued By:
                                    </Text>
                                    <Text
                                      fontSize="xs"
                                      fontFamily="mono"
                                      color="green.200"
                                      cursor="pointer"
                                      onClick={() => copyToClipboard(result.issuedBy!)}
                                      _hover={{ color: 'green.100' }}
                                    >
                                      {result.issuedBy!}
                                    </Text>
                                  </HStack>
                                </VStack>
                              )}
                            </SimpleGrid>

                            {result.metadata && (
                              <Box>
                                <Text fontSize="sm" fontWeight="medium" color="green.300" mb={2}>
                                  Metadata:
                                </Text>
                                <Box
                                  bg="whiteAlpha.100"
                                  p={2}
                                  borderRadius="sm"
                                  maxH="100px"
                                  overflowY="auto"
                                >
                                  <Text fontSize="xs" color="green.200" fontFamily="mono">
                                    {result.metadata}
                                  </Text>
                                </Box>
                              </Box>
                            )}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Not Found Results */}
                {notFoundResults.length > 0 && (
                  <Accordion allowMultiple>
                    <AccordionItem border="none">
                      <AccordionButton
                        bg="orange.900"
                        borderRadius="md"
                        _hover={{ bg: 'orange.800' }}
                        border="1px solid"
                        borderColor="orange.500"
                      >
                        <Box flex="1" textAlign="left">
                          <HStack>
                            <Icon as={FiX} color="orange.300" />
                            <Text fontSize="md" fontWeight="medium" color="orange.300">
                              Document Not Found In ({notFoundResults.length} registries)
                            </Text>
                          </HStack>
                        </Box>
                        <AccordionIcon color="orange.300" />
                      </AccordionButton>
                      <AccordionPanel pb={4} pt={4}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                          {notFoundResults.map((result, index) => (
                            <Box
                              key={`not-found-${index}`}
                              bg="whiteAlpha.100"
                              border="1px solid"
                              borderColor="gray.600"
                              borderRadius="md"
                              p={3}
                            >
                              <VStack spacing={2} align="stretch">
                                <HStack justify="space-between">
                                  <Text fontSize="sm" fontWeight="medium" color="gray.300">
                                    {result.institutionName}
                                  </Text>
                                  <Badge colorScheme="gray" size="sm">
                                    Not Found
                                  </Badge>
                                </HStack>
                                <Text
                                  fontSize="xs"
                                  fontFamily="mono"
                                  color="gray.500"
                                  cursor="pointer"
                                  onClick={() => copyToClipboard(result.registryAddress)}
                                  _hover={{ color: 'gray.400' }}
                                >
                                  {result.registryAddress}
                                </Text>
                              </VStack>
                            </Box>
                          ))}
                        </SimpleGrid>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                )}

                {/* Additional Document Info */}
                {documentCID && (
                  <Box
                    bg="blue.900"
                    border="1px solid"
                    borderColor="blue.500"
                    borderRadius="md"
                    p={4}
                  >
                    <VStack spacing={3} align="stretch">
                      <HStack spacing={3}>
                        <Icon as={FiHash} color="blue.300" />
                        <Text fontSize="sm" color="blue.300" fontWeight="medium">
                          Document Information
                        </Text>
                      </HStack>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="blue.300">
                              Document CID:
                            </Text>
                            <Text
                              fontSize="xs"
                              fontFamily="mono"
                              color="blue.200"
                              cursor="pointer"
                              onClick={() => copyToClipboard(documentCID)}
                              _hover={{ color: 'blue.100' }}
                            >
                              {documentCID}
                            </Text>
                          </HStack>

                          {selectedFile && (
                            <>
                              <HStack justify="space-between">
                                <Text fontSize="sm" color="blue.300">
                                  File Name:
                                </Text>
                                <Text fontSize="sm" color="blue.200" noOfLines={1}>
                                  {selectedFile.name}
                                </Text>
                              </HStack>

                              <HStack justify="space-between">
                                <Text fontSize="sm" color="blue.300">
                                  File Size:
                                </Text>
                                <Text fontSize="sm" color="blue.200">
                                  {formatFileSize(selectedFile.size)}
                                </Text>
                              </HStack>
                            </>
                          )}
                        </VStack>

                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color="blue.300">
                              Verification Time:
                            </Text>
                            <Text fontSize="sm" color="blue.200">
                              {new Date().toLocaleString()}
                            </Text>
                          </HStack>

                          <HStack justify="space-between">
                            <Text fontSize="sm" color="blue.300">
                              Network:
                            </Text>
                            <Badge
                              colorScheme={
                                chainId === 314159
                                  ? 'green'
                                  : chainId === 11155111
                                    ? 'blue'
                                    : 'orange'
                              }
                              size="sm"
                            >
                              {currentNetwork?.name || `Chain ${chainId}` || 'Unknown Network'}
                            </Badge>
                          </HStack>

                          <HStack justify="space-between">
                            <Text fontSize="sm" color="blue.300">
                              Status:
                            </Text>
                            <Badge
                              colorScheme={foundResults.length > 0 ? 'green' : 'orange'}
                              size="sm"
                            >
                              {foundResults.length > 0 ? 'Verified' : 'Unverified'}
                            </Badge>
                          </HStack>
                        </VStack>
                      </SimpleGrid>

                      <Text fontSize="xs" color="gray.400" textAlign="center" mt={2}>
                        Click addresses to copy • All data retrieved from blockchain
                      </Text>
                    </VStack>
                  </Box>
                )}
              </VStack>
            </section>
          )}

          {/* Help Section */}
          <section aria-label="Help Information">
            <Box
              bg="whiteAlpha.50"
              p={6}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.700"
            >
              <VStack spacing={4} align="stretch">
                <Heading size="sm" color="gray.300">
                  How Document Verification Works
                </Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="sm" fontWeight="medium" color="blue.300">
                      1. Upload or Enter CID
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      Upload your document file or enter an IPFS CID directly. We&apos;ll compute
                      the unique hash for verification.
                    </Text>

                    <Text fontSize="sm" fontWeight="medium" color="blue.300">
                      2. Multi-Registry Check
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      We automatically check your document against all registered institution
                      databases on the blockchain.
                    </Text>
                  </VStack>

                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="sm" fontWeight="medium" color="blue.300">
                      3. Instant Results
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      Get immediate verification results showing which institutions have issued this
                      document and when.
                    </Text>

                    <Text fontSize="sm" fontWeight="medium" color="blue.300">
                      4. Blockchain Security
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      All verification data is stored immutably on the blockchain, ensuring
                      tamper-proof records.
                    </Text>
                  </VStack>
                </SimpleGrid>

                <Divider />

                <HStack justify="center" spacing={6}>
                  <HStack>
                    <Icon as={FiShield} color="green.400" />
                    <Text fontSize="xs" color="gray.400">
                      Secure & Private
                    </Text>
                  </HStack>
                  <HStack>
                    <Icon as={FiDatabase} color="blue.400" />
                    <Text fontSize="xs" color="gray.400">
                      Blockchain Verified
                    </Text>
                  </HStack>
                  <HStack>
                    <Icon as={FiCheck} color="purple.400" />
                    <Text fontSize="xs" color="gray.400">
                      Instant Results
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
            </Box>
          </section>
        </VStack>
      </Container>
    </main>
  )
}
