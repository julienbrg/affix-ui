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
} from '@chakra-ui/react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useState, useRef } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { FiUpload, FiFile, FiX, FiHash, FiShield } from 'react-icons/fi'
import { getDocumentCID } from '../lib/documentHash'

interface VerificationResult {
  isVerified: boolean
  documentId?: string
  cid: string
  onChainCid?: string
  timestamp: string
  status: 'verified' | 'not_found' | 'mismatch'
}

export default function VerifyPage() {
  const { address, isConnected } = useAppKitAccount()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
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
      setVerificationResult(null)
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
    setVerificationResult(null)
    setDocumentCID(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleVerify = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a document to verify',
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

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      // Simulate blockchain verification process
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Mock verification scenarios
      const scenarios = [
        {
          isVerified: true,
          status: 'verified' as const,
          documentId: Math.random().toString(16).substr(2, 8),
          onChainCid: documentCID,
        },
        {
          isVerified: false,
          status: 'not_found' as const,
        },
        {
          isVerified: false,
          status: 'mismatch' as const,
          documentId: Math.random().toString(16).substr(2, 8),
          onChainCid: `bafybeig${Math.random().toString(16).substr(2, 50)}`,
        },
      ]

      // Randomly select a scenario (weighted towards verified for demo)
      const random = Math.random()
      const selectedScenario =
        random < 0.6 ? scenarios[0] : random < 0.8 ? scenarios[1] : scenarios[2]

      const result: VerificationResult = {
        ...selectedScenario,
        cid: documentCID,
        timestamp: new Date().toISOString(),
      }

      setVerificationResult(result)

      const statusMessages = {
        verified: {
          title: 'Document Verified ✅',
          description: 'This document is authentic and registered on the blockchain',
          status: 'success' as const,
        },
        not_found: {
          title: 'Document Not Found ❌',
          description: 'This document is not registered on the blockchain',
          status: 'error' as const,
        },
        mismatch: {
          title: 'Document Modified ⚠️',
          description: 'This document has been modified since registration',
          status: 'warning' as const,
        },
      }

      const message = statusMessages[result.status]
      toast({
        title: message.title,
        description: message.description,
        status: message.status,
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: 'An error occurred while verifying the document',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsVerifying(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'green'
      case 'not_found':
        return 'red'
      case 'mismatch':
        return 'orange'
      default:
        return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return FiShield
      case 'not_found':
        return FiX
      case 'mismatch':
        return FiX
      default:
        return FiFile
    }
  }

  return (
    <main>
      <Container maxW="container.sm" py={20}>
        <VStack spacing={6} align="stretch">
          <header>
            <Heading as="h1" size="xl" mb={2}>
              Verify
            </Heading>
            <Text fontSize="lg" color="gray.400">
              Check the authenticity of a document.
            </Text>
          </header>

          <section aria-label="Document Upload">
            <Box bg="whiteAlpha.100" p={6} borderRadius="md">
              <VStack spacing={6} align="stretch">
                <FormControl>
                  <FormLabel fontSize="md" fontWeight="semibold" mb={3}>
                    Upload Document to Verify
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
                            Click to copy • This hash will be checked against the blockchain
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  )}
                </FormControl>

                <Button
                  onClick={handleVerify}
                  bg="#45a2f8"
                  color="white"
                  _hover={{ bg: '#3182ce' }}
                  _disabled={{
                    bg: 'gray.600',
                    color: 'gray.400',
                    cursor: 'not-allowed',
                  }}
                  isDisabled={!selectedFile || !documentCID || isCalculatingCID}
                  isLoading={isVerifying}
                  loadingText="Verifying..."
                  size="lg"
                  leftIcon={<Icon as={FiShield} />}
                >
                  Verify Document
                </Button>

                {(!selectedFile || !documentCID) && (
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    {!selectedFile
                      ? 'Please select a document to verify'
                      : 'Calculating document hash...'}
                  </Text>
                )}

                {verificationResult && (
                  <Box
                    bg={`${getStatusColor(verificationResult.status)}.900`}
                    border="1px solid"
                    borderColor={`${getStatusColor(verificationResult.status)}.500`}
                    borderRadius="md"
                    p={4}
                    mt={4}
                  >
                    <VStack spacing={3} align="stretch">
                      <HStack spacing={3}>
                        <Icon
                          as={getStatusIcon(verificationResult.status)}
                          color={`${getStatusColor(verificationResult.status)}.300`}
                          boxSize={5}
                        />
                        <Text
                          fontSize="md"
                          color={`${getStatusColor(verificationResult.status)}.300`}
                          fontWeight="bold"
                        >
                          {verificationResult.status === 'verified' && 'Document Verified ✅'}
                          {verificationResult.status === 'not_found' && 'Document Not Found ❌'}
                          {verificationResult.status === 'mismatch' && 'Document Modified ⚠️'}
                        </Text>
                      </HStack>

                      <Box>
                        <Text
                          fontSize="sm"
                          color={`${getStatusColor(verificationResult.status)}.300`}
                          fontWeight="medium"
                          mb={1}
                        >
                          Document IPFS Hash:
                        </Text>
                        <Box
                          bg="whiteAlpha.100"
                          p={2}
                          borderRadius="sm"
                          cursor="pointer"
                          onClick={() => copyToClipboard(verificationResult.cid)}
                          _hover={{ bg: 'whiteAlpha.200' }}
                        >
                          <Text fontSize="xs" fontFamily="mono" wordBreak="break-all">
                            {verificationResult.cid}
                          </Text>
                        </Box>
                      </Box>

                      {verificationResult.documentId && (
                        <Box>
                          <Text
                            fontSize="sm"
                            color={`${getStatusColor(verificationResult.status)}.300`}
                            fontWeight="medium"
                            mb={1}
                          >
                            Document ID:
                          </Text>
                          <Box
                            bg="whiteAlpha.100"
                            p={2}
                            borderRadius="sm"
                            cursor="pointer"
                            onClick={() => copyToClipboard(verificationResult.documentId!)}
                            _hover={{ bg: 'whiteAlpha.200' }}
                          >
                            <Text fontSize="xs" fontFamily="mono">
                              {verificationResult.documentId}
                            </Text>
                          </Box>
                        </Box>
                      )}

                      {verificationResult.onChainCid &&
                        verificationResult.status === 'mismatch' && (
                          <Box>
                            <Text fontSize="sm" color="orange.300" fontWeight="medium" mb={1}>
                              Original Blockchain Hash:
                            </Text>
                            <Box
                              bg="whiteAlpha.100"
                              p={2}
                              borderRadius="sm"
                              cursor="pointer"
                              onClick={() => copyToClipboard(verificationResult.onChainCid!)}
                              _hover={{ bg: 'whiteAlpha.200' }}
                            >
                              <Text fontSize="xs" fontFamily="mono" wordBreak="break-all">
                                {verificationResult.onChainCid}
                              </Text>
                            </Box>
                            <Text fontSize="xs" color="orange.400" mt={1}>
                              The document hash doesn&apos;t match the blockchain record
                            </Text>
                          </Box>
                        )}

                      <Text fontSize="xs" color="gray.400" textAlign="center">
                        Click any hash to copy to clipboard
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
