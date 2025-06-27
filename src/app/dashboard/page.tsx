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
  useToast,
  Icon,
  Flex,
  HStack,
  Progress,
  Spinner,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Divider,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  IconButton,
  Tooltip,
} from '@chakra-ui/react'
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import {
  FiUpload,
  FiFile,
  FiX,
  FiHash,
  FiExternalLink,
  FiCheck,
  FiPlay,
  FiUsers,
  FiUserPlus,
  FiUserMinus,
  FiTrash2,
  FiCopy,
  FiRefreshCw,
} from 'react-icons/fi'
import { getDocumentCID } from '../lib/documentHash'
import { BrowserProvider, Contract, formatEther, parseEther, JsonRpcSigner } from 'ethers'
import Link from 'next/link'

// Contract configuration
const VERIDOCS_FACTORY_ADDRESS = '0x36FB4c117507a98e780922246860E499Bb7E996C'

// Factory contract ABI - only what we need
const FACTORY_ABI = [
  'function deployedRegistries(uint256) view returns (address)',
  'function getInstitutionCount() view returns (uint256)',
  'function getAllInstitutions() view returns (address[])',
]

// Registry contract ABI - enhanced with agent management functions
const REGISTRY_ABI = [
  'function admin() view returns (address)',
  'function agents(address) view returns (bool)',
  'function institutionName() view returns (string)',
  'function issueDocumentOpenBar(string memory cid)',
  'function verifyDocument(string memory cid) external view returns (bool exists, uint256 timestamp, string memory institutionName)',
  'function getDocumentDetails(string memory cid) external view returns (bool exists, uint256 timestamp, string memory institutionName, string memory metadata, address issuedBy)',
  'function getDocumentCount() external view returns (uint256)',
  'function addAgent(address agent)',
  'function revokeAgent(address agent)',
  'function getActiveAgents() external view returns (address[])',
  'event AgentAdded(address indexed agent, address indexed addedBy)',
  'event AgentRevoked(address indexed agent, address indexed revokedBy)',
]

interface IssueResult {
  txHash: string
  cid: string
  timestamp: string
  registryAddress: string
  blockNumber: number
}

interface UserRole {
  type: 'admin' | 'agent'
  registryAddress: string
  institutionName: string
}

interface Agent {
  address: string
  isActive: boolean
}

export default function Dashboard() {
  const { isConnected, address } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const toast = useToast()
  const t = useTranslation()

  // Document issuance states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [issueResult, setIssueResult] = useState<IssueResult | null>(null)
  const [isIssuing, setIsIssuing] = useState(false)
  const [isCalculatingCID, setIsCalculatingCID] = useState(false)
  const [documentCID, setDocumentCID] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressStatus, setProgressStatus] = useState('')

  // User and balance states
  const [balance, setBalance] = useState<string>('0.0000')
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isCheckingRole, setIsCheckingRole] = useState(false)

  // Agent management states
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoadingAgents, setIsLoadingAgents] = useState(false)
  const [newAgentAddress, setNewAgentAddress] = useState('')
  const [isAddingAgent, setIsAddingAgent] = useState(false)
  const [agentToRevoke, setAgentToRevoke] = useState<string | null>(null)
  const [isRevokingAgent, setIsRevokingAgent] = useState(false)

  // Modal and dialog states
  const {
    isOpen: isAddAgentOpen,
    onOpen: onAddAgentOpen,
    onClose: onAddAgentClose,
  } = useDisclosure()
  const { isOpen: isRevokeOpen, onOpen: onRevokeOpen, onClose: onRevokeClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check user role when connected
  useEffect(() => {
    if (isConnected && address && walletProvider) {
      // Add a small delay to ensure wallet provider is fully ready
      const timeoutId = setTimeout(() => {
        checkUserRole()
      }, 500)

      return () => clearTimeout(timeoutId)
    } else {
      setUserRole(null)
      setAgents([])
    }
  }, [isConnected, address, walletProvider])

  // Load agents when user role is admin
  useEffect(() => {
    if (userRole?.type === 'admin') {
      loadAgents()
    }
  }, [userRole])

  // Fetch balance when wallet is connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !walletProvider || !address) {
        setBalance('0.0000')
        return
      }

      setIsLoadingBalance(true)
      try {
        const ethersProvider = new BrowserProvider(walletProvider as any)
        const balanceWei = await ethersProvider.getBalance(address)
        const balanceEth = formatEther(balanceWei)
        setBalance(parseFloat(balanceEth).toFixed(4))
      } catch (error) {
        console.error('Error fetching balance:', error)
        setBalance('Error')
      } finally {
        setIsLoadingBalance(false)
      }
    }

    fetchBalance()
  }, [isConnected, walletProvider, address])

  const checkUserRole = async () => {
    if (!walletProvider || !address) return

    setIsCheckingRole(true)
    try {
      const ethersProvider = new BrowserProvider(walletProvider as any)

      // Add retry logic with exponential backoff
      const maxRetries = 3
      let retryCount = 0

      while (retryCount < maxRetries) {
        try {
          const factoryContract = new Contract(
            VERIDOCS_FACTORY_ADDRESS,
            FACTORY_ABI,
            ethersProvider
          )

          // Get all deployed registries
          const registryAddresses = await factoryContract.getAllInstitutions()
          console.log('All registries:', registryAddresses)

          // Check each registry to see if user is admin or agent
          for (const registryAddress of registryAddresses) {
            const registryContract = new Contract(registryAddress, REGISTRY_ABI, ethersProvider)

            try {
              // Check if user is admin
              const adminAddress = await registryContract.admin()
              if (adminAddress.toLowerCase() === address.toLowerCase()) {
                const institutionName = await registryContract.institutionName()
                setUserRole({
                  type: 'admin',
                  registryAddress,
                  institutionName,
                })
                console.log('current user is: admin')
                return
              }

              // Check if user is agent
              const isAgent = await registryContract.agents(address)
              if (isAgent) {
                const institutionName = await registryContract.institutionName()
                setUserRole({
                  type: 'agent',
                  registryAddress,
                  institutionName,
                })
                console.log('current user is: agent')
                return
              }
            } catch (error) {
              console.error(`Error checking registry ${registryAddress}:`, error)
            }
          }

          // If we get here, user is neither admin nor agent of any registry
          setUserRole(null)
          console.log('current user is: nobody')
          break // Success, exit retry loop
        } catch (error) {
          retryCount++
          console.warn(`Role check attempt ${retryCount} failed:`, error)

          if (retryCount === maxRetries) {
            throw error // Throw on final attempt
          }

          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      toast({
        title: 'Error',
        description: 'Failed to check user permissions. Please refresh the page.',
        status: 'error',
        duration: 7000,
        isClosable: true,
      })
    } finally {
      setIsCheckingRole(false)
    }
  }

  const loadAgents = async () => {
    if (!userRole || userRole.type !== 'admin' || !walletProvider) return

    setIsLoadingAgents(true)
    try {
      const ethersProvider = new BrowserProvider(walletProvider as any)
      const registryContract = new Contract(userRole.registryAddress, REGISTRY_ABI, ethersProvider)

      // Get active agents from contract
      const activeAgentAddresses = await registryContract.getActiveAgents()

      // Convert to Agent interface
      const agentList: Agent[] = activeAgentAddresses.map((addr: string) => ({
        address: addr,
        isActive: true,
      }))

      setAgents(agentList)
      console.log('Loaded agents:', agentList)
    } catch (error) {
      console.error('Error loading agents:', error)
      toast({
        title: 'Error',
        description: 'Failed to load agents list',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoadingAgents(false)
    }
  }

  const handleAddAgent = async () => {
    if (!newAgentAddress.trim()) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Ethereum address',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Basic address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(newAgentAddress.trim())) {
      toast({
        title: 'Invalid Address Format',
        description: 'Please enter a valid Ethereum address (0x...)',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (!userRole || userRole.type !== 'admin' || !walletProvider || !address) {
      toast({
        title: 'Not Authorized',
        description: 'Only admins can add agents',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    // Check if agent already exists
    const agentExists = agents.some(
      agent => agent.address.toLowerCase() === newAgentAddress.trim().toLowerCase()
    )

    if (agentExists) {
      toast({
        title: 'Agent Already Exists',
        description: 'This address is already an agent',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setIsAddingAgent(true)

    try {
      const provider = new BrowserProvider(walletProvider as any)
      const signer = new JsonRpcSigner(provider, address)
      const registryContract = new Contract(userRole.registryAddress, REGISTRY_ABI, signer)

      // Call addAgent function
      const tx = await registryContract.addAgent(newAgentAddress.trim())
      console.log('Add agent transaction submitted:', tx.hash)

      toast({
        title: 'Transaction Submitted',
        description: 'Adding agent to registry...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })

      // Wait for confirmation
      const receipt = await tx.wait(1)
      console.log('Agent added successfully in block:', receipt.blockNumber)

      toast({
        title: 'Agent Added Successfully',
        description: `Agent ${newAgentAddress.slice(0, 6)}...${newAgentAddress.slice(-4)} has been added`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Refresh agents list
      await loadAgents()

      // Reset form and close modal
      setNewAgentAddress('')
      onAddAgentClose()
    } catch (error: any) {
      console.error('Error adding agent:', error)

      let errorMessage = 'Failed to add agent'
      if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction'
      } else if (error.message?.includes('already exists')) {
        errorMessage = 'Agent already exists in the registry'
      }

      toast({
        title: 'Add Agent Failed',
        description: errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true,
      })
    } finally {
      setIsAddingAgent(false)
    }
  }

  const handleRevokeAgent = async () => {
    if (!agentToRevoke || !userRole || userRole.type !== 'admin' || !walletProvider || !address) {
      return
    }

    setIsRevokingAgent(true)

    try {
      const provider = new BrowserProvider(walletProvider as any)
      const signer = new JsonRpcSigner(provider, address)
      const registryContract = new Contract(userRole.registryAddress, REGISTRY_ABI, signer)

      // Call revokeAgent function
      const tx = await registryContract.revokeAgent(agentToRevoke)
      console.log('Revoke agent transaction submitted:', tx.hash)

      toast({
        title: 'Transaction Submitted',
        description: 'Revoking agent access...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })

      // Wait for confirmation
      const receipt = await tx.wait(1)
      console.log('Agent revoked successfully in block:', receipt.blockNumber)

      toast({
        title: 'Agent Revoked Successfully',
        description: `Agent ${agentToRevoke.slice(0, 6)}...${agentToRevoke.slice(-4)} has been revoked`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Refresh agents list
      await loadAgents()

      // Close dialog
      onRevokeClose()
      setAgentToRevoke(null)
    } catch (error: any) {
      console.error('Error revoking agent:', error)

      let errorMessage = 'Failed to revoke agent'
      if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction'
      }

      toast({
        title: 'Revoke Agent Failed',
        description: errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true,
      })
    } finally {
      setIsRevokingAgent(false)
    }
  }

  const openRevokeDialog = (agentAddress: string) => {
    setAgentToRevoke(agentAddress)
    onRevokeOpen()
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

  // ... (keeping existing file handling functions)
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
      setIssueResult(null)
      setDocumentCID(null)

      // Calculate CID immediately when file is selected
      await calculateCID(file)
    }
  }

  const calculateCID = async (file: File) => {
    setIsCalculatingCID(true)
    setProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const cid = await getDocumentCID(file)

      clearInterval(progressInterval)
      setProgress(100)
      setDocumentCID(cid)

      toast({
        title: 'CID Generated',
        description: 'Document hash calculated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error calculating CID:', error)
      toast({
        title: 'CID Calculation Failed',
        description: 'Failed to calculate document hash',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsCalculatingCID(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setIssueResult(null)
    setDocumentCID(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleIssue = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a document to issue',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (!documentCID) {
      toast({
        title: 'CID not available',
        description: 'Please wait for document hash calculation to complete',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (!address || !walletProvider) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to issue documents',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (!userRole) {
      toast({
        title: 'Not authorized',
        description: 'You must be an admin or agent to issue documents',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setIsIssuing(true)

    try {
      console.log('Starting transaction process...')

      // Create ethers provider
      const provider = new BrowserProvider(walletProvider as any)
      console.log('Provider created successfully')

      // Get network first to avoid potential issues
      const network = await provider.getNetwork()
      console.log('Connected to network:', network.name, 'Chain ID:', network.chainId.toString())

      // Create signer
      const signer = new JsonRpcSigner(provider, address)
      console.log('JsonRpcSigner created successfully with address:', address)

      if (!userRole.registryAddress) {
        throw new Error('No registry address found')
      }

      // Create registry contract instance
      const registryContract = new Contract(userRole.registryAddress, REGISTRY_ABI, signer)

      // Call issueDocumentOpenBar function
      console.log('Issuing document with CID:', documentCID)

      // Use a simple transaction object approach
      const tx = await signer.sendTransaction({
        to: userRole.registryAddress,
        data: registryContract.interface.encodeFunctionData('issueDocumentOpenBar', [documentCID]),
      })

      console.log('Transaction submitted via sendTransaction:', tx.hash)

      setProgress(40)
      setProgressStatus(
        `Transaction submitted (${tx.hash.slice(0, 10)}...) - Waiting for confirmation...`
      )

      // Wait for transaction confirmation
      const receipt: any = await tx.wait(1)
      console.log('Transaction confirmed in block:', receipt.blockNumber)

      // Create result object
      const result: IssueResult = {
        txHash: tx.hash,
        cid: documentCID,
        timestamp: new Date().toISOString(),
        registryAddress: userRole.registryAddress,
        blockNumber: receipt.blockNumber,
      }
      setProgress(60)

      setProgressStatus(`Document registered successfully in block ${receipt.blockNumber}! 🎉`)
      setProgress(100)

      setIssueResult(result)

      // Refresh balance after transaction
      if (address && walletProvider) {
        try {
          const provider = new BrowserProvider(walletProvider as any)
          const balanceWei = await provider.getBalance(address)
          const balanceEth = formatEther(balanceWei)
          setBalance(parseFloat(balanceEth).toFixed(4))
        } catch (error) {
          console.error('Error refreshing balance:', error)
        }
      }
    } catch (error: any) {
      console.error('Error issuing document:', error)

      let errorMessage = 'An error occurred while issuing the document'

      if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction'
      } else if (error.message?.includes('execution reverted')) {
        errorMessage =
          'Contract call failed - check if contract address is correct and function exists'
      } else if (error.message?.includes('already exists')) {
        errorMessage = 'Document with this hash already exists on blockchain'
      } else if (error.message?.includes('could not coalesce error')) {
        errorMessage =
          'Wallet connection issue. Please try disconnecting and reconnecting your wallet.'
      } else if (error.message?.includes('eth_requestAccounts')) {
        errorMessage =
          'Authentication issue with social login. Please try reconnecting your wallet.'
      } else if (error.message?.includes('Unable to get signer')) {
        errorMessage = error.message
      } else if (error.code === 'CALL_EXCEPTION') {
        errorMessage = 'Contract call failed - verify contract address and network'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: 'Issue Failed',
        description: errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true,
      })
    } finally {
      setIsIssuing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isConnected) {
    return (
      <Container maxW="container.sm" py={20}>
        <VStack spacing={8} align="center">
          <Heading>Dashboard</Heading>
          <Text>Please connect your wallet to access the dashboard.</Text>

          {/* Test Dashboard Button */}
          <Box
            bg="blue.900"
            border="1px solid"
            borderColor="blue.500"
            borderRadius="md"
            p={6}
            w="100%"
            textAlign="center"
          >
            <VStack spacing={4}>
              <Icon as={FiPlay} boxSize={8} color="blue.300" />
              <Heading size="md" color="blue.300">
                Want to Try Document Issuance?
              </Heading>
              <Text fontSize="sm" color="gray.400" textAlign="center">
                Experience how the document issuance process works without connecting a wallet
              </Text>
              <Link href="/dashboard-test" passHref>
                <Button
                  bg="blue.600"
                  color="white"
                  _hover={{ bg: 'blue.500' }}
                  leftIcon={<Icon as={FiPlay} />}
                  size="lg"
                >
                  Try Test Dashboard
                </Button>
              </Link>
            </VStack>
          </Box>
        </VStack>
      </Container>
    )
  }

  return (
    <main>
      <Container maxW="container.lg" py={20}>
        <VStack spacing={6} align="stretch">
          <header>
            <Heading as="h1" size="xl" mb={2}>
              Dashboard
            </Heading>
            <Text fontSize="lg" color="gray.400">
              {userRole?.type === 'admin' ? 'Admin Management Portal' : 'Issue a document'}
            </Text>
          </header>

          {/* User Role Status */}
          <section aria-label="User Status">
            <Box p={6} borderWidth={1} borderRadius="lg" bg="gray.800">
              <VStack spacing={4}>
                <Heading size="md">User Status</Heading>
                {isCheckingRole ? (
                  <HStack>
                    <Spinner size="sm" />
                    <Text>Checking permissions...</Text>
                  </HStack>
                ) : userRole ? (
                  <VStack spacing={2}>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      color={userRole.type === 'admin' ? 'green.400' : 'blue.400'}
                    >
                      Role: {userRole.type.toUpperCase()}
                    </Text>
                    <Text>Institution: {userRole.institutionName}</Text>
                    <Text fontSize="sm" color="gray.400">
                      Registry: {userRole.registryAddress}
                    </Text>
                  </VStack>
                ) : (
                  <VStack spacing={4}>
                    <Text color="red.400" fontWeight="medium" fontSize="lg">
                      Unauthorized
                    </Text>
                    <Text fontSize="sm" color="gray.400" textAlign="center">
                      You are not an admin or agent of any registered institution
                    </Text>

                    {/* Test Dashboard Redirect */}
                    <Box
                      bg="blue.900"
                      border="1px solid"
                      borderColor="blue.500"
                      borderRadius="md"
                      p={4}
                      w="100%"
                      textAlign="center"
                    >
                      <VStack spacing={3}>
                        <Icon as={FiPlay} boxSize={6} color="blue.300" />
                        <Text fontSize="sm" color="blue.300" fontWeight="medium">
                          Want to Try Document Issuance?
                        </Text>
                        <Text fontSize="xs" color="gray.400" textAlign="center">
                          Experience the process without authorization requirements
                        </Text>
                        <Link href="/dashboard-test" passHref>
                          <Button
                            bg="blue.600"
                            color="white"
                            _hover={{ bg: 'blue.500' }}
                            leftIcon={<Icon as={FiPlay} />}
                            size="md"
                          >
                            Try Test Dashboard
                          </Button>
                        </Link>
                      </VStack>
                    </Box>
                  </VStack>
                )}
              </VStack>
            </Box>
          </section>

          <section aria-label="Account Information">
            {/* Only show the orange "Copy this address" box if user is NOT admin or agent */}
            {!isCheckingRole && !userRole && (
              <Box
                bg="orange.900"
                border="2px solid"
                borderColor="orange.500"
                borderRadius="lg"
                p={6}
                w="100%"
                textAlign="center"
              >
                <VStack spacing={4}>
                  <Icon as={FiCopy} boxSize={8} color="orange.300" />
                  <Text fontSize="md" color="orange.300" fontWeight="bold">
                    Your Wallet Address
                  </Text>
                  <Box
                    bg="whiteAlpha.200"
                    p={4}
                    borderRadius="md"
                    w="100%"
                    cursor="pointer"
                    onClick={() => copyToClipboard(address || '')}
                    _hover={{ bg: 'whiteAlpha.300' }}
                    transition="all 0.2s"
                  >
                    <Text
                      fontFamily="mono"
                      fontSize="lg"
                      fontWeight="bold"
                      color="white"
                      wordBreak="break-all"
                    >
                      {address}
                    </Text>
                  </Box>
                  <Text fontSize="sm" color="orange.200" textAlign="center" lineHeight="1.5">
                    📋{' '}
                    <Text as="span" fontWeight="medium">
                      Copy this address
                    </Text>{' '}
                    and give it to your institution&apos;s admin so they can add you as an agent.
                  </Text>
                  <Text fontSize="xs" color="gray.400" textAlign="center">
                    Click the address above to copy it to your clipboard
                  </Text>
                </VStack>
              </Box>
            )}

            <Box pt={6} pb={6}>
              <VStack spacing={2} align="stretch">
                <Text>
                  <Text as="span" fontWeight="medium">
                    Your Address:
                  </Text>{' '}
                  {address}
                </Text>
                <Flex align="center" gap={2}>
                  <Text fontWeight="medium">ETH Balance:</Text>
                  {isLoadingBalance ? (
                    <HStack spacing={2}>
                      <Spinner size="xs" />
                      <Text fontSize="sm" color="gray.400">
                        Loading...
                      </Text>
                    </HStack>
                  ) : (
                    <Text fontFamily="mono" color={balance === 'Error' ? 'red.400' : 'green.400'}>
                      {balance} ETH
                    </Text>
                  )}
                  {/* Add manual refresh button for role checking */}
                  {!isCheckingRole && (
                    <Button
                      size="xs"
                      variant="outline"
                      leftIcon={<Icon as={FiRefreshCw} />}
                      onClick={checkUserRole}
                      ml={4}
                    >
                      Refresh Role
                    </Button>
                  )}
                </Flex>
              </VStack>
            </Box>
          </section>

          {!userRole ? (
            <Box p={6} borderWidth={1} borderRadius="lg" bg="red.900" borderColor="red.600">
              <VStack spacing={4}>
                <Icon as={FiX} boxSize={8} color="red.400" />
                <Text textAlign="center" fontSize="lg">
                  You are not authorized to issue documents.
                </Text>
                <Text textAlign="center" color="gray.400">
                  You must be an admin or agent of a registered institution to use this dashboard.
                </Text>
              </VStack>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, lg: userRole.type === 'admin' ? 2 : 1 }} spacing={6}>
              {/* Admin Panel - Agent Management */}
              {userRole.type === 'admin' && (
                <Box>
                  <VStack spacing={6} align="stretch">
                    <Card bg="gray.800" borderColor="gray.600">
                      <CardHeader>
                        <HStack justify="space-between">
                          <HStack>
                            <Icon as={FiUsers} boxSize={5} color="green.400" />
                            <Heading size="md" color="green.400">
                              Agent Management
                            </Heading>
                          </HStack>
                          <HStack>
                            <Tooltip label="Refresh agents list">
                              <IconButton
                                aria-label="Refresh agents"
                                icon={<FiRefreshCw />}
                                size="sm"
                                variant="ghost"
                                onClick={loadAgents}
                                isLoading={isLoadingAgents}
                              />
                            </Tooltip>
                            <Button
                              leftIcon={<Icon as={FiUserPlus} />}
                              colorScheme="green"
                              size="sm"
                              onClick={onAddAgentOpen}
                            >
                              Add Agent
                            </Button>
                          </HStack>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        {isLoadingAgents ? (
                          <VStack spacing={4}>
                            <Spinner />
                            <Text>Loading agents...</Text>
                          </VStack>
                        ) : agents.length === 0 ? (
                          <VStack spacing={4} py={8}>
                            <Icon as={FiUsers} boxSize={12} color="gray.500" />
                            <Text color="gray.400" textAlign="center">
                              No agents found for this registry
                            </Text>
                            <Button
                              leftIcon={<Icon as={FiUserPlus} />}
                              colorScheme="green"
                              onClick={onAddAgentOpen}
                            >
                              Add First Agent
                            </Button>
                          </VStack>
                        ) : (
                          <VStack spacing={4}>
                            <HStack justify="space-between" w="100%">
                              <Text fontSize="sm" color="gray.400">
                                {agents.length} agent{agents.length !== 1 ? 's' : ''} registered
                              </Text>
                            </HStack>

                            <Box w="100%" overflowX="auto">
                              <Table variant="simple" size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>Agent Address</Th>
                                    <Th>Status</Th>
                                    <Th>Actions</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {agents.map(agent => (
                                    <Tr key={agent.address}>
                                      <Td>
                                        <HStack>
                                          <Text fontFamily="mono" fontSize="sm">
                                            {agent.address.slice(0, 6)}...{agent.address.slice(-4)}
                                          </Text>
                                          <Tooltip label="Copy full address">
                                            <IconButton
                                              aria-label="Copy address"
                                              icon={<FiCopy />}
                                              size="xs"
                                              variant="ghost"
                                              onClick={() => copyToClipboard(agent.address)}
                                            />
                                          </Tooltip>
                                        </HStack>
                                      </Td>
                                      <Td>
                                        <Badge
                                          colorScheme={agent.isActive ? 'green' : 'red'}
                                          variant="subtle"
                                        >
                                          {agent.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </Td>
                                      <Td>
                                        <HStack spacing={1}>
                                          <Tooltip label="View on Etherscan">
                                            <IconButton
                                              aria-label="View on Etherscan"
                                              icon={<FiExternalLink />}
                                              size="xs"
                                              variant="ghost"
                                              onClick={() =>
                                                window.open(
                                                  `https://sepolia.etherscan.io/address/${agent.address}`,
                                                  '_blank'
                                                )
                                              }
                                            />
                                          </Tooltip>
                                          {agent.isActive && (
                                            <Tooltip label="Revoke agent">
                                              <IconButton
                                                aria-label="Revoke agent"
                                                icon={<FiUserMinus />}
                                                size="xs"
                                                colorScheme="red"
                                                variant="ghost"
                                                onClick={() => openRevokeDialog(agent.address)}
                                              />
                                            </Tooltip>
                                          )}
                                        </HStack>
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Box>
                          </VStack>
                        )}
                      </CardBody>
                    </Card>
                  </VStack>
                </Box>
              )}

              {/* Document Issuance Panel */}
              <Box>
                <section aria-label="Document Upload">
                  <Card bg="gray.800" borderColor="gray.600">
                    <CardHeader>
                      <HStack>
                        <Icon as={FiUpload} boxSize={5} color="blue.400" />
                        <Heading size="md" color="blue.400">
                          Document Issuance
                        </Heading>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl>
                          <FormLabel fontSize="md" fontWeight="semibold" mb={3}>
                            Upload Document to Issue
                          </FormLabel>

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

                              {/* CID Calculation Status */}
                              {isCalculatingCID && (
                                <Box
                                  bg="blue.900"
                                  border="1px solid"
                                  borderColor="blue.500"
                                  borderRadius="md"
                                  p={4}
                                  w="100%"
                                >
                                  <HStack spacing={3} mb={2}>
                                    <Spinner size="sm" color="blue.300" />
                                    <Text fontSize="sm" color="blue.300">
                                      Calculating IPFS hash...
                                    </Text>
                                  </HStack>
                                  {progress > 0 && (
                                    <Progress value={progress} size="sm" colorScheme="blue" />
                                  )}
                                </Box>
                              )}
                            </VStack>
                          )}
                        </FormControl>

                        <Button
                          onClick={handleIssue}
                          bg="#45a2f8"
                          color="white"
                          _hover={{ bg: '#3182ce' }}
                          _disabled={{
                            bg: 'gray.600',
                            color: 'gray.400',
                            cursor: 'not-allowed',
                          }}
                          isDisabled={
                            !selectedFile || !documentCID || isCalculatingCID || !userRole
                          }
                          isLoading={isIssuing}
                          loadingText="Issuing Document..."
                          size="lg"
                          leftIcon={<Icon as={FiUpload} />}
                        >
                          Issue Document on Blockchain
                        </Button>

                        {(!selectedFile || !documentCID) && (
                          <Text fontSize="sm" color="gray.500" textAlign="center">
                            {!selectedFile
                              ? 'Please select a document to issue'
                              : 'Calculating document hash...'}
                          </Text>
                        )}

                        {/* Progress Status Bar */}
                        {progress > 0 && (
                          <Box
                            mt={6}
                            p={4}
                            bg="whiteAlpha.100"
                            borderRadius="md"
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

                        {issueResult && (
                          <Box
                            bg="green.900"
                            border="1px solid"
                            borderColor="green.500"
                            borderRadius="md"
                            p={4}
                            mt={4}
                          >
                            <VStack spacing={3} align="stretch">
                              <HStack spacing={3}>
                                <Icon as={FiCheck} color="green.300" boxSize={5} />
                                <Text fontSize="md" color="green.300" fontWeight="bold">
                                  Document Issued Successfully! 🎉
                                </Text>
                              </HStack>

                              <Box>
                                <Text fontSize="sm" color="green.300" fontWeight="medium" mb={1}>
                                  Transaction Hash:
                                </Text>
                                <Box
                                  bg="whiteAlpha.100"
                                  p={2}
                                  borderRadius="sm"
                                  cursor="pointer"
                                  onClick={() => copyToClipboard(issueResult.txHash)}
                                  _hover={{ bg: 'whiteAlpha.200' }}
                                >
                                  <Flex align="center" justify="space-between">
                                    <Text fontSize="xs" fontFamily="mono" wordBreak="break-all">
                                      {issueResult.txHash}
                                    </Text>
                                    <Icon
                                      as={FiExternalLink}
                                      color="green.300"
                                      boxSize={3}
                                      ml={2}
                                      cursor="pointer"
                                      onClick={e => {
                                        e.stopPropagation()
                                        window.open(
                                          `https://sepolia.etherscan.io/tx/${issueResult.txHash}`,
                                          '_blank'
                                        )
                                      }}
                                    />
                                  </Flex>
                                </Box>
                              </Box>

                              <Box>
                                <Text fontSize="sm" color="green.300" fontWeight="medium" mb={1}>
                                  IPFS Hash (CID):
                                </Text>
                                <Box
                                  bg="whiteAlpha.100"
                                  p={2}
                                  borderRadius="sm"
                                  cursor="pointer"
                                  onClick={() => copyToClipboard(issueResult.cid)}
                                  _hover={{ bg: 'whiteAlpha.200' }}
                                >
                                  <Text fontSize="xs" fontFamily="mono" wordBreak="break-all">
                                    {issueResult.cid}
                                  </Text>
                                </Box>
                              </Box>

                              <Box>
                                <Text fontSize="sm" color="green.300" fontWeight="medium" mb={1}>
                                  Block Number:
                                </Text>
                                <Box bg="whiteAlpha.100" p={2} borderRadius="sm">
                                  <Text fontSize="xs" fontFamily="mono">
                                    {issueResult.blockNumber}
                                  </Text>
                                </Box>
                              </Box>

                              <Text fontSize="xs" color="gray.400" textAlign="center">
                                Click any hash to copy • Click 🔗 to view on Etherscan
                              </Text>
                            </VStack>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </section>
              </Box>
            </SimpleGrid>
          )}
        </VStack>

        {/* Add Agent Modal */}
        <Modal isOpen={isAddAgentOpen} onClose={onAddAgentClose} size="md">
          <ModalOverlay />
          <ModalContent bg="gray.800" borderColor="gray.600">
            <ModalHeader>
              <HStack>
                <Icon as={FiUserPlus} color="green.400" />
                <Text>Add New Agent</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Text fontSize="sm" color="gray.400">
                  Add a new agent to your registry. Agents can issue documents on behalf of your
                  institution.
                </Text>

                <FormControl isRequired>
                  <FormLabel>Agent Ethereum Address</FormLabel>
                  <Input
                    placeholder="0x..."
                    value={newAgentAddress}
                    onChange={e => setNewAgentAddress(e.target.value)}
                    fontFamily="mono"
                    isDisabled={isAddingAgent}
                  />
                </FormControl>

                <Box
                  bg="yellow.900"
                  border="1px solid"
                  borderColor="yellow.600"
                  borderRadius="md"
                  p={3}
                  w="100%"
                >
                  <Text fontSize="xs" color="yellow.200">
                    ⚠️ Make sure the address is correct. Agent privileges cannot be easily revoked
                    once granted.
                  </Text>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={onAddAgentClose} isDisabled={isAddingAgent}>
                  Cancel
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleAddAgent}
                  isLoading={isAddingAgent}
                  loadingText="Adding Agent..."
                  leftIcon={<Icon as={FiUserPlus} />}
                >
                  Add Agent
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Revoke Agent Confirmation Dialog */}
        <AlertDialog isOpen={isRevokeOpen} leastDestructiveRef={cancelRef} onClose={onRevokeClose}>
          <AlertDialogOverlay>
            <AlertDialogContent bg="gray.800" borderColor="gray.600">
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                <HStack>
                  <Icon as={FiUserMinus} color="red.400" />
                  <Text>Revoke Agent Access</Text>
                </HStack>
              </AlertDialogHeader>

              <AlertDialogBody>
                <VStack spacing={4} align="start">
                  <Text>Are you sure you want to revoke agent access for:</Text>
                  <Box bg="whiteAlpha.100" p={3} borderRadius="md" w="100%">
                    <Text fontFamily="mono" fontSize="sm" wordBreak="break-all">
                      {agentToRevoke}
                    </Text>
                  </Box>
                  <Box
                    bg="red.900"
                    border="1px solid"
                    borderColor="red.600"
                    borderRadius="md"
                    p={3}
                    w="100%"
                  >
                    <Text fontSize="sm" color="red.200">
                      ⚠️ This action cannot be undone. The agent will immediately lose the ability
                      to issue documents.
                    </Text>
                  </Box>
                </VStack>
              </AlertDialogBody>

              <AlertDialogFooter>
                <HStack spacing={3}>
                  <Button ref={cancelRef} onClick={onRevokeClose} isDisabled={isRevokingAgent}>
                    Cancel
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={handleRevokeAgent}
                    isLoading={isRevokingAgent}
                    loadingText="Revoking..."
                    leftIcon={<Icon as={FiTrash2} />}
                  >
                    Revoke Agent
                  </Button>
                </HStack>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    </main>
  )
}
