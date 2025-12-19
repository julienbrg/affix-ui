'use client'

import {
  Text,
  VStack,
  Box,
  Heading,
  Container,
  Flex,
  SimpleGrid,
  HStack,
  Link as ChakraLink,
} from '@chakra-ui/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toaster } from '@/components/ui/toaster'
import { useState, useRef } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import {
  FiUpload,
  FiFile,
  FiX,
  FiHash,
  FiShield,
  FiCheck,
  FiSearch,
  FiExternalLink,
  FiCalendar,
  FiUser,
  FiAlertCircle,
} from 'react-icons/fi'
import { getDocumentCID } from '@/lib/documentHash'
import { ethers } from 'ethers'
import { NETWORK_CONFIGS, AFFIX_REGISTRY_ABI, type VerificationResult } from '@/lib/contracts'

const DEFAULT_NETWORK = 10 // OP Mainnet

export default function VerifyPage() {
  const t = useTranslation()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [cidInput, setCidInput] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [documentCID, setDocumentCID] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [progressStatus, setProgressStatus] = useState('')
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([])
  const [urlVerificationResult, setUrlVerificationResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // For simplicity, use default network (Filecoin Calibration)
  const currentNetwork = NETWORK_CONFIGS[DEFAULT_NETWORK]

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toaster.create({
          title: t.verify.toast.fileTooLarge,
          description: t.verify.toast.fileTooLargeDesc,
          type: 'error',
          duration: 5000,
        })
        return
      }

      setSelectedFile(file)
      setVerificationResults([])
      setDocumentCID(null)
      setCidInput('')
      setUrlVerificationResult(null)
    }
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setVerificationResults([])
    setDocumentCID(null)
    setCidInput('')
    setProgress(0)
    setProgressStatus('')
    setUrlVerificationResult(null)
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

  const verifyDocumentInRegistry = async (registryAddress: string, cid: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(currentNetwork.rpcUrl)
      const registryContract = new ethers.Contract(registryAddress, AFFIX_REGISTRY_ABI, provider)

      const [exists, timestamp, entityName, entityUrl] = await registryContract.verifyDocument(cid)

      if (exists) {
        // Get additional details
        const [, , , , metadata, issuedBy] = await registryContract.getDocumentDetails(cid)

        return {
          registryAddress,
          entityName,
          exists,
          timestamp,
          metadata,
          issuedBy,
          entityUrl,
        }
      }

      return null
    } catch (error) {
      console.error(`Error verifying in registry ${registryAddress}:`, error)
      return null
    }
  }

  const handleVerifyDocument = async () => {
    if (!selectedFile && !cidInput.trim()) {
      toaster.create({
        title: t.verify.upload.noDocument,
        description: t.verify.upload.noDocumentDesc,
        type: 'warning',
        duration: 5000,
      })
      return
    }

    setIsVerifying(true)
    setVerificationResults([])
    setProgress(0)
    setProgressStatus('')
    setUrlVerificationResult(null)

    try {
      let finalCID = cidInput.trim()

      // If we have a file, calculate its CID first
      if (selectedFile) {
        setProgress(10)
        setProgressStatus(t.verify.progress.computing)

        finalCID = await getDocumentCID(selectedFile)
        setDocumentCID(finalCID)
        setCidInput(finalCID)
      }

      setProgress(30)
      setProgressStatus(t.verify.progress.checking)

      // Verify against the main registry
      const registryAddress =
        (currentNetwork as any).registryAddress || currentNetwork.factoryAddress
      const result = await verifyDocumentInRegistry(registryAddress, finalCID)

      if (result) {
        setVerificationResults([result])
        setProgress(70)
        setProgressStatus(t.verify.progress.aiVerifying)

        // Try AI verification
        try {
          console.log('🔍 Attempting AI verification for address:', registryAddress)
          const response = await fetch(`/api/verify-url?address=${registryAddress}`)
          console.log('📡 AI verification response status:', response.status, response.statusText)

          if (response.ok) {
            const data = await response.json()
            console.log('📄 AI verification response data:', data)
            setUrlVerificationResult(data)
          } else {
            const errorData = await response.text()
            console.error('❌ AI verification failed with status:', response.status, errorData)
          }
        } catch (error) {
          console.error('❌ AI verification error:', error)
        }

        setProgress(100)
        setProgressStatus(t.verify.progress.complete)

        toaster.create({
          title: t.verify.toast.verified,
          description: `${t.verify.toast.foundIn} ${result.entityName}`,
          type: 'success',
          duration: 7000,
        })
      } else {
        setProgress(100)
        setProgressStatus(t.verify.progress.complete)

        toaster.create({
          title: t.verify.toast.notFound,
          description: t.verify.toast.notFoundDesc,
          type: 'info',
          duration: 7000,
        })
      }
    } catch (error: any) {
      console.error('Error during verification:', error)
      toaster.create({
        title: t.verify.toast.failed,
        description: error.message || 'An error occurred during verification',
        type: 'error',
        duration: 7000,
      })
      setProgress(0)
      setProgressStatus('')
    } finally {
      setIsVerifying(false)
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

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleString()
  }

  return (
    <main>
      <Container maxW="container.lg" py={20}>
        <VStack gap={8} align="stretch">
          <header>
            <Heading as="h1" size="xl" mb={2}>
              {t.verify.title}
            </Heading>
            <Text fontSize="lg" color="gray.400">
              {t.verify.subtitle}
            </Text>
          </header>

          {/* Document Upload Section */}
          <section aria-label="Document Upload">
            <Box borderRadius="md">
              <VStack gap={6} align="stretch">
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
                    <VStack gap={3}>
                      <FiUpload size={32} color="gray" />
                      <Box>
                        <Text fontSize="md" fontWeight="medium" mb={1}>
                          {t.verify.upload.dropHere}{' '}
                          <Text as="span" color="#45a2f8" textDecoration="underline">
                            {t.common.browse}
                          </Text>
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {t.verify.upload.supportsAny}
                        </Text>
                      </Box>
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
                  <VStack gap={4}>
                    <Box
                      bg="whiteAlpha.200"
                      borderRadius="lg"
                      p={4}
                      border="1px solid"
                      borderColor="gray.600"
                      w="100%"
                    >
                      <Flex justify="space-between" align="center">
                        <HStack gap={3}>
                          <FiFile size={20} color="#45a2f8" />
                          <Box>
                            <Text fontSize="md" fontWeight="medium" lineClamp={1}>
                              {selectedFile.name}
                            </Text>
                            <Text fontSize="sm" color="gray.400">
                              {formatFileSize(selectedFile.size)}
                            </Text>
                          </Box>
                        </HStack>
                        <Button size="sm" variant="ghost" onClick={handleFileRemove}>
                          <FiX /> {t.common.remove}
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
                        <HStack gap={3} mb={2}>
                          <FiHash color="blue" />
                          <Text fontSize="sm" color="blue.300" fontWeight="medium">
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
                        <Text fontSize="xs" color="gray.400" mt={1}>
                          {t.verify.upload.clickToCopy}
                        </Text>
                      </Box>
                    )}
                  </VStack>
                )}

                {/* Alternative CID Input */}
                {/* <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={3}>
                    Or enter document CID/hash directly
                  </Text>
                  <Input
                    value={cidInput}
                    onChange={e => setCidInput(e.target.value)}
                    placeholder="Enter IPFS CID or hash here"
                    size="lg"
                  />
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    {selectedFile
                      ? 'CID will be calculated from uploaded file during verification'
                      : 'Enter the IPFS hash manually or upload a document above'}
                  </Text>
                </Box> */}

                {/* Progress Status Bar */}
                {progress > 0 && (
                  <Box
                    bg="whiteAlpha.200"
                    borderRadius="md"
                    p={4}
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                  >
                    <VStack gap={3}>
                      <Text fontSize="sm" fontWeight="medium" color="blue.300">
                        {progressStatus}
                      </Text>
                      {/* Custom Progress Bar */}
                      <Box w="100%" h="8px" bg="gray.700" borderRadius="full" overflow="hidden">
                        <Box
                          h="100%"
                          w={`${progress}%`}
                          bg="#45a2f8"
                          borderRadius="full"
                          transition="width 0.3s ease-in-out"
                        />
                      </Box>
                      <Text fontSize="xs" color="gray.400">
                        {progress}%
                      </Text>
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
                  disabled={!selectedFile && !cidInput.trim()}
                  loading={isVerifying}
                  size="lg"
                  w="100%"
                >
                  <FiShield /> {t.home.hero.verifyButton} Document
                </Button>

                {!selectedFile && !cidInput.trim() && (
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    {t.verify.subtitle}
                  </Text>
                )}
              </VStack>
            </Box>
          </section>

          {/* Verification Results */}
          {verificationResults.length > 0 && (
            <section aria-label="Verification Results">
              <VStack gap={4} align="stretch">
                <Heading size="md">{t.verify.results.title}</Heading>
                {verificationResults.map((result, index) => (
                  <Box
                    key={index}
                    bg={result.exists ? 'green.900' : 'red.900'}
                    border="1px solid"
                    borderColor={result.exists ? 'green.500' : 'red.500'}
                    borderRadius="lg"
                    p={6}
                  >
                    <VStack gap={4} align="stretch">
                      <Flex justify="space-between" align="center">
                        <HStack gap={3}>
                          {result.exists ? (
                            <FiCheck size={24} color="green" />
                          ) : (
                            <FiAlertCircle size={24} color="red" />
                          )}
                          <Box>
                            <Heading size="sm" color={result.exists ? 'green.300' : 'red.300'}>
                              {result.exists
                                ? t.verify.results.verified
                                : t.verify.results.notFound}
                            </Heading>
                            <Text fontSize="sm" color="gray.400">
                              {result.entityName}
                            </Text>
                          </Box>
                        </HStack>
                        <Badge colorPalette={result.exists ? 'green' : 'red'} size="lg">
                          {result.exists
                            ? t.verify.results.verifiedBadge
                            : t.verify.results.unverifiedBadge}
                        </Badge>
                      </Flex>

                      {result.exists && (
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                          <Box>
                            <HStack gap={2} mb={1}>
                              <FiCalendar size={14} />
                              <Text fontSize="xs" color="gray.400" fontWeight="medium">
                                {t.verify.results.issuedOn}
                              </Text>
                            </HStack>
                            <Text fontSize="sm" color="white">
                              {formatDate(result.timestamp)}
                            </Text>
                          </Box>

                          {result.issuedBy && (
                            <Box>
                              <HStack gap={2} mb={1}>
                                <FiUser size={14} />
                                <Text fontSize="xs" color="gray.400" fontWeight="medium">
                                  {t.verify.results.issuedBy}
                                </Text>
                              </HStack>
                              <Text fontSize="xs" color="white" fontFamily="mono">
                                {result.issuedBy}
                              </Text>
                            </Box>
                          )}

                          {result.entityUrl && (
                            <Box>
                              <HStack gap={2} mb={1}>
                                <FiExternalLink size={14} />
                                <Text fontSize="xs" color="gray.400" fontWeight="medium">
                                  {t.verify.results.entityUrl}
                                </Text>
                              </HStack>
                              <ChakraLink
                                href={result.entityUrl}
                                target="_blank"
                                fontSize="sm"
                                color="blue.300"
                                _hover={{ textDecoration: 'underline' }}
                              >
                                {result.entityUrl}
                              </ChakraLink>
                            </Box>
                          )}

                          {result.metadata && (
                            <Box>
                              <HStack gap={2} mb={1}>
                                <FiFile size={14} />
                                <Text fontSize="xs" color="gray.400" fontWeight="medium">
                                  {t.verify.results.metadata}
                                </Text>
                              </HStack>
                              <Text fontSize="sm" color="white">
                                {result.metadata}
                              </Text>
                            </Box>
                          )}
                        </SimpleGrid>
                      )}

                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={1}>
                          {t.verify.results.registryAddress}
                        </Text>
                        <Flex align="center" gap={2}>
                          <Text fontSize="xs" fontFamily="mono" color="gray.400" flex={1}>
                            {result.registryAddress}
                          </Text>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => copyToClipboard(result.registryAddress)}
                          >
                            {t.common.copy}
                          </Button>
                          <ChakraLink
                            href={`${currentNetwork.blockExplorer}/address/${result.registryAddress}`}
                            target="_blank"
                          >
                            <Button size="xs" variant="ghost">
                              <FiExternalLink /> {t.common.view}
                            </Button>
                          </ChakraLink>
                        </Flex>
                      </Box>

                      {urlVerificationResult && (
                        <Box
                          bg="whiteAlpha.100"
                          p={3}
                          borderRadius="md"
                          border="1px solid"
                          borderColor="whiteAlpha.300"
                        >
                          <HStack gap={2} mb={2}>
                            <FiShield size={14} color="cyan" />
                            <Text fontSize="xs" fontWeight="medium" color="cyan.300">
                              {t.verify.results.aiVerification}
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color="gray.300">
                            {urlVerificationResult.verified
                              ? `✓ ${t.verify.results.registryVerified}`
                              : `✗ ${t.verify.results.registryNotVerified}`}
                          </Text>
                          {/* Debug info */}
                          <Box mt={2} p={2} bg="blackAlpha.300" borderRadius="sm">
                            <Text fontSize="xs" color="yellow.300" fontFamily="mono">
                              Debug: verified={String(urlVerificationResult.verified)}
                            </Text>
                            <Text fontSize="xs" color="yellow.300" fontFamily="mono">
                              registryUrl: {urlVerificationResult.registryUrl}
                            </Text>
                            <Text fontSize="xs" color="yellow.300" fontFamily="mono">
                              message: {urlVerificationResult.message}
                            </Text>
                          </Box>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </section>
          )}

          {/* Help Section */}
          {/* <section aria-label="Help Information">
            <Box
              bg="whiteAlpha.50"
              p={6}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.700"
            >
              <VStack gap={4} align="stretch">
                <Heading size="sm" color="gray.300">
                  How Document Verification Works
                </Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                  <VStack align="stretch" gap={3}>
                    <Text fontSize="sm" fontWeight="medium" color="blue.300">
                      1. Upload or Enter CID
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      Upload your document file or enter an IPFS CID directly. We'll compute the
                      unique hash for verification.
                    </Text>

                    <Text fontSize="sm" fontWeight="medium" color="blue.300">
                      2. Blockchain Check
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      We check your document against registered entities on the{' '}
                      {currentNetwork.name} blockchain.
                    </Text>
                  </VStack>

                  <VStack align="stretch" gap={3}>
                    <Text fontSize="sm" fontWeight="medium" color="blue.300">
                      3. Instant Results
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      Get immediate verification results showing which institutions or individuals
                      have issued this document and when.
                    </Text>

                    <Text fontSize="sm" fontWeight="medium" color="blue.300">
                      4. AI-Enhanced Security
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      Optional AI verification checks if registry addresses match URLs registered
                      onchain for enhanced security.
                    </Text>
                  </VStack>
                </SimpleGrid>

                <HStack justify="center" gap={6} pt={4}>
                  <HStack>
                    <FiShield color="green" />
                    <Text fontSize="xs" color="gray.400">
                      Secure & Private
                    </Text>
                  </HStack>
                  <HStack>
                    <FiCheck color="purple" />
                    <Text fontSize="xs" color="gray.400">
                      Instant Results
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
            </Box>
          </section> */}
        </VStack>
      </Container>
    </main>
  )
}
