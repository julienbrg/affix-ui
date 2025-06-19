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
} from '@chakra-ui/react'
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { FiUpload, FiFile, FiX, FiHash, FiExternalLink, FiCheck, FiPlay } from 'react-icons/fi'
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

// Registry contract ABI - only what we need for role checking
const REGISTRY_ABI = [
  'function admin() view returns (address)',
  'function agents(address) view returns (bool)',
  'function institutionName() view returns (string)',
  'function issueDocumentOpenBar(string memory cid)',
  'function verifyDocument(string memory cid) external view returns (bool exists, uint256 timestamp, string memory institutionName)',
  'function getDocumentDetails(string memory cid) external view returns (bool exists, uint256 timestamp, string memory institutionName, string memory metadata, address issuedBy)',
  'function getDocumentCount() external view returns (uint256)',
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

export default function Dashboard() {
  const { isConnected, address } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const toast = useToast()
  const t = useTranslation()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [issueResult, setIssueResult] = useState<IssueResult | null>(null)
  const [isIssuing, setIsIssuing] = useState(false)
  const [isCalculatingCID, setIsCalculatingCID] = useState(false)
  const [documentCID, setDocumentCID] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [balance, setBalance] = useState<string>('0.0000')
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isCheckingRole, setIsCheckingRole] = useState(false)
  const [progressStatus, setProgressStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check user role when connected
  useEffect(() => {
    if (isConnected && address && walletProvider) {
      checkUserRole()
    } else {
      setUserRole(null)
    }
  }, [isConnected, address, walletProvider])

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
      const factoryContract = new Contract(VERIDOCS_FACTORY_ADDRESS, FACTORY_ABI, ethersProvider)

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
    } catch (error) {
      console.error('Error checking user role:', error)
      toast({
        title: 'Error',
        description: 'Failed to check user permissions',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsCheckingRole(false)
    }
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
      console.log('Address:', address)
      console.log('WalletProvider available:', !!walletProvider)

      // Create ethers provider
      const provider = new BrowserProvider(walletProvider as any)
      console.log('Provider created successfully')

      // Get network first to avoid potential issues
      const network = await provider.getNetwork()
      console.log('Connected to network:', network.name, 'Chain ID:', network.chainId.toString())

      // Create signer
      console.log('Creating JsonRpcSigner directly (Reown social login pattern)...')
      const signer = new JsonRpcSigner(provider, address)
      console.log('JsonRpcSigner created successfully with address:', address)

      if (!userRole.registryAddress) {
        throw new Error('No registry address found')
      }

      // Create registry contract instance
      console.log('Creating contract instance...')
      const registryContract = new Contract(userRole.registryAddress, REGISTRY_ABI, signer)
      console.log('Contract instance created successfully')

      // Call issueDocumentOpenBar function
      console.log('Issuing document with CID:', documentCID)
      console.log('Registry contract address:', userRole.registryAddress)

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to clipboard',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
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
      <Container maxW="container.sm" py={20}>
        <VStack spacing={6} align="stretch">
          <header>
            <Heading as="h1" size="xl" mb={2}>
              Dashboard
            </Heading>
            <Text fontSize="lg" color="gray.400">
              Issue a document
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
                  <Text>Nobody (sorry!)</Text>
                )}
              </VStack>
            </Box>
          </section>

          <section aria-label="Account Information">
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
            <section aria-label="Document Upload">
              <Box>
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
                    isDisabled={!selectedFile || !documentCID || isCalculatingCID || !userRole}
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
              </Box>
            </section>
          )}
        </VStack>
      </Container>
    </main>
  )
}
