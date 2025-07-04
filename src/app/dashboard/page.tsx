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
  Textarea,
} from '@chakra-ui/react'
import { useAppKitAccount, useAppKitProvider, useAppKitNetwork } from '@reown/appkit/react'
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
import {
  BrowserProvider,
  Contract,
  formatEther,
  parseEther,
  JsonRpcSigner,
  JsonRpcProvider,
} from 'ethers'
import Link from 'next/link'
import { useAppKit } from '@reown/appkit/react'
import { keyframes } from '@emotion/react'

// Network configuration
const NETWORK_CONFIGS = {
  11155111: {
    name: 'Sepolia Testnet',
    factoryAddress: '0x...', // Replace with actual Sepolia factory address
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY', // Replace with actual Sepolia RPC
    blockExplorer: 'https://sepolia.etherscan.io',
    explorerName: 'Sepolia Etherscan',
  },
  314159: {
    name: 'Filecoin Calibration',
    factoryAddress: '0xB5CAb4359CBd4C03867A1320a14a6e4DBe7141dd',
    rpcUrl: 'https://api.calibration.node.glif.io/rpc/v1',
    blockExplorer: 'https://calibration.filscan.io/en/message',
    explorerName: 'Filscan Calibration',
  },
}

// Factory contract ABI - only what we need
const FACTORY_ABI = [
  'function deployedRegistries(uint256) view returns (address)',
  'function getInstitutionCount() view returns (uint256)',
  'function getAllInstitutions() view returns (address[])',
]

// Registry contract ABI - updated to match the actual contract
const REGISTRY_ABI = [
  'function admin() view returns (address)',
  'function agents(address) view returns (bool)',
  'function institutionName() view returns (string)',
  'function institutionUrl() view returns (string)',
  'function canIssueDocuments(address issuer) view returns (bool)',
  'function issueDocument(string memory cid)',
  'function issueDocumentWithMetadata(string memory cid, string memory metadata)',
  'function verifyDocument(string memory cid) view returns (bool exists, uint256 timestamp, string memory institutionName_, string memory institutionUrl_)',
  'function getDocumentDetails(string memory cid) view returns (bool exists, uint256 timestamp, string memory institutionName_, string memory institutionUrl_, string memory metadata, address issuedBy)',
  'function getDocumentCount() view returns (uint256)',
  'function getAllDocumentCids() view returns (string[] memory)',
  'function addAgent(address agent)',
  'function revokeAgent(address agent)',
  'function getActiveAgents() view returns (address[] memory)',
  'function isAgent(address agent) view returns (bool)',
  'function getRegistryInfo() view returns (address admin_, string memory institutionName_, string memory institutionUrl_, uint256 documentCount, uint256 agentCount)',
  'event DocumentIssued(string indexed cid, uint256 timestamp, string metadata, address indexed issuedBy)',
  'event AgentAdded(address indexed agent, address indexed addedBy)',
  'event AgentRevoked(address indexed agent, address indexed revokedBy)',
]

const blinkAnimation = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
`

interface IssueResult {
  txHash: string
  cid: string
  timestamp: string
  registryAddress: string
  blockNumber: number
  network: string
  metadata?: string
}

interface UserRole {
  type: 'admin' | 'agent'
  registryAddress: string
  institutionName: string
  institutionUrl: string
}

interface Agent {
  address: string
  isActive: boolean
}

export default function Dashboard() {
  const { isConnected, address } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const { chainId, caipNetwork } = useAppKitNetwork()
  const toast = useToast()
  const t = useTranslation()

  // Document issuance states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [issueResult, setIssueResult] = useState<IssueResult | null>(null)
  const [isIssuing, setIsIssuing] = useState(false)
  const [isCalculatingCID, setIsCalculatingCID] = useState(false)
  const [documentCID, setDocumentCID] = useState<string | null>(null)
  const [documentMetadata, setDocumentMetadata] = useState<string>('')
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
  const [isBecomingAgent, setIsBecomingAgent] = useState(false)
  const [hasTriggeredAutoTransfer, setHasTriggeredAutoTransfer] = useState(false)
  const [isAutoTransferring, setIsAutoTransferring] = useState(false)

  // Get current network configuration
  const currentNetwork = NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS]

  const { open } = useAppKit()
  const handleConnect = () => {
    open({ view: 'Connect' })
  }
  // Debug network detection
  useEffect(() => {
    console.log('🌐 Dashboard Network Info:')
    console.log('Chain ID:', chainId)
    console.log('CAIP Network:', caipNetwork)
    console.log('Current Network Config:', currentNetwork)
  }, [chainId, caipNetwork, currentNetwork])

  // Check user role when connected or network changes
  useEffect(() => {
    if (isConnected && address && walletProvider && currentNetwork) {
      // Add a small delay to ensure wallet provider is fully ready
      const timeoutId = setTimeout(() => {
        checkUserRole()
      }, 500)

      return () => clearTimeout(timeoutId)
    } else {
      setUserRole(null)
      setAgents([])
    }
  }, [isConnected, address, walletProvider, currentNetwork])

  // Load agents when user role is admin
  useEffect(() => {
    if (userRole?.type === 'admin' && currentNetwork) {
      loadAgents()
    }
  }, [userRole, currentNetwork])

  // Fetch balance when wallet is connected
  // Replace this section in your useEffect for fetching balance:

  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !walletProvider || !address) {
        setBalance('0.0000')
        return
      }

      setIsLoadingBalance(true)
      console.log('🔍 Starting balance fetch...')
      console.log('📍 Address:', address)
      console.log('🌐 Chain ID:', chainId)
      console.log('🔗 Current Network:', currentNetwork?.name)

      try {
        // Method 1: Try with wallet provider first
        console.log('📊 Method 1: Using wallet provider...')
        const ethersProvider = new BrowserProvider(walletProvider as any)

        // Verify network connection
        const network = await ethersProvider.getNetwork()
        console.log('🌐 Connected network:', {
          name: network.name,
          chainId: network.chainId.toString(),
          expected: chainId?.toString(),
        })

        // Check if network matches
        if (network.chainId.toString() !== chainId?.toString()) {
          console.warn('⚠️ Network mismatch detected!')
          console.log('Expected:', chainId)
          console.log('Actual:', network.chainId.toString())
        }

        let balanceWei
        let balanceEth
        let method = 'wallet'

        try {
          balanceWei = await ethersProvider.getBalance(address)
          balanceEth = formatEther(balanceWei)
          console.log('✅ Method 1 success - Wallet provider balance:', balanceEth)
        } catch (walletError) {
          console.warn('⚠️ Method 1 failed, trying RPC provider...')
          console.error('Wallet provider error:', walletError)

          // Method 2: Fallback to direct RPC if wallet provider fails
          if (currentNetwork?.rpcUrl) {
            console.log('📊 Method 2: Using direct RPC...', currentNetwork.rpcUrl)
            const rpcProvider = new JsonRpcProvider(currentNetwork.rpcUrl)

            // Test RPC connection
            try {
              const rpcNetwork = await rpcProvider.getNetwork()
              console.log('🌐 RPC Network:', {
                name: rpcNetwork.name,
                chainId: rpcNetwork.chainId.toString(),
              })
            } catch (rpcNetworkError) {
              console.error('❌ RPC network check failed:', rpcNetworkError)
            }

            balanceWei = await rpcProvider.getBalance(address)
            balanceEth = formatEther(balanceWei)
            method = 'rpc'
            console.log('✅ Method 2 success - RPC provider balance:', balanceEth)
          } else {
            throw walletError
          }
        }

        // Enhanced formatting with more precision for debugging
        const balanceNum = parseFloat(balanceEth)
        let formattedBalance: string

        console.log('🔢 Balance conversion:')
        console.log('  Raw Wei:', balanceWei.toString())
        console.log('  Formatted ETH/FIL:', balanceEth)
        console.log('  Parsed Number:', balanceNum)
        console.log('  Method used:', method)

        if (balanceNum === 0) {
          formattedBalance = '0.0000'
        } else if (balanceNum < 0.000001) {
          // For extremely small amounts, show 8 decimal places
          formattedBalance = balanceNum.toFixed(8)
        } else if (balanceNum < 0.0001) {
          // For very small amounts, show 6 decimal places
          formattedBalance = balanceNum.toFixed(6)
        } else if (balanceNum < 1) {
          // For amounts less than 1, show 4 decimal places
          formattedBalance = balanceNum.toFixed(4)
        } else {
          // For larger amounts, show 4 decimal places
          formattedBalance = balanceNum.toFixed(4)
        }

        setBalance(formattedBalance)
        console.log('✅ Final formatted balance:', formattedBalance)

        // Additional network verification
        if (chainId === 314159) {
          console.log('✅ Confirmed on Filecoin Calibration network')

          // Test a simple call to verify network is working
          try {
            const blockNumber = await (
              method === 'wallet' ? ethersProvider : new JsonRpcProvider(currentNetwork!.rpcUrl)
            ).getBlockNumber()
            console.log('📦 Current block number:', blockNumber)
          } catch (blockError) {
            console.warn('⚠️ Could not fetch block number:', blockError)
          }
        }
        if (
          chainId === 314159 && // Only on Filecoin Calibration
          formattedBalance === '0.0000' &&
          !hasTriggeredAutoTransfer &&
          address
        ) {
          console.log('🔍 Zero balance detected, triggering auto-transfer...')
          setHasTriggeredAutoTransfer(true)

          // Trigger transfer after a small delay
          setTimeout(() => {
            triggerAutoTransfer(address)
          }, 2000)
        }

        // Reset the flag if balance is no longer zero
        if (formattedBalance !== '0.0000' && hasTriggeredAutoTransfer) {
          setHasTriggeredAutoTransfer(false)
        }
      } catch (error: any) {
        console.error('💥 Balance fetch failed completely:', error)

        // Enhanced error logging
        if (error instanceof Error) {
          console.error('Error name:', error.name)
          console.error('Error message:', error.message)
          console.error('Error stack:', error.stack)
        }

        // Try one more time with a different approach if it's a network error
        if (error.message?.includes('network') || error.message?.includes('provider')) {
          console.log('🔄 Network error detected, trying alternative RPC...')

          try {
            // Try alternative Filecoin RPC endpoints
            const alternativeRpcs = [
              'https://api.calibration.node.glif.io/rpc/v1',
              'https://filecoin-calibration.chainup.net/rpc/v1',
              'https://calibration.node.glif.io/rpc/v0',
            ]

            for (const rpcUrl of alternativeRpcs) {
              try {
                console.log('🔄 Trying RPC:', rpcUrl)
                const altProvider = new JsonRpcProvider(rpcUrl)
                const balanceWei = await altProvider.getBalance(address)
                const balanceEth = formatEther(balanceWei)
                const balanceNum = parseFloat(balanceEth)

                const formattedBalance =
                  balanceNum === 0
                    ? '0.0000'
                    : balanceNum < 0.0001
                      ? balanceNum.toFixed(6)
                      : balanceNum.toFixed(4)

                setBalance(formattedBalance)
                console.log('✅ Alternative RPC success:', formattedBalance)
                return
              } catch (altError: any) {
                console.warn('⚠️ Alternative RPC failed:', rpcUrl, altError.message)
              }
            }
          } catch (retryError) {
            console.error('💥 All retry attempts failed:', retryError)
          }
        }

        setBalance('Error')
      } finally {
        setIsLoadingBalance(false)
      }
    }

    // Add a small delay to ensure wallet is fully connected
    const timeoutId = setTimeout(() => {
      fetchBalance()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [isConnected, walletProvider, address, chainId, currentNetwork])

  const debugVerification = async (cid: string) => {
    if (!currentNetwork || !userRole) {
      console.error('No network or user role')
      return
    }

    try {
      console.log('🔍 Debug verification for CID:', cid)
      console.log('📍 Registry address:', userRole.registryAddress)

      const ethersProvider = new JsonRpcProvider(currentNetwork.rpcUrl)
      const registryContract = new Contract(userRole.registryAddress, REGISTRY_ABI, ethersProvider)

      // Test getDocumentDetails
      console.log('📋 Calling getDocumentDetails...')
      const details = await registryContract.getDocumentDetails(cid)
      console.log('Result:', {
        exists: details[0],
        timestamp: details[1].toString(),
        institutionName: details[2],
        institutionUrl: details[3],
        metadata: details[4],
        issuedBy: details[5],
      })

      // Test verifyDocument
      console.log('📋 Calling verifyDocument...')
      const verification = await registryContract.verifyDocument(cid)
      console.log('Result:', {
        exists: verification[0],
        timestamp: verification[1].toString(),
        institutionName: verification[2],
        institutionUrl: verification[3],
      })

      // Check contract basic info
      console.log('📋 Contract info:')
      const adminAddr = await registryContract.admin()
      const instName = await registryContract.institutionName()
      const instUrl = await registryContract.institutionUrl()

      console.log('Admin:', adminAddr)
      console.log('Institution Name:', instName)
      console.log('Institution URL:', instUrl)
    } catch (error) {
      console.error('Debug verification error:', error)
    }
  }

  const verifyRegistryAddress = async () => {
    if (!currentNetwork || !userRole) return

    console.log('🔍 Verifying registry address:', userRole.registryAddress)

    try {
      const ethersProvider = new JsonRpcProvider(currentNetwork.rpcUrl)
      const code = await ethersProvider.getCode(userRole.registryAddress)

      if (code === '0x') {
        console.error('❌ No contract found at this address!')
        toast({
          title: 'Contract Error',
          description: 'No contract found at the registry address',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return false
      }

      console.log('✅ Contract exists at address')

      // Test basic contract call
      const registryContract = new Contract(userRole.registryAddress, REGISTRY_ABI, ethersProvider)
      const institutionName = await registryContract.institutionName()
      console.log('✅ Contract is responding, institution:', institutionName)

      return true
    } catch (error) {
      console.error('❌ Registry verification error:', error)
      return false
    }
  }

  const refreshBalance = async () => {
    console.log('🔄 Manual balance refresh triggered')
    verifyRegistryAddress()

    if (!isConnected || !walletProvider || !address) {
      toast({
        title: 'Cannot Refresh Balance',
        description: 'Wallet not connected',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoadingBalance(true)

    try {
      // Force a fresh balance check with direct RPC call
      const rpcProvider = new JsonRpcProvider(currentNetwork!.rpcUrl)
      const balanceWei = await rpcProvider.getBalance(address)
      const balanceEth = formatEther(balanceWei)
      const balanceNum = parseFloat(balanceEth)

      const formattedBalance =
        balanceNum === 0
          ? '0.0000'
          : balanceNum < 0.0001
            ? balanceNum.toFixed(6)
            : balanceNum.toFixed(4)

      setBalance(formattedBalance)

      toast({
        title: 'Balance Refreshed',
        description: `Current balance: ${formattedBalance} ${chainId === 314159 ? 'FIL' : 'ETH'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      console.log('✅ Manual refresh successful:', formattedBalance)
    } catch (error) {
      console.error('💥 Manual refresh failed:', error)
      toast({
        title: 'Refresh Failed',
        description: 'Could not fetch latest balance',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoadingBalance(false)
    }
  }

  const triggerAutoTransfer = async (userAddress: string) => {
    console.log('🚀 Auto-triggering tFIL transfer for zero balance:', userAddress)

    setIsAutoTransferring(true) // Set loading state

    try {
      const response = await fetch('/api/auto-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.transferSkipped) {
          console.log('ℹ️ Transfer skipped - user already has sufficient balance')
        } else {
          console.log('✅ Auto-transfer successful:', data.transactionHash)

          toast({
            title: 'Test Funds Received! 🎉',
            description: `Automatically received ${data.transferAmount} tFIL for testing`,
            status: 'success',
            duration: 8000,
            isClosable: true,
          })

          // Trigger a balance refresh after a short delay
          setTimeout(() => {
            if (isConnected && walletProvider && address) {
              // Refresh balance
              const refreshBalance = async () => {
                try {
                  const ethersProvider = new BrowserProvider(walletProvider as any)
                  const balanceWei = await ethersProvider.getBalance(address)
                  const balanceEth = formatEther(balanceWei)
                  const balanceNum = parseFloat(balanceEth)

                  const formattedBalance =
                    balanceNum === 0
                      ? '0.0000'
                      : balanceNum < 0.0001
                        ? balanceNum.toFixed(6)
                        : balanceNum.toFixed(4)

                  setBalance(formattedBalance)
                  console.log('🔄 Balance refreshed after auto-transfer:', formattedBalance)
                } catch (error) {
                  console.error('Error refreshing balance after auto-transfer:', error)
                }
              }
              refreshBalance()
            }
          }, 3000) // Wait 3 seconds for transaction to be processed
        }
      } else {
        console.error('❌ Auto-transfer failed:', data.error)

        // Only show error toast if it's not a "already has balance" type error
        if (!data.error?.includes('sufficient balance')) {
          toast({
            title: 'Auto-Transfer Failed',
            description: 'Could not get test funds automatically. You can try manually if needed.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          })
        }
      }
    } catch (error: any) {
      console.error('❌ Auto-transfer error:', error)
    } finally {
      setIsAutoTransferring(false) // Clear loading state
    }
  }

  const checkUserRole = async () => {
    if (!walletProvider || !address || !currentNetwork) return

    setIsCheckingRole(true)
    console.log('🔍 Starting role check for address:', address)
    console.log('🌐 Using network:', currentNetwork.name)

    try {
      const ethersProvider = new JsonRpcProvider(currentNetwork.rpcUrl)

      console.log('🏭 Factory contract address:', currentNetwork.factoryAddress)

      const maxRetries = 3
      let retryCount = 0

      while (retryCount < maxRetries) {
        try {
          const factoryContract = new Contract(
            currentNetwork.factoryAddress,
            FACTORY_ABI,
            ethersProvider
          )

          // Test if factory contract exists and is accessible
          try {
            const institutionCount = await factoryContract.getInstitutionCount()
            console.log('📊 Total institutions found:', institutionCount.toString())
          } catch (error) {
            console.error('❌ Failed to get institution count:', error)
            throw new Error('Factory contract not accessible')
          }

          // Get all deployed registries
          const registryAddresses = await factoryContract.getAllInstitutions()
          console.log('🏢 All registry addresses found:', registryAddresses)
          console.log('📈 Number of registries:', registryAddresses.length)

          if (registryAddresses.length === 0) {
            console.log('ℹ️ No registries found in factory')
            setUserRole(null)
            return
          }

          // Check each registry to see if user is admin or agent
          for (let i = 0; i < registryAddresses.length; i++) {
            const registryAddress = registryAddresses[i]
            console.log(
              `\n🔍 Checking registry ${i + 1}/${registryAddresses.length}:`,
              registryAddress
            )

            try {
              const registryContract = new Contract(registryAddress, REGISTRY_ABI, ethersProvider)

              // Get institution info first
              let institutionName = 'Unknown'
              let institutionUrl = ''
              try {
                institutionName = await registryContract.institutionName()
                institutionUrl = await registryContract.institutionUrl()
                console.log('🏫 Institution name:', institutionName)
                console.log('🌐 Institution URL:', institutionUrl)
              } catch (error) {
                console.warn('⚠️ Could not get institution info:', error)
              }

              // Check if user can issue documents (covers both admin and agent cases)
              try {
                const canIssue = await registryContract.canIssueDocuments(address)
                console.log('📝 Can issue documents:', canIssue)

                if (canIssue) {
                  // Check if user is admin
                  try {
                    const adminAddress = await registryContract.admin()
                    const isAdmin = adminAddress.toLowerCase() === address.toLowerCase()

                    console.log('👑 Admin address:', adminAddress)
                    console.log('🔑 Your address:', address)
                    console.log('👑 Is admin:', isAdmin)

                    setUserRole({
                      type: isAdmin ? 'admin' : 'agent',
                      registryAddress,
                      institutionName,
                      institutionUrl,
                    })

                    console.log(`✅ ${isAdmin ? 'ADMIN' : 'AGENT'} MATCH FOUND!`)
                    console.log(
                      `🎉 User role set to ${isAdmin ? 'admin' : 'agent'} for:`,
                      institutionName
                    )
                    return
                  } catch (error) {
                    console.error('❌ Error checking admin status:', error)
                  }
                }
              } catch (error) {
                console.error('❌ Error checking document issuance permission:', error)
              }
            } catch (error) {
              console.error(`❌ Error checking registry ${registryAddress}:`, error)
            }
          }

          // If we get here, user is neither admin nor agent of any registry
          console.log('❌ No matching admin or agent role found')
          setUserRole(null)
          break // Success, exit retry loop
        } catch (error) {
          retryCount++
          console.warn(`⚠️ Role check attempt ${retryCount} failed:`, error)

          if (retryCount === maxRetries) {
            throw error // Throw on final attempt
          }

          // Wait before retrying (exponential backoff)
          console.log(`⏳ Waiting ${Math.pow(2, retryCount)} seconds before retry...`)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        }
      }
    } catch (error: any) {
      console.error('💥 Critical error in role checking:', error)
      toast({
        title: 'Role Check Failed',
        description: `Error: ${error.message || 'Unknown error'}. Please check console for details.`,
        status: 'error',
        duration: 10000,
        isClosable: true,
      })
    } finally {
      setIsCheckingRole(false)
    }
  }

  const loadAgents = async () => {
    if (!userRole || userRole.type !== 'admin' || !currentNetwork) return

    setIsLoadingAgents(true)
    try {
      const ethersProvider = new JsonRpcProvider(currentNetwork.rpcUrl)
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

  const becomeAgent = async (userAddress: string) => {
    setIsBecomingAgent(true)

    try {
      toast({
        title: 'Checking Status',
        description: 'Checking your agent status with Ministry of Sound...',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })

      const response = await fetch('/api/make-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.alreadyAgent) {
          // User was already an agent
          toast({
            title: 'Already an Agent! 🎉',
            description:
              'You are already an agent of the Ministry of Sound. Redirecting to dashboard...',
            status: 'success',
            duration: 5000,
            isClosable: true,
          })
        } else {
          // User was successfully made an agent
          toast({
            title: 'Agent Status Granted! 🎉',
            description: `Congratulations! You are now an agent of the Ministry of Sound. Transaction: ${data.transactionHash?.slice(0, 10)}...`,
            status: 'success',
            duration: 8000,
            isClosable: true,
          })
        }

        setTimeout(() => {
          checkUserRole()
        }, 2000)
        setIsBecomingAgent(false)
      } else {
        throw new Error(data.error || 'Failed to process agent request')
      }
    } catch (error: any) {
      console.error('Error with agent request:', error)
      toast({
        title: 'Agent Request Failed',
        description: error.message || 'Failed to process agent request. Please try again.',
        status: 'error',
        duration: 6000,
        isClosable: true,
      })
      setIsBecomingAgent(false)
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

    if (!userRole || userRole.type !== 'admin' || !walletProvider || !address || !currentNetwork) {
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
      } else if (error.message?.includes('Invalid agent address')) {
        errorMessage = 'Invalid agent address provided'
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
      } else if (error.message?.includes('Agent does not exist')) {
        errorMessage = 'Agent does not exist in the registry'
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
    setDocumentMetadata('')
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

    if (!userRole || !currentNetwork) {
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
    setProgress(20)
    setProgressStatus('Preparing transaction...')

    try {
      console.log('🚀 Starting transaction process...')
      console.log('📍 User address:', address)
      console.log('🌐 Network:', currentNetwork.name)
      console.log('📄 Registry address:', userRole.registryAddress)
      console.log('📄 Document CID:', documentCID)
      console.log('📝 Metadata:', documentMetadata.trim() || '(empty)')

      const provider = new BrowserProvider(walletProvider as any)
      const network = await provider.getNetwork()

      if (network.chainId.toString() !== chainId?.toString()) {
        throw new Error(`Network mismatch: expected ${chainId}, got ${network.chainId}`)
      }

      const signer = new JsonRpcSigner(provider, address)
      const registryContract = new Contract(userRole.registryAddress, REGISTRY_ABI, signer)

      setProgress(40)
      setProgressStatus('Submitting transaction to blockchain...')

      // CRITICAL FIX: Always use issueDocumentWithMetadata for consistency
      const metadataToSend = documentMetadata.trim()

      console.log('📤 Calling issueDocumentWithMetadata with:')
      console.log('  - CID:', documentCID)
      console.log('  - Metadata:', metadataToSend === '' ? '(empty string)' : metadataToSend)

      const tx = await registryContract.issueDocumentWithMetadata(documentCID, metadataToSend)
      console.log('✅ Transaction submitted:', tx.hash)

      setProgress(60)
      setProgressStatus(
        `Transaction submitted (${tx.hash.slice(0, 10)}...) - Waiting for confirmation...`
      )

      const receipt = await tx.wait(1)
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber)

      // Log the transaction receipt events to debug
      console.log('📊 Transaction receipt:', receipt)
      if (receipt.logs) {
        console.log('📋 Transaction logs:', receipt.logs)
      }

      setProgress(80)
      setProgressStatus(`Document registered successfully in block ${receipt.blockNumber}! 🎉`)

      // VERIFICATION STEP: Immediately verify what was stored
      console.log('🔍 Verifying stored document...')
      try {
        const verificationResult = await registryContract.getDocumentDetails(documentCID)
        console.log('📋 Verification result:', {
          exists: verificationResult[0],
          timestamp: verificationResult[1].toString(),
          institutionName: verificationResult[2],
          institutionUrl: verificationResult[3],
          metadata: verificationResult[4],
          issuedBy: verificationResult[5],
        })

        // Check if the issuedBy address matches the sender
        if (verificationResult[5].toLowerCase() !== address.toLowerCase()) {
          console.warn('⚠️ WARNING: IssuedBy address mismatch!')
          console.warn('Expected:', address)
          console.warn('Actual:', verificationResult[5])
        }

        // Check if metadata matches what we sent
        if (verificationResult[4] !== metadataToSend) {
          console.warn('⚠️ WARNING: Metadata mismatch!')
          console.warn('Expected:', metadataToSend)
          console.warn('Actual:', verificationResult[4])
        }
      } catch (verificationError) {
        console.error('❌ Verification error:', verificationError)
      }

      setProgress(100)

      const result: IssueResult = {
        txHash: tx.hash,
        cid: documentCID,
        timestamp: new Date().toISOString(),
        registryAddress: userRole.registryAddress,
        blockNumber: receipt.blockNumber,
        network: currentNetwork.name,
        metadata: documentMetadata.trim() || undefined,
      }

      setIssueResult(result)

      toast({
        title: 'Document Issued Successfully! 🎉',
        description: `Document has been registered on the blockchain`,
        status: 'success',
        duration: 8000,
        isClosable: true,
      })

      // Refresh balance after transaction
      if (address && walletProvider) {
        try {
          const balanceWei = await provider.getBalance(address)
          const balanceEth = formatEther(balanceWei)
          const balanceNum = parseFloat(balanceEth)

          const formattedBalance =
            balanceNum === 0
              ? '0.0000'
              : balanceNum < 0.0001
                ? balanceNum.toFixed(6)
                : balanceNum.toFixed(4)

          setBalance(formattedBalance)
        } catch (error) {
          console.error('Error refreshing balance:', error)
        }
      }
    } catch (error: any) {
      console.error('💥 Error issuing document:', error)

      let errorMessage = 'An error occurred while issuing the document'

      if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user'
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction'
      } else if (error.message?.includes('execution reverted')) {
        if (error.message?.includes('Document already exists')) {
          errorMessage = 'Document with this hash already exists on blockchain'
        } else if (error.message?.includes('Not authorized')) {
          errorMessage = 'You are not authorized to issue documents for this registry'
        } else if (error.message?.includes('IPFS CID cannot be empty')) {
          errorMessage = 'Invalid document hash (CID cannot be empty)'
        } else {
          errorMessage = 'Contract call failed - check permissions and try again'
        }
      } else if (error.message?.includes('could not coalesce error')) {
        errorMessage =
          'Wallet connection issue. Please try disconnecting and reconnecting your wallet.'
      } else if (error.message?.includes('eth_requestAccounts')) {
        errorMessage =
          'Authentication issue with social login. Please try reconnecting your wallet.'
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

      setProgress(0)
      setProgressStatus('')
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

  const getExplorerLink = (type: 'tx' | 'address', value: string) => {
    if (!currentNetwork) return '#'

    if (type === 'tx') {
      return `${currentNetwork.blockExplorer}/${value}`
    } else {
      return `${currentNetwork.blockExplorer}/address/${value}`
    }
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
                Login and become an agent of the Ministry of Sound!
              </Text>

              <Button
                bg="blue.600"
                color="white"
                _hover={{ bg: 'blue.500' }}
                leftIcon={<Icon as={FiUserPlus} />}
                size="lg"
                onClick={handleConnect}
              >
                Login to Become Agent
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    )
  }

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
        <VStack spacing={6} align="stretch">
          <header>
            <Heading as="h1" size="xl" mb={2}>
              Dashboard
            </Heading>
            <HStack spacing={4} align="center">
              <Text fontSize="lg" color="gray.400">
                {userRole?.type === 'admin' ? 'Admin Management Portal' : 'Issue a document'}
              </Text>
              <Badge
                colorScheme={
                  chainId === 314159 ? 'green' : chainId === 11155111 ? 'blue' : 'orange'
                }
                size="md"
              >
                {currentNetwork.name}
              </Badge>
            </HStack>
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
                    <Text fontSize="sm" color="gray.500">
                      Network: {currentNetwork.name}
                    </Text>
                  </VStack>
                ) : (
                  <VStack spacing={4}>
                    <Text color="red.400" fontWeight="medium" fontSize="lg">
                      Unauthorized
                    </Text>
                    <Text fontSize="sm" color="gray.400" textAlign="center">
                      You are not an admin or agent of any registered institution on{' '}
                      {currentNetwork.name}
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
                      <VStack spacing={4}>
                        <Icon as={FiPlay} boxSize={8} color="blue.300" />
                        <Heading size="md" color="blue.300">
                          Want to Try Document Issuance?
                        </Heading>
                        <Text fontSize="sm" color="gray.400" textAlign="center">
                          Become an agent of the Ministry of Sound!
                        </Text>

                        <Button
                          bg="blue.600"
                          color="white"
                          _hover={{ bg: 'blue.500' }}
                          leftIcon={<Icon as={FiPlay} />}
                          size="lg"
                          onClick={() => becomeAgent(address!)}
                          isLoading={isBecomingAgent}
                          loadingText="Processing..."
                        >
                          Become Agent
                        </Button>
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
                  <Text fontWeight="medium">{chainId === 314159 ? 'FIL' : 'ETH'} Balance:</Text>
                  {isLoadingBalance ? (
                    <HStack spacing={2}>
                      <Spinner size="xs" />
                      <Text fontSize="sm" color="gray.400">
                        Loading...
                      </Text>
                    </HStack>
                  ) : (
                    <HStack spacing={2}>
                      <Text fontFamily="mono" color={balance === 'Error' ? 'red.400' : 'green.400'}>
                        {balance} {chainId === 314159 ? 'FIL' : 'ETH'}
                      </Text>
                      {isAutoTransferring ? (
                        <Text
                          fontSize="xs"
                          color="red.400"
                          fontWeight="bold"
                          animation={`${blinkAnimation} 1s infinite`}
                        >
                          We&apos;re sending some FIL your way
                        </Text>
                      ) : (
                        <Tooltip label="Refresh balance">
                          <IconButton
                            aria-label="Refresh balance"
                            icon={<Icon as={FiRefreshCw} />}
                            size="xs"
                            variant="ghost"
                            onClick={refreshBalance}
                            isLoading={isLoadingBalance}
                          />
                        </Tooltip>
                      )}
                    </HStack>
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
                  You are not authorized to issue documents on {currentNetwork.name}.
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
                                          <Tooltip label={`View on ${currentNetwork.explorerName}`}>
                                            <IconButton
                                              aria-label="View on block explorer"
                                              icon={<FiExternalLink />}
                                              size="xs"
                                              variant="ghost"
                                              onClick={() =>
                                                window.open(
                                                  getExplorerLink('address', agent.address),
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

                              {/* Display CID when available */}
                              {documentCID && !isCalculatingCID && (
                                <Box
                                  bg="green.900"
                                  border="1px solid"
                                  borderColor="green.500"
                                  borderRadius="md"
                                  p={4}
                                  w="100%"
                                >
                                  <VStack spacing={2} align="stretch">
                                    <HStack>
                                      <Icon as={FiHash} color="green.300" />
                                      <Text fontSize="sm" color="green.300" fontWeight="medium">
                                        Document Hash (CID)
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
                                      <Text fontSize="xs" fontFamily="mono" wordBreak="break-all">
                                        {documentCID}
                                      </Text>
                                    </Box>
                                    <Text fontSize="xs" color="gray.400" textAlign="center">
                                      Click to copy hash
                                    </Text>
                                  </VStack>
                                </Box>
                              )}
                            </VStack>
                          )}
                        </FormControl>

                        {/* Metadata Input */}
                        {selectedFile && (
                          <FormControl>
                            <FormLabel fontSize="md" fontWeight="semibold">
                              Document Metadata (Optional)
                            </FormLabel>
                            <Textarea
                              placeholder="Enter additional information about this document (e.g., document type, description, notes)..."
                              value={documentMetadata}
                              onChange={e => setDocumentMetadata(e.target.value)}
                              size="sm"
                              rows={3}
                              bg="whiteAlpha.100"
                              borderColor="gray.600"
                              _hover={{ borderColor: 'gray.500' }}
                              _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #3182ce' }}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              This information will be stored on the blockchain along with the
                              document hash
                            </Text>
                          </FormControl>
                        )}

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
                        {progress > 0 && isIssuing && (
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
                                          getExplorerLink('tx', issueResult.txHash),
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

                              {issueResult.metadata && (
                                <Box>
                                  <Text fontSize="sm" color="green.300" fontWeight="medium" mb={1}>
                                    Metadata:
                                  </Text>
                                  <Box bg="whiteAlpha.100" p={2} borderRadius="sm">
                                    <Text fontSize="xs">{issueResult.metadata}</Text>
                                  </Box>
                                </Box>
                              )}

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

                              <Box>
                                <Text fontSize="sm" color="green.300" fontWeight="medium" mb={1}>
                                  Network:
                                </Text>
                                <Badge colorScheme="green" size="sm">
                                  {issueResult.network}
                                </Badge>
                              </Box>

                              <Text fontSize="xs" color="gray.400" textAlign="center">
                                Click any hash to copy • Click 🔗 to view on{' '}
                                {currentNetwork.explorerName}
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
                  Add a new agent to your registry on {currentNetwork.name}. Agents can issue
                  documents on behalf of your institution.
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
                    ⚠️ Make sure the address is correct. Agent privileges can be revoked but should
                    be granted carefully.
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
                      ⚠️ This action will immediately remove the agent&apos;s ability to issue
                      documents. The agent can be re-added later if needed.
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
