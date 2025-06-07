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
} from '@chakra-ui/react'
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { useState, useRef } from 'react'
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
} from 'react-icons/fi'
import { BrowserProvider, Contract } from 'ethers'
import { getDocumentCID } from '../lib/documentHash'

// Contract configuration - Your registry address
const VERIDOCS_REGISTRY_ADDRESS = '0x02b77E551a1779f3f091a1523A08e61cd2620f82'

// Registry contract ABI - read functions
const VERIDOCS_REGISTRY_ABI = [
  'function verifyDocument(string memory cid) external view returns (bool exists, uint256 timestamp, string memory institutionName)',
  'function getDocumentDetails(string memory cid) external view returns (bool exists, uint256 timestamp, string memory institutionName, string memory metadata, address issuedBy)',
  'function institutionName() external view returns (string memory)',
  'function getDocumentCount() external view returns (uint256)',
  'function admin() external view returns (address)',
]

interface DocumentDetails {
  exists: boolean
  timestamp: bigint
  institutionName: string
  metadata: string
  issuedBy: string
}

interface VerificationResult {
  exists: boolean
  timestamp: bigint
  institutionName: string
}

export default function VerifyPage() {
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const [cidInput, setCidInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isCalculatingCID, setIsCalculatingCID] = useState(false)
  const [documentCID, setDocumentCID] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [documentDetails, setDocumentDetails] = useState<DocumentDetails | null>(null)
  const [registryInfo, setRegistryInfo] = useState<{
    institutionName: string
    documentCount: bigint
    admin: string
  } | null>(null)
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
      setVerificationResult(null)
      setDocumentDetails(null)
      setDocumentCID(null)

      // Calculate CID immediately when file is selected
      await calculateCID(file)
    }
  }

  const calculateCID = async (file: File) => {
    console.log('🔄 Starting CID calculation...')
    console.log('📄 File:', file.name, '| Size:', file.size, 'bytes')

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

      console.log('🔢 Computing IPFS hash using getDocumentCID...')
      const cid = await getDocumentCID(file)

      clearInterval(progressInterval)
      setProgress(100)
      setDocumentCID(cid)
      setCidInput(cid) // Auto-fill the CID input

      console.log('✅ CID calculation successful!')
      console.log('🆔 Generated CID:', cid)
      console.log('📝 Auto-filled verification input field')

      toast({
        title: 'CID Generated',
        description: 'Document hash calculated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('❌ Error calculating CID:', error)
      console.log('🔍 CID calculation failed for file:', file.name)
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
    setVerificationResult(null)
    setDocumentDetails(null)
    setDocumentCID(null)
    setCidInput('')
    setProgress(0)
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

  const loadRegistryInfo = async () => {
    if (!walletProvider) {
      console.log('❌ Wallet not connected for registry info loading')
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to load registry information',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    console.log('🔄 Loading registry information...')
    console.log('📍 Registry Address:', VERIDOCS_REGISTRY_ADDRESS)

    try {
      const ethersProvider = new BrowserProvider(walletProvider as any)
      const registryContract = new Contract(
        VERIDOCS_REGISTRY_ADDRESS,
        VERIDOCS_REGISTRY_ABI,
        ethersProvider
      )

      console.log('📞 Calling registry contract functions...')

      // Get registry information
      const [institutionName, documentCount, admin] = await Promise.all([
        registryContract.institutionName().catch(e => {
          console.log('⚠️ Failed to get institution name:', e.message)
          return 'Unknown Institution'
        }),
        registryContract.getDocumentCount().catch(e => {
          console.log('⚠️ Failed to get document count:', e.message)
          return BigInt(0)
        }),
        registryContract.admin().catch(e => {
          console.log('⚠️ Failed to get admin address:', e.message)
          return 'Unknown Admin'
        }),
      ])

      setRegistryInfo({
        institutionName,
        documentCount,
        admin,
      })

      console.log('✅ Registry Info loaded successfully:')
      console.log('🏛️ Institution:', institutionName)
      console.log('📄 Document Count:', documentCount.toString())
      console.log('👤 Admin:', admin)
    } catch (error) {
      console.error('❌ Error loading registry info:', error)
      toast({
        title: 'Failed to load registry info',
        description: 'Could not connect to the registry contract',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleVerifyDocument = async () => {
    if (!cidInput.trim()) {
      console.log('❌ No CID provided for verification')
      toast({
        title: 'No CID provided',
        description: 'Please enter a document CID/hash to verify',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (!walletProvider) {
      console.log('❌ Wallet not connected for verification')
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to verify documents',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    console.log('🔍 Starting document verification...')
    console.log('📄 CID to verify:', cidInput)
    console.log('📍 Registry Address:', VERIDOCS_REGISTRY_ADDRESS)

    setIsVerifying(true)
    setVerificationResult(null)
    setDocumentDetails(null)

    try {
      const ethersProvider = new BrowserProvider(walletProvider as any)
      const network = await ethersProvider.getNetwork()
      console.log('🌐 Connected to network:', network.name, 'Chain ID:', network.chainId.toString())

      const registryContract = new Contract(
        VERIDOCS_REGISTRY_ADDRESS,
        VERIDOCS_REGISTRY_ABI,
        ethersProvider
      )

      console.log('📞 Calling verifyDocument function...')
      console.log('🔧 Function signature: verifyDocument(string)')

      // Call verifyDocument function
      const [exists, timestamp, institutionName] = await registryContract.verifyDocument(cidInput)

      const result: VerificationResult = {
        exists,
        timestamp,
        institutionName,
      }

      console.log('✅ Verification result received:')
      console.log('📋 Exists:', exists)
      console.log('⏰ Timestamp:', timestamp.toString())
      console.log('🏛️ Institution:', institutionName)
      console.log(
        '📅 Formatted Date:',
        exists ? new Date(Number(timestamp) * 1000).toLocaleString() : 'N/A'
      )

      setVerificationResult(result)

      if (exists) {
        console.log('🎉 Document verification SUCCESS!')
        toast({
          title: 'Document Verified! ✅',
          description: `Document found in ${institutionName} registry`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      } else {
        console.log('⚠️ Document NOT FOUND in registry')
        toast({
          title: 'Document Not Found',
          description: 'This document hash was not found in the registry',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error: any) {
      console.error('❌ Error verifying document:', error)
      console.log('🔍 Error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
        data: error.data,
      })

      let errorMessage = 'An error occurred while verifying the document'

      if (error.message?.includes('execution reverted')) {
        errorMessage = 'Contract call failed - check if contract address is correct'
        console.log('💡 Hint: Contract may not be deployed or function may not exist')
      } else if (error.code === 'CALL_EXCEPTION') {
        errorMessage = 'Contract call failed - verify contract address and network'
        console.log('💡 Hint: Check contract address and network connection')
      } else if (error.message) {
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

  const loadDocumentDetails = async () => {
    if (!cidInput.trim() || !walletProvider) {
      console.log('❌ Cannot load details - missing CID or wallet')
      return
    }

    console.log('📋 Loading detailed document information...')
    console.log('📄 CID:', cidInput)

    setIsLoadingDetails(true)

    try {
      const ethersProvider = new BrowserProvider(walletProvider as any)
      const registryContract = new Contract(
        VERIDOCS_REGISTRY_ADDRESS,
        VERIDOCS_REGISTRY_ABI,
        ethersProvider
      )

      console.log('📞 Calling getDocumentDetails function...')
      console.log('🔧 Function signature: getDocumentDetails(string)')

      // Call getDocumentDetails function
      const [exists, timestamp, institutionName, metadata, issuedBy] =
        await registryContract.getDocumentDetails(cidInput)

      const details: DocumentDetails = {
        exists,
        timestamp,
        institutionName,
        metadata,
        issuedBy,
      }

      console.log('✅ Document details received:')
      console.log('📋 Exists:', exists)
      console.log('⏰ Timestamp:', timestamp.toString())
      console.log('🏛️ Institution:', institutionName)
      console.log('📝 Metadata:', metadata)
      console.log('👤 Issued By:', issuedBy)
      console.log(
        '📅 Formatted Date:',
        exists ? new Date(Number(timestamp) * 1000).toLocaleString() : 'N/A'
      )

      setDocumentDetails(details)

      if (exists) {
        console.log('🎉 Document details loaded successfully!')
      } else {
        console.log('⚠️ Document details indicate document does not exist')
      }
    } catch (error: any) {
      console.error('❌ Error loading document details:', error)
      console.log('🔍 Error details:', {
        message: error.message,
        code: error.code,
        reason: error.reason,
      })
      toast({
        title: 'Failed to load details',
        description: 'Could not retrieve detailed document information',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoadingDetails(false)
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

  return (
    <main>
      <Container maxW="container.md" py={20}>
        <VStack spacing={8} align="stretch">
          <header>
            <Heading as="h1" size="xl" mb={2}>
              Verify
            </Heading>
            <Text fontSize="lg" color="gray.400">
              Verify document authenticity right here right now.
            </Text>
          </header>

          {/* Registry Information */}
          {/* <section aria-label="Registry Information">
            <Box bg="whiteAlpha.100" p={6} borderRadius="md">
              <VStack spacing={4} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading size="md">Registry Information</Heading>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadRegistryInfo}
                    isDisabled={!isConnected}
                  >
                    Load Info
                  </Button>
                </Flex>

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
                    Click the 🔗 to verify this contract exists on Etherscan
                  </Text>
                </Box>

                {registryInfo && (
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium">
                        Institution:
                      </Text>
                      <Badge colorScheme="blue">{registryInfo.institutionName}</Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium">
                        Total Documents:
                      </Text>
                      <Badge colorScheme="green">{registryInfo.documentCount.toString()}</Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="medium">
                        Admin:
                      </Text>
                      <Text
                        fontSize="xs"
                        fontFamily="mono"
                        cursor="pointer"
                        onClick={() => copyToClipboard(registryInfo.admin)}
                        _hover={{ color: 'blue.300' }}
                      >
                        {registryInfo.admin.slice(0, 10)}...{registryInfo.admin.slice(-8)}
                      </Text>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            </Box>
          </section> */}

          {/* Document Upload & CID Generation */}
          <section aria-label="Document Upload">
            <Box bg="whiteAlpha.100" p={6} borderRadius="md">
              <VStack spacing={6} align="stretch">
                <Heading size="md">Upload Document to Verify</Heading>

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
                        {progress > 0 && <Progress value={progress} size="sm" colorScheme="blue" />}
                      </Box>
                    )}

                    {/* CID Display */}
                    {documentCID && !isCalculatingCID && (
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
                            Generated Document CID
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
                          Click to copy • This CID has been auto-filled below for verification
                        </Text>
                      </Box>
                    )}
                  </VStack>
                )}
              </VStack>
            </Box>
          </section>

          <Divider />

          {/* Document Verification */}
          <section aria-label="Document Verification">
            <Box bg="whiteAlpha.100" p={6} borderRadius="md">
              <VStack spacing={6} align="stretch">
                <Heading size="md">Verify Document</Heading>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold" mb={3}>
                    Document CID/Hash
                  </FormLabel>
                  <Input
                    value={cidInput}
                    onChange={e => setCidInput(e.target.value)}
                    placeholder="Enter IPFS CID, upload a document above, or paste hash here"
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
                    Enter the IPFS hash manually or upload a document above to auto-generate
                  </Text>
                </FormControl>

                <HStack spacing={4}>
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
                    isDisabled={!isConnected || !cidInput.trim() || isCalculatingCID}
                    isLoading={isVerifying}
                    loadingText="Verifying..."
                    size="lg"
                    leftIcon={<Icon as={FiSearch} />}
                    flex={1}
                  >
                    Verify Document
                  </Button>

                  <Button
                    onClick={loadDocumentDetails}
                    variant="outline"
                    borderColor="gray.600"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    isDisabled={!isConnected || !cidInput.trim() || isCalculatingCID}
                    isLoading={isLoadingDetails}
                    loadingText="Loading..."
                    size="lg"
                    leftIcon={<Icon as={FiFile} />}
                  >
                    Get Details
                  </Button>
                </HStack>

                {!isConnected && (
                  <Text fontSize="sm" color="orange.400" textAlign="center">
                    Please connect your wallet to verify documents
                  </Text>
                )}

                {(!cidInput.trim() || isCalculatingCID) && isConnected && (
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    {!cidInput.trim()
                      ? 'Upload a document or enter a CID to verify'
                      : 'Calculating document hash...'}
                  </Text>
                )}
              </VStack>
            </Box>
          </section>

          {/* Verification Results */}
          {verificationResult && (
            <section aria-label="Verification Results">
              <Box
                bg={verificationResult.exists ? 'green.900' : 'orange.900'}
                border="1px solid"
                borderColor={verificationResult.exists ? 'green.500' : 'orange.500'}
                borderRadius="md"
                p={6}
              >
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Icon
                      as={verificationResult.exists ? FiCheck : FiX}
                      color={verificationResult.exists ? 'green.300' : 'orange.300'}
                      boxSize={6}
                    />
                    <Heading
                      size="md"
                      color={verificationResult.exists ? 'green.300' : 'orange.300'}
                    >
                      {verificationResult.exists ? 'Document Verified ✅' : 'Document Not Found ❌'}
                    </Heading>
                  </HStack>

                  {verificationResult.exists && (
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="medium" color="green.300">
                          Institution:
                        </Text>
                        <Badge colorScheme="green">{verificationResult.institutionName}</Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="medium" color="green.300">
                          Issued At:
                        </Text>
                        <Text fontSize="sm" color="green.200">
                          {formatTimestamp(verificationResult.timestamp)}
                        </Text>
                      </HStack>
                    </VStack>
                  )}

                  {!verificationResult.exists && (
                    <Text fontSize="sm" color="orange.200">
                      This document hash was not found in the{' '}
                      {registryInfo?.institutionName || 'registry'} database.
                    </Text>
                  )}
                </VStack>
              </Box>
            </section>
          )}

          {/* Document Details */}
          {documentDetails && documentDetails.exists && (
            <section aria-label="Document Details">
              <Box bg="blue.900" border="1px solid" borderColor="blue.500" borderRadius="md" p={6}>
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color="blue.300">
                    Document Details
                  </Heading>

                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <HStack>
                        <Icon as={FiUser} color="blue.300" />
                        <Text fontSize="sm" fontWeight="medium" color="blue.300">
                          Issued By:
                        </Text>
                      </HStack>
                      <Text
                        fontSize="xs"
                        fontFamily="mono"
                        color="blue.200"
                        cursor="pointer"
                        onClick={() => copyToClipboard(documentDetails.issuedBy)}
                        _hover={{ color: 'blue.100' }}
                      >
                        {documentDetails.issuedBy}
                      </Text>
                    </HStack>

                    <HStack justify="space-between">
                      <HStack>
                        <Icon as={FiCalendar} color="blue.300" />
                        <Text fontSize="sm" fontWeight="medium" color="blue.300">
                          Timestamp:
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color="blue.200">
                        {formatTimestamp(documentDetails.timestamp)}
                      </Text>
                    </HStack>

                    <HStack justify="space-between">
                      <HStack>
                        <Icon as={FiHash} color="blue.300" />
                        <Text fontSize="sm" fontWeight="medium" color="blue.300">
                          Institution:
                        </Text>
                      </HStack>
                      <Badge colorScheme="blue">{documentDetails.institutionName}</Badge>
                    </HStack>

                    {documentDetails.metadata && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" color="blue.300" mb={2}>
                          Metadata:
                        </Text>
                        <Textarea
                          value={documentDetails.metadata}
                          isReadOnly
                          bg="whiteAlpha.100"
                          color="blue.200"
                          fontSize="xs"
                          fontFamily="mono"
                          minH="80px"
                        />
                      </Box>
                    )}
                  </VStack>

                  <Text fontSize="xs" color="gray.400" textAlign="center">
                    Click addresses to copy • All data is retrieved from the blockchain
                  </Text>
                </VStack>
              </Box>
            </section>
          )}
        </VStack>
      </Container>
    </main>
  )
}
