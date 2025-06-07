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
import { useState, useRef } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { FiUpload, FiFile, FiX, FiHash, FiExternalLink, FiCheck } from 'react-icons/fi'
import { getDocumentCID } from '../lib/documentHash'
import { BrowserProvider, Contract } from 'ethers'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const t = useTranslation()

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

    if (!isConnected || !walletProvider) {
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
      // Create ethers provider and signer
      const ethersProvider = new BrowserProvider(walletProvider as any)
      const signer = await ethersProvider.getSigner()

      // Get the network
      const network = await ethersProvider.getNetwork()
      console.log('Connected to network:', network.name, 'Chain ID:', network.chainId.toString())

      // Check if we're on Sepolia (optional - commented out for testing on other networks)
      if (network.chainId !== BigInt(11155111)) {
        console.warn('Not on Sepolia testnet. Current chain:', network.chainId.toString())
        // Uncomment the next line if you want to enforce Sepolia only
        // throw new Error('Please switch to Sepolia testnet')
      }

      // Create registry contract instance
      const registryContract = new Contract(
        VERIDOCS_REGISTRY_ADDRESS,
        VERIDOCS_REGISTRY_ABI,
        signer
      )

      // Optional: Get institution name for display (commented out to avoid extra calls)
      try {
        const institutionName = await registryContract.institutionName()
        console.log('Institution name:', institutionName)
      } catch (error) {
        console.log('Could not get institution name:', error)
      }

      // Optional: Check if document already exists (commented out to avoid reverts)
      try {
        const [exists] = await registryContract.verifyDocument(documentCID)
        if (exists) {
          throw new Error('Document with this CID already exists on the blockchain')
        }
      } catch (error) {
        console.log('Could not verify existing document (this is OK for first-time setup):', error)
      }

      // Call issueDocumentOpenBar function
      console.log('Issuing document with CID:', documentCID)
      console.log('Registry contract address:', VERIDOCS_REGISTRY_ADDRESS)

      // Estimate gas first (optional but helpful for debugging)
      try {
        const gasEstimate = await registryContract.issueDocumentOpenBar.estimateGas(documentCID)
        console.log('Gas estimate:', gasEstimate.toString())
      } catch (gasError) {
        console.log('Gas estimation failed:', gasError)
        // Continue anyway - sometimes gas estimation fails but transaction works
      }

      const tx = await registryContract.issueDocumentOpenBar(documentCID)

      console.log('Transaction submitted:', tx.hash)
      toast({
        title: 'Transaction Submitted',
        description: `Transaction hash: ${tx.hash}`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      })

      // Wait for transaction confirmation
      const receipt = await tx.wait()
      console.log('Transaction confirmed in block:', receipt.blockNumber)

      // Create result object
      const result: IssueResult = {
        txHash: tx.hash,
        cid: documentCID,
        timestamp: new Date().toISOString(),
        registryAddress: VERIDOCS_REGISTRY_ADDRESS,
        blockNumber: receipt.blockNumber,
      }

      setIssueResult(result)

      toast({
        title: 'Document Issued Successfully! 🎉',
        description: `Document registered on blockchain in block ${receipt.blockNumber}`,
        status: 'success',
        duration: 7000,
        isClosable: true,
      })
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

          {/* <section aria-label="Account Information">
            {isConnected ? (
              <Box bg="whiteAlpha.100" p={4} borderRadius="md">
                <Text>Your Address: {address}</Text>
                <Text color="green.400" mt={2}>
                  ✓ Wallet Connected
                </Text>
              </Box>
            ) : (
              <Box bg="whiteAlpha.100" p={4} borderRadius="md">
                <Text color="orange.400">Please connect your wallet to issue documents</Text>
              </Box>
            )}
          </section> */}

          {/* <section aria-label="Configuration">
            <Box bg="whiteAlpha.100" p={4} borderRadius="md">
              <VStack spacing={3} align="stretch">
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    Registry Contract Address:
                  </Text>
                  <Box
                    bg="whiteAlpha.200"
                    p={2}
                    borderRadius="sm"
                    cursor="pointer"
                    onClick={() => copyToClipboard(VERIDOCS_REGISTRY_ADDRESS)}
                    _hover={{ bg: 'whiteAlpha.300' }}
                  >
                    <Flex align="center" justify="space-between">
                      <Text fontSize="xs" fontFamily="mono" wordBreak="break-all">
                        {VERIDOCS_REGISTRY_ADDRESS}
                      </Text>
                      <Icon
                        as={FiExternalLink}
                        color="gray.400"
                        boxSize={3}
                        ml={2}
                        cursor="pointer"
                        onClick={e => {
                          e.stopPropagation()
                          window.open(
                            `https://sepolia.etherscan.io/address/${VERIDOCS_REGISTRY_ADDRESS}`,
                            '_blank'
                          )
                        }}
                      />
                    </Flex>
                  </Box>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    This is the direct registry contract we will call the issueDocumentOpenBar
                    function on
                  </Text>
                </Box>
              </VStack>
            </Box>
          </section> */}

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

                      {/* CID Display */}
                      {/* {documentCID && !isCalculatingCID && (
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
                              Document IPFS Hash (CID)
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
                            Click to copy • This hash will be registered on the blockchain
                          </Text>
                        </Box>
                      )} */}
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
