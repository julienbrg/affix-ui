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
import { FiUpload, FiFile, FiX, FiHash, FiExternalLink, FiCheck } from 'react-icons/fi'
import { getDocumentCID } from '../lib/documentHash'
import { BrowserProvider, Contract, formatEther, parseEther, JsonRpcSigner } from 'ethers'

// Contract configuration - Direct registry address
const VERIDOCS_REGISTRY_ADDRESS = '0x02b77E551a1779f3f091a1523A08e61cd2620f82'

// Registry contract ABI - only what we need
const VERIDOCS_REGISTRY_ABI = [
  'function issueDocumentOpenBar(string memory cid) external',
  'function verifyDocument(string memory cid) external view returns (bool exists, uint256 timestamp, string memory institutionName)',
  'function getDocumentDetails(string memory cid) external view returns (bool exists, uint256 timestamp, string memory institutionName, string memory metadata, address issuedBy)',
  'function institutionName() external view returns (string memory)',
  'function getDocumentCount() external view returns (uint256)',
]

interface IssueResult {
  txHash: string
  cid: string
  timestamp: string
  registryAddress: string
  blockNumber: number
}

export default function DashboardPage() {
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [issueResult, setIssueResult] = useState<IssueResult | null>(null)
  const [isIssuing, setIsIssuing] = useState(false)
  const [isCalculatingCID, setIsCalculatingCID] = useState(false)
  const [documentCID, setDocumentCID] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [balance, setBalance] = useState<string>('0.0000')
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const t = useTranslation()
  const [progressStatus, setProgressStatus] = useState('')

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

    setIsIssuing(true)

    try {
      console.log('Starting transaction process...')
      console.log('Address:', address)
      console.log('WalletProvider available:', !!walletProvider)

      // Create ethers provider - different approach for social login
      const provider = new BrowserProvider(walletProvider as any)
      console.log('Provider created successfully')

      // Get network first to avoid potential issues
      const network = await provider.getNetwork()
      console.log('Connected to network:', network.name, 'Chain ID:', network.chainId.toString())

      // Check if we're on Sepolia (optional - commented out for testing on other networks)
      if (network.chainId !== BigInt(11155111)) {
        console.warn('Not on Sepolia testnet. Current chain:', network.chainId.toString())
        // Uncomment the next line if you want to enforce Sepolia only
        // throw new Error('Please switch to Sepolia testnet')
      }

      // For social login (Universal Wallets), use JsonRpcSigner directly as per Reown docs
      console.log('Creating JsonRpcSigner directly (Reown social login pattern)...')
      const signer = new JsonRpcSigner(provider, address)
      console.log('JsonRpcSigner created successfully with address:', address)

      // Create registry contract instance with read-only provider first
      console.log('Creating contract instance...')

      // Try creating a read-only contract first to avoid auth issues
      const readOnlyContract = new Contract(
        VERIDOCS_REGISTRY_ADDRESS,
        VERIDOCS_REGISTRY_ABI,
        provider // Use provider instead of signer for read-only calls
      )

      console.log('Read-only contract created, now creating signer contract...')

      // Now create the contract with signer for the actual transaction
      const registryContract = new Contract(
        VERIDOCS_REGISTRY_ADDRESS,
        VERIDOCS_REGISTRY_ABI,
        signer
      )
      console.log('Contract instance created successfully')

      // Skip optional calls completely to avoid any auth issues with social login
      console.log('Skipping all optional contract calls to avoid auth issues...')

      // Call issueDocumentOpenBar function directly without any preliminary checks
      console.log('Issuing document with CID:', documentCID)
      console.log('Registry contract address:', VERIDOCS_REGISTRY_ADDRESS)

      // Try a more direct approach - send transaction directly without gas estimation
      console.log('Attempting direct contract call...')

      // Use a simple transaction object approach
      const tx = await signer.sendTransaction({
        to: VERIDOCS_REGISTRY_ADDRESS,
        data: registryContract.interface.encodeFunctionData('issueDocumentOpenBar', [documentCID]),
        // Let the wallet/provider handle gas estimation
      })

      console.log('Transaction submitted via sendTransaction:', tx.hash)

      console.log('Transaction submitted:', tx.hash)

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
        registryAddress: VERIDOCS_REGISTRY_ADDRESS,
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

          <section aria-label="Account Information">
            {isConnected ? (
              <Box bg="whiteAlpha.100" p={4} borderRadius="md">
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
                  {/* <Text color="green.400" mt={2}>
                    ✓ Wallet Connected
                  </Text> */}
                </VStack>
              </Box>
            ) : (
              <Box bg="whiteAlpha.100" p={4} borderRadius="md">
                <Text color="orange.400">Please connect your wallet to issue documents</Text>
              </Box>
            )}
          </section>

          <section aria-label="Document Upload">
            <Box bg="whiteAlpha.100" p={6} borderRadius="md">
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
                  isDisabled={!isConnected || !selectedFile || !documentCID || isCalculatingCID}
                  isLoading={isIssuing}
                  loadingText="Issuing Document..."
                  size="lg"
                  leftIcon={<Icon as={FiUpload} />}
                >
                  Issue Document on Blockchain
                </Button>

                {!isConnected && (
                  <Text fontSize="sm" color="orange.400" textAlign="center">
                    Please connect your wallet to issue documents
                  </Text>
                )}

                {(!selectedFile || !documentCID) && isConnected && (
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
        </VStack>
      </Container>
    </main>
  )
}
