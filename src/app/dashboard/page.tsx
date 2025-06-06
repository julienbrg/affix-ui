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
import { FiUpload, FiFile, FiX, FiHash } from 'react-icons/fi'
import { getDocumentCID } from '../lib/documentHash'

interface IssueResult {
  txHash: string
  documentId: string
  cid: string
  timestamp: string
}

export default function DashboardPage() {
  const { address, isConnected } = useAppKitAccount()
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

    setIsIssuing(true)

    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Mock transaction result with real CID
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
      const mockDocumentId = Math.random().toString(16).substr(2, 8)

      const result: IssueResult = {
        txHash: mockTxHash,
        documentId: mockDocumentId,
        cid: documentCID,
        timestamp: new Date().toISOString(),
      }

      setIssueResult(result)

      toast({
        title: 'Document Issued',
        description: 'Your document has been registered on the blockchain',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Issue Failed',
        description: 'An error occurred while issuing the document',
        status: 'error',
        duration: 5000,
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
              Issue a document with IPFS hash verification
            </Text>
          </header>

          <section aria-label="Account Information">
            {isConnected ? (
              <Box bg="whiteAlpha.100" p={4} borderRadius="md">
                <Text>Your Address: {address}</Text>
                <Text color="green.400" mt={2}>
                  ✓ Wallet Connected
                </Text>
              </Box>
            ) : (
              <Box bg="whiteAlpha.100" p={4} borderRadius="md">
                <Text color="orange.400">Please login</Text>
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

                      {/* CID Display */}
                      {documentCID && !isCalculatingCID && (
                        <Box
                          bg="green.900"
                          border="1px solid"
                          borderColor="green.500"
                          borderRadius="md"
                          p={4}
                          w="100%"
                        >
                          <HStack spacing={3} mb={2}>
                            <Icon as={FiHash} color="green.300" />
                            <Text fontSize="sm" color="green.300" fontWeight="medium">
                              IPFS Hash (CID)
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
                              color="green.300"
                              fontFamily="mono"
                              wordBreak="break-all"
                            >
                              {documentCID}
                            </Text>
                          </Box>
                          <Text fontSize="xs" color="gray.400" mt={1}>
                            Click to copy
                          </Text>
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
                  Issue Document
                </Button>

                {!isConnected && (
                  <Text fontSize="sm" color="orange.400" textAlign="center">
                    Please login to issue documents
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
                      <Text fontSize="md" color="green.300" fontWeight="bold">
                        Document Issued Successfully! 🎉
                      </Text>

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
                          <Text fontSize="xs" fontFamily="mono" wordBreak="break-all">
                            {issueResult.txHash}
                          </Text>
                        </Box>
                      </Box>

                      <Box>
                        <Text fontSize="sm" color="green.300" fontWeight="medium" mb={1}>
                          Document ID:
                        </Text>
                        <Box
                          bg="whiteAlpha.100"
                          p={2}
                          borderRadius="sm"
                          cursor="pointer"
                          onClick={() => copyToClipboard(issueResult.documentId)}
                          _hover={{ bg: 'whiteAlpha.200' }}
                        >
                          <Text fontSize="xs" fontFamily="mono">
                            {issueResult.documentId}
                          </Text>
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
