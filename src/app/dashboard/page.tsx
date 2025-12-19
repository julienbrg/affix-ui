'use client'

import {
  Text,
  VStack,
  Box,
  Heading,
  Container,
  Flex,
  HStack,
  Textarea,
  Grid,
  Link as ChakraLink,
} from '@chakra-ui/react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toaster } from '@/components/ui/toaster'
import Spinner from '@/components/Spinner'
import { useState, useEffect, useRef } from 'react'
import { useW3PK } from '@/context/W3PK'
import { useTranslation } from '@/hooks/useTranslation'
import {
  FiUpload,
  FiFile,
  FiX,
  FiHash,
  FiShield,
  FiCheck,
  FiUser,
  FiUserPlus,
  FiAlertCircle,
  FiCopy,
  FiExternalLink,
} from 'react-icons/fi'
import { getDocumentCID } from '@/lib/documentHash'
import { ethers } from 'ethers'
import { NETWORK_CONFIGS, AFFIX_REGISTRY_ABI, AFFIX_FACTORY_ABI } from '@/lib/contracts'

const DEFAULT_NETWORK = 10 // OP Mainnet
const currentNetwork = NETWORK_CONFIGS[DEFAULT_NETWORK]
const FACTORY_ADDRESS = currentNetwork.factoryAddress
const RPC_URL = currentNetwork.rpcUrl

const ROLES = ['nobody', 'agent', 'admin'] as const
type Role = (typeof ROLES)[number]

// Custom signer that uses w3pk for signing with STANDARD mode
class W3PKSigner extends ethers.AbstractSigner {
  constructor(
    public address: string,
    provider: ethers.Provider,
    private w3pkHelpers: { signMessage: (message: string, options?: any) => Promise<string | null> }
  ) {
    super(provider)
  }

  async getAddress(): Promise<string> {
    return this.address
  }

  async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
    console.log('signTransaction called with:', {
      to: tx.to,
      data: tx.data,
      dataLength: tx.data ? (tx.data as string).length : 0,
      nonce: tx.nonce,
      gasLimit: tx.gasLimit?.toString(),
      value: tx.value?.toString(),
    })

    // Build transaction with explicit value field
    const transaction = ethers.Transaction.from({
      to: tx.to as string,
      data: tx.data as string,
      value: tx.value || 0n,
      nonce: tx.nonce as number,
      gasLimit: tx.gasLimit,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      chainId: tx.chainId as number,
      type: 2,
    })

    console.log('Transaction object created:', {
      to: transaction.to,
      data: transaction.data,
      dataLength: transaction.data ? transaction.data.length : 0,
      value: transaction.value.toString(),
      nonce: transaction.nonce,
      gasLimit: transaction.gasLimit.toString(),
    })

    // Get hash to sign
    const txHash = ethers.keccak256(transaction.unsignedSerialized)
    console.log('Signing transaction hash:', txHash)

    // Sign with w3pk using STANDARD mode + rawHash
    const signature = await this.w3pkHelpers.signMessage(txHash, {
      mode: 'STANDARD',
      tag: 'MAIN',
      signingMethod: 'rawHash',
    })

    if (!signature) {
      throw new Error('Failed to sign transaction - signature is null')
    }

    console.log('Signature received:', signature.slice(0, 20) + '...')

    // Attach signature
    transaction.signature = ethers.Signature.from(signature)

    console.log('Serialized transaction length:', transaction.serialized.length)

    // Return serialized signed transaction
    return transaction.serialized
  }

  connect(provider: ethers.Provider): ethers.Signer {
    return new W3PKSigner(this.address, provider, this.w3pkHelpers)
  }

  async signMessage(message: string | Uint8Array): Promise<string> {
    throw new Error('signMessage not implemented')
  }

  async signTypedData(): Promise<string> {
    throw new Error('signTypedData not implemented')
  }
}

export default function DashboardPage() {
  const { isAuthenticated, user, login, getAddress, signMessage } = useW3PK()
  const t = useTranslation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentCID, setDocumentCID] = useState<string | null>(null)
  const [metadata, setMetadata] = useState('')
  const [isIssuingDocument, setIsIssuingDocument] = useState(false)
  const [isMakingAgent, setIsMakingAgent] = useState(false)
  const [isCheckingRole, setIsCheckingRole] = useState(true)
  const [newAgentAddress, setNewAgentAddress] = useState('')
  const [currentUserAddress, setCurrentUserAddress] = useState<string>('')
  const [role, setRole] = useState<Role>('nobody')
  const [entityName, setEntityName] = useState<string>('')
  const [registryAddress, setRegistryAddress] = useState<string>('')
  const [agentList, setAgentList] = useState<string[]>([])
  const [isLoadingAgents, setIsLoadingAgents] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const checkUserRole = async () => {
      if (!isAuthenticated || !currentUserAddress) {
        setIsCheckingRole(false)
        setRole('nobody')
        setRegistryAddress('')
        setEntityName('')
        return
      }

      setIsCheckingRole(true)
      console.log('🔍 Starting role check for address:', currentUserAddress)
      console.log('🌐 Using network:', currentNetwork.name)

      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL)

        console.log('🏭 Factory contract address:', FACTORY_ADDRESS)
        const factoryContract = new ethers.Contract(FACTORY_ADDRESS, AFFIX_FACTORY_ABI, provider)

        // Get all deployed registries from factory
        const registryAddresses = await factoryContract.getAllEntities()
        console.log('🏢 All registry addresses found:', registryAddresses)
        console.log('📈 Number of registries:', registryAddresses.length)

        if (registryAddresses.length === 0) {
          console.log('ℹ️ No registries found in factory')
          setRole('nobody')
          setRegistryAddress('')
          setEntityName('')
          return
        }

        // Check each registry to see if user is admin or agent
        for (let i = 0; i < registryAddresses.length; i++) {
          const currentRegistryAddress = registryAddresses[i]
          console.log(
            `\n🔍 Checking registry ${i + 1}/${registryAddresses.length}:`,
            currentRegistryAddress
          )

          try {
            const registryContract = new ethers.Contract(
              currentRegistryAddress,
              AFFIX_REGISTRY_ABI,
              provider
            )

            // Get entity info first
            let name = 'Unknown'
            try {
              name = await registryContract.entityName()
              console.log('🏫 Entity name:', name)
            } catch (error) {
              console.warn('⚠️ Could not get entity name:', error)
            }

            // Check if user can issue documents (covers both admin and agent cases)
            try {
              const canIssue = await registryContract.canIssueDocuments(currentUserAddress)
              console.log('📝 Can issue documents:', canIssue)

              if (canIssue) {
                // Check if user is admin
                try {
                  const ownerAddress = await registryContract.owner()
                  const isAdmin = ownerAddress.toLowerCase() === currentUserAddress.toLowerCase()

                  console.log('👑 Owner address:', ownerAddress)
                  console.log('🔑 Your address:', currentUserAddress)
                  console.log('👑 Is admin:', isAdmin)

                  setRole(isAdmin ? 'admin' : 'agent')
                  setRegistryAddress(currentRegistryAddress)
                  setEntityName(name)

                  console.log(`✅ ${isAdmin ? 'ADMIN' : 'AGENT'} MATCH FOUND!`)
                  console.log(`🎉 User role set to ${isAdmin ? 'admin' : 'agent'} for:`, name)
                  return // Stop searching once we find a match
                } catch (error) {
                  console.error('❌ Error checking admin status:', error)
                }
              }
            } catch (error) {
              console.error('❌ Error checking document issuance permission:', error)
            }
          } catch (error) {
            console.error(`❌ Error checking registry ${currentRegistryAddress}:`, error)
          }
        }

        // If we get here, user is neither admin nor agent of any registry
        console.log('❌ No matching admin or agent role found')
        setRole('nobody')
        setRegistryAddress('')
        setEntityName('')
      } catch (error) {
        console.error('💥 Critical error in role checking:', error)
        setRole('nobody')
        setRegistryAddress('')
        setEntityName('')
      } finally {
        setIsCheckingRole(false)
      }
    }

    checkUserRole()
  }, [isAuthenticated, currentUserAddress])

  useEffect(() => {
    const fetchUserAddress = async () => {
      if (!isAuthenticated) {
        setCurrentUserAddress('')
        return
      }

      try {
        const address = await getAddress('STANDARD', 'MAIN')
        setCurrentUserAddress(address)
      } catch (error) {
        console.error('Error fetching user address:', error)
      }
    }

    fetchUserAddress()
  }, [isAuthenticated, getAddress])

  // Fetch agents when registry address changes
  useEffect(() => {
    const fetchAgents = async () => {
      if (!registryAddress || role !== 'admin') {
        setAgentList([])
        return
      }

      setIsLoadingAgents(true)
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL)
        const registryContract = new ethers.Contract(registryAddress, AFFIX_REGISTRY_ABI, provider)

        const agents = await registryContract.getActiveAgents()
        console.log('Fetched agents:', agents)
        setAgentList(agents)
      } catch (error) {
        console.error('Error fetching agents:', error)
        setAgentList([])
      } finally {
        setIsLoadingAgents(false)
      }
    }

    fetchAgents()
  }, [registryAddress, role])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toaster.create({
          title: t.dashboard.issueDocument.fileTooLarge,
          description: t.dashboard.issueDocument.fileTooLargeDesc,
          type: 'error',
          duration: 5000,
        })
        return
      }

      setSelectedFile(file)
      setDocumentCID(null)

      try {
        const cid = await getDocumentCID(file)
        setDocumentCID(cid)
        toaster.create({
          title: t.dashboard.issueDocument.cidGenerated,
          description: t.dashboard.issueDocument.cidGeneratedDesc,
          type: 'success',
          duration: 3000,
        })
      } catch (error) {
        console.error('Error computing CID:', error)
        toaster.create({
          title: t.dashboard.issueDocument.error,
          description: t.dashboard.issueDocument.computeError,
          type: 'error',
          duration: 5000,
        })
      }
    }
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setDocumentCID(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleIssueDocument = async () => {
    if (!documentCID) {
      toaster.create({
        title: t.dashboard.issueDocument.noDocument,
        description: t.dashboard.issueDocument.noDocumentDesc,
        type: 'warning',
        duration: 5000,
      })
      return
    }

    if (!isAuthenticated) {
      toaster.create({
        title: t.dashboard.issueDocument.notAuthenticated,
        description: t.dashboard.issueDocument.notAuthenticatedDesc,
        type: 'warning',
        duration: 5000,
      })
      return
    }

    setIsIssuingDocument(true)
    try {
      // 1. Get user address
      const userAddress = currentUserAddress || (await getAddress('STANDARD', 'MAIN'))
      console.log('User address:', userAddress)

      // 2. Create provider and signer
      const provider = new ethers.JsonRpcProvider(RPC_URL)
      const signer = new W3PKSigner(userAddress, provider, { signMessage })

      // 3. Verify user can issue documents (owner or agent) and registry is set
      if (!registryAddress) {
        throw new Error('No registry address found. Please ensure you have proper permissions.')
      }

      const registryContract = new ethers.Contract(registryAddress, AFFIX_REGISTRY_ABI, signer)
      const canIssue = await registryContract.canIssueDocuments(userAddress)
      console.log('Can issue documents?', canIssue)

      if (!canIssue) {
        throw new Error(
          `Address ${userAddress} is not authorized to issue documents on this registry.`
        )
      }

      console.log('Issuing document with CID:', documentCID)
      console.log('Metadata:', metadata || '(none)')

      // 4. Build and send transaction
      const functionName = metadata ? 'issueDocumentWithMetadata' : 'issueDocument'
      const args = metadata ? [documentCID, metadata] : [documentCID]

      toaster.create({
        title: t.dashboard.issueDocument.txSubmitted,
        description: 'Please sign the transaction',
        type: 'info',
        duration: 3000,
      })

      const tx = await registryContract[functionName](...args)
      console.log('Transaction submitted:', tx.hash)

      toaster.create({
        title: t.dashboard.issueDocument.txSubmitted,
        description: `${t.dashboard.issueDocument.txHash}: ${tx.hash.slice(0, 10)}...`,
        type: 'info',
        duration: 3000,
      })

      // 5. Wait for confirmation
      const receipt = await tx.wait()

      console.log('Transaction confirmed in block:', receipt.blockNumber)

      // Check if transaction was successful
      if (receipt.status === 0) {
        throw new Error('Transaction reverted onchain. Check if you have the correct permissions.')
      }

      toaster.create({
        title: t.dashboard.issueDocument.success,
        description: `${t.dashboard.issueDocument.viewTxOn} ${currentNetwork.explorerName}`,
        type: 'success',
        duration: 10000,
        action: {
          label: t.dashboard.issueDocument.viewTx,
          onClick: () => {
            window.open(`${currentNetwork.blockExplorer}/tx/${tx.hash}`, '_blank')
          },
        },
      })

      // Clear form after success
      handleFileRemove()
      setMetadata('')
    } catch (error: any) {
      console.error('Error issuing document:', error)

      let errorMessage = 'Failed to issue document'

      if (error.message?.includes('user rejected') || error.message?.includes('cancelled')) {
        errorMessage = 'Authorization was cancelled by user'
      } else if (error.message?.includes('nonce')) {
        errorMessage = 'Transaction nonce error. Please try again.'
      } else if (
        error.message?.includes('revert') ||
        error.message?.includes('execution reverted')
      ) {
        errorMessage =
          'Transaction reverted. You may not have permission to issue documents on this registry.'
      } else if (error.message) {
        errorMessage = error.message
      }

      toaster.create({
        title: t.dashboard.issueDocument.failed,
        description: errorMessage,
        type: 'error',
        duration: 7000,
      })
    } finally {
      setIsIssuingDocument(false)
    }
  }

  const handleMakeAgent = async () => {
    if (!newAgentAddress.trim()) {
      toaster.create({
        title: t.dashboard.addAgent.noAddress,
        description: t.dashboard.addAgent.noAddressDesc,
        type: 'warning',
        duration: 5000,
      })
      return
    }

    if (!ethers.isAddress(newAgentAddress)) {
      toaster.create({
        title: t.dashboard.addAgent.invalidAddress,
        description: t.dashboard.addAgent.invalidAddressDesc,
        type: 'error',
        duration: 5000,
      })
      return
    }

    if (!registryAddress) {
      toaster.create({
        title: t.dashboard.addAgent.noRegistry,
        description: t.dashboard.addAgent.noRegistryDesc,
        type: 'error',
        duration: 5000,
      })
      return
    }

    setIsMakingAgent(true)
    try {
      // 1. Get user address
      const userAddress = currentUserAddress || (await getAddress('STANDARD', 'MAIN'))
      console.log('Admin address:', userAddress)

      // 2. Create provider and signer
      const provider = new ethers.JsonRpcProvider(RPC_URL)
      const signer = new W3PKSigner(userAddress, provider, { signMessage })

      // 3. Connect to registry contract
      const registryContract = new ethers.Contract(registryAddress, AFFIX_REGISTRY_ABI, signer)

      // Check if already an agent
      const isAlreadyAgent = await registryContract.isAgent(newAgentAddress)

      if (isAlreadyAgent) {
        toaster.create({
          title: t.dashboard.addAgent.alreadyAgent,
          description: `${newAgentAddress.slice(0, 6)}...${newAgentAddress.slice(-4)} is already an agent`,
          type: 'success',
          duration: 5000,
        })
        setNewAgentAddress('')
        return
      }

      // 4. Build and send transaction
      toaster.create({
        title: 'Adding agent',
        description: 'Please sign the transaction',
        type: 'info',
        duration: 3000,
      })

      // Send 0.000001 ETH as required by the contract
      const tx = await registryContract.addAgent(newAgentAddress, {
        value: ethers.parseEther('0.000001'),
      })
      console.log('Transaction submitted:', tx.hash)

      toaster.create({
        title: 'Transaction submitted',
        description: `Hash: ${tx.hash.slice(0, 10)}...`,
        type: 'info',
        duration: 3000,
      })

      // 5. Wait for confirmation
      const receipt = await tx.wait()

      console.log('Transaction confirmed in block:', receipt.blockNumber)

      // Check if transaction was successful
      if (receipt.status === 0) {
        throw new Error('Transaction reverted onchain.')
      }

      toaster.create({
        title: t.dashboard.addAgent.success,
        description: `${newAgentAddress.slice(0, 6)}...${newAgentAddress.slice(-4)} is now an agent`,
        type: 'success',
        duration: 5000,
      })

      setNewAgentAddress('')

      // Refresh agent list
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL)
        const registryContract = new ethers.Contract(registryAddress, AFFIX_REGISTRY_ABI, provider)
        const agents = await registryContract.getActiveAgents()
        setAgentList(agents)
      } catch (error) {
        console.error('Error refreshing agent list:', error)
      }
    } catch (error: any) {
      console.error('Error making agent:', error)

      let errorMessage = 'An error occurred'

      if (error.message?.includes('user rejected') || error.message?.includes('cancelled')) {
        errorMessage = 'Transaction was cancelled by user'
      } else if (error.message?.includes('nonce')) {
        errorMessage = 'Transaction nonce error. Please try again.'
      } else if (
        error.message?.includes('revert') ||
        error.message?.includes('execution reverted')
      ) {
        errorMessage = 'Transaction reverted. You may not have permission to add agents.'
      } else if (error.message) {
        errorMessage = error.message
      }

      toaster.create({
        title: t.dashboard.addAgent.failed,
        description: errorMessage,
        type: 'error',
        duration: 7000,
      })
    } finally {
      setIsMakingAgent(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toaster.create({
      title: t.verify.upload.copied,
      type: 'info',
      duration: 2000,
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isAuthenticated) {
    return (
      <Container maxW="container.lg" py={20}>
        <VStack gap={8} align="stretch">
          <Box p={6} borderRadius="md" textAlign="center">
            <Heading as="h1" size="xl" mb={4}>
              {t.dashboard.title}
            </Heading>
            <Text mb={6} color="gray.400">
              {t.dashboard.subtitle}
            </Text>
            <Text fontSize="sm" color="gray.500">
              <Button
                variant="plain"
                as="span"
                color="gray.500"
                textDecorationStyle="dotted"
                textUnderlineOffset="3px"
                cursor="pointer"
                _hover={{ color: 'gray.300' }}
                onClick={login}
                fontSize="sm"
              >
                {t.dashboard.loginPrompt}{' '}
              </Button>
            </Text>
          </Box>

          <Box
            bg="orange.900"
            border="1px solid"
            borderColor="orange.500"
            borderRadius="md"
            p={4}
            maxW="md"
            mx="auto"
          >
            <HStack gap={3}>
              <FiAlertCircle size={20} color="orange" />
              <Box flex={1}>
                <Text fontSize="sm" color="orange.200" mb={1}>
                  {t.dashboard.exploreWithout}
                </Text>
                <Text fontSize="xs" color="orange.300">
                  {t.dashboard.tryThe}{' '}
                  <ChakraLink
                    asChild
                    color="orange.100"
                    textDecoration="underline"
                    _hover={{ color: 'orange.50' }}
                  >
                    <Link href="/sandbox">{t.navigation.sandbox}</Link>
                  </ChakraLink>{' '}
                  {t.dashboard.toExplore}
                </Text>
              </Box>
            </HStack>
          </Box>
        </VStack>
      </Container>
    )
  }

  if (isCheckingRole) {
    return (
      <Container maxW="container.lg" py={20}>
        <VStack gap={6}>
          <Spinner size="xl" />
          <Text color="gray.400">{t.dashboard.checkingPermissions}</Text>
        </VStack>
      </Container>
    )
  }

  return (
    <main>
      <Container maxW="container.lg" py={20}>
        <VStack gap={8} align="stretch">
          <header>
            <Flex justify="space-between" align="center" mb={2}></Flex>
            <VStack align="start" gap={2}>
              <HStack gap={2}>
                <Text fontSize="lg" color="gray.400">
                  {t.dashboard.welcome}, {user?.displayName || user?.username}
                </Text>
                {role !== 'nobody' && (
                  <Badge colorPalette={role === 'admin' ? 'purple' : 'blue'} variant="solid" px={3}>
                    {role}
                  </Badge>
                )}
              </HStack>
              {currentUserAddress && (
                <Box
                  bg="whiteAlpha.100"
                  px={3}
                  py={2}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.600"
                >
                  <HStack gap={2}>
                    <FiUser size={14} color="#45a2f8" />
                    <Text fontSize="xs" color="gray.400" fontWeight="medium">
                      {t.dashboard.yourAddress}
                    </Text>
                    <Text fontSize="xs" fontFamily="mono" color="gray.300">
                      {currentUserAddress}
                    </Text>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => copyToClipboard(currentUserAddress)}
                    >
                      <FiCopy />
                    </Button>
                  </HStack>
                </Box>
              )}
            </VStack>
          </header>

          <Grid
            templateColumns={{ base: '1fr', lg: role === 'agent' ? '1fr' : 'repeat(2, 1fr)' }}
            gap={8}
          >
            {/* Issue Document Section */}
            {(role === 'agent' || role === 'admin') && (
              <section aria-label="Issue Document">
                <Box
                  bg="whiteAlpha.50"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                >
                  <VStack gap={6} align="stretch">
                    <VStack align="start" gap={2}>
                      <HStack>
                        <FiUpload size={20} color="#45a2f8" />
                        <Heading size="md">{t.dashboard.issueDocument.title}</Heading>
                      </HStack>
                      {entityName && (
                        <Text fontSize="sm" color="gray.400">
                          {t.dashboard.issueDocument.issueOnBehalf}{' '}
                          <Text as="span" color="gray.200" fontWeight="medium">
                            {entityName}
                          </Text>
                        </Text>
                      )}
                      {registryAddress && (
                        <Box
                          bg="whiteAlpha.100"
                          px={3}
                          py={2}
                          borderRadius="md"
                          border="1px solid"
                          borderColor="gray.600"
                          w="100%"
                        >
                          <Text fontSize="xs" color="gray.400" mb={1}>
                            {t.dashboard.issueDocument.contractAddress}
                          </Text>
                          <Flex align="center" gap={2}>
                            <Text
                              fontSize="xs"
                              fontFamily="mono"
                              color="gray.300"
                              flex={1}
                              lineClamp={1}
                            >
                              {registryAddress}
                            </Text>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => copyToClipboard(registryAddress)}
                            >
                              <FiCopy />
                            </Button>
                          </Flex>
                        </Box>
                      )}
                    </VStack>

                    {!selectedFile ? (
                      <Box
                        borderWidth={2}
                        borderStyle="dashed"
                        borderColor="gray.600"
                        borderRadius="md"
                        p={6}
                        textAlign="center"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{
                          borderColor: '#45a2f8',
                          bg: 'whiteAlpha.50',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <VStack gap={2}>
                          <FiFile size={24} color="gray" />
                          <Text fontSize="sm" color="gray.400">
                            {t.dashboard.issueDocument.clickToUpload}
                          </Text>
                        </VStack>
                        <input
                          ref={fileInputRef}
                          type="file"
                          hidden
                          accept="*/*"
                          onChange={handleFileSelect}
                        />
                      </Box>
                    ) : (
                      <VStack gap={3}>
                        <Box
                          bg="whiteAlpha.100"
                          borderRadius="md"
                          p={3}
                          border="1px solid"
                          borderColor="gray.600"
                          w="100%"
                        >
                          <Flex justify="space-between" align="center">
                            <HStack gap={2}>
                              <FiFile size={16} color="#45a2f8" />
                              <Box>
                                <Text fontSize="sm" lineClamp={1}>
                                  {selectedFile.name}
                                </Text>
                                <Text fontSize="xs" color="gray.400">
                                  {formatFileSize(selectedFile.size)}
                                </Text>
                              </Box>
                            </HStack>
                            <Button size="xs" variant="ghost" onClick={handleFileRemove}>
                              <FiX />
                            </Button>
                          </Flex>
                        </Box>

                        {documentCID && (
                          <Box
                            bg="blue.900"
                            border="1px solid"
                            borderColor="blue.500"
                            borderRadius="md"
                            p={3}
                            w="100%"
                          >
                            <HStack gap={2} mb={1}>
                              <FiHash size={14} color="blue" />
                              <Text fontSize="xs" color="blue.300" fontWeight="medium">
                                {t.dashboard.issueDocument.documentCID}
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
                          </Box>
                        )}
                      </VStack>
                    )}

                    {/* <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        Metadata (optional)
                      </Text>
                      <Textarea
                        value={metadata}
                        onChange={e => setMetadata(e.target.value)}
                        placeholder="Add any additional information about this document..."
                        rows={3}
                        px={4}
                        py={2}
                        bg="gray.900"
                        borderColor="gray.600"
                        borderWidth="1px"
                        _hover={{ borderColor: 'gray.500' }}
                        _focus={{
                          borderColor: '#45a2f8',
                          boxShadow: '0 0 0 1px #45a2f8',
                          bg: 'gray.800',
                        }}
                      />
                    </Box> */}

                    <Button
                      onClick={handleIssueDocument}
                      bg="#45a2f8"
                      color="white"
                      _hover={{ bg: '#3182ce' }}
                      disabled={!documentCID}
                      loading={isIssuingDocument}
                      w="100%"
                    >
                      <FiShield /> {t.dashboard.issueDocument.issueButton}
                    </Button>
                  </VStack>
                </Box>
              </section>
            )}

            {/* Agent Management Section */}
            {role === 'admin' && (
              <section aria-label="Agent Management">
                <Box
                  bg="whiteAlpha.50"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                >
                  <VStack gap={6} align="stretch">
                    <HStack>
                      <FiUserPlus size={20} color="#45a2f8" />
                      <Heading size="md">{t.dashboard.addAgent.title}</Heading>
                    </HStack>

                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        {t.dashboard.addAgent.agentAddress}
                      </Text>
                      <Input
                        value={newAgentAddress}
                        onChange={e => setNewAgentAddress(e.target.value)}
                        placeholder="0x..."
                        fontFamily="mono"
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {t.dashboard.addAgent.placeholder}
                      </Text>
                    </Box>

                    <Button
                      onClick={handleMakeAgent}
                      bg="purple.600"
                      color="white"
                      _hover={{ bg: 'purple.700' }}
                      disabled={!newAgentAddress.trim()}
                      loading={isMakingAgent}
                      w="100%"
                    >
                      <FiUserPlus /> {t.dashboard.addAgent.addButton}
                    </Button>

                    {/* Registry Info */}
                    {registryAddress && (
                      <Box
                        bg="whiteAlpha.100"
                        p={3}
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.600"
                      >
                        <Text fontSize="xs" color="gray.400" mb={1}>
                          {t.dashboard.addAgent.registryContract}
                        </Text>
                        <Flex align="center" gap={2}>
                          <Text
                            fontSize="xs"
                            fontFamily="mono"
                            color="gray.300"
                            flex={1}
                            lineClamp={1}
                          >
                            {registryAddress}
                          </Text>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => copyToClipboard(registryAddress)}
                          >
                            <FiCopy />
                          </Button>
                        </Flex>
                      </Box>
                    )}

                    {/* Current Agents List */}
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={3} color="gray.300">
                        Current Agents ({agentList.length})
                      </Text>
                      {isLoadingAgents ? (
                        <Box textAlign="center" py={4}>
                          <Spinner size="sm" />
                          <Text fontSize="xs" color="gray.500" mt={2}>
                            Loading agents...
                          </Text>
                        </Box>
                      ) : agentList.length > 0 ? (
                        <VStack gap={2} align="stretch">
                          {agentList.map((agent, index) => (
                            <Box
                              key={agent}
                              bg="whiteAlpha.100"
                              p={3}
                              borderRadius="md"
                              border="1px solid"
                              borderColor="gray.600"
                            >
                              <Flex align="center" gap={2}>
                                <Badge colorPalette="blue" size="sm">
                                  #{index + 1}
                                </Badge>
                                <Text
                                  fontSize="xs"
                                  fontFamily="mono"
                                  color="gray.300"
                                  flex={1}
                                  lineClamp={1}
                                >
                                  {agent}
                                </Text>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(agent)}
                                >
                                  <FiCopy />
                                </Button>
                                <ChakraLink
                                  href={`${currentNetwork.blockExplorer}/address/${agent}`}
                                  target="_blank"
                                >
                                  <Button size="xs" variant="ghost">
                                    <FiExternalLink />
                                  </Button>
                                </ChakraLink>
                              </Flex>
                            </Box>
                          ))}
                        </VStack>
                      ) : (
                        <Box
                          bg="whiteAlpha.50"
                          p={4}
                          borderRadius="md"
                          border="1px dashed"
                          borderColor="gray.600"
                          textAlign="center"
                        >
                          <Text fontSize="xs" color="gray.500">
                            No agents added yet
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </VStack>
                </Box>
              </section>
            )}
          </Grid>
        </VStack>
      </Container>
    </main>
  )
}
