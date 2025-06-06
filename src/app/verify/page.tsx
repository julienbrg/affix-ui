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
} from '@chakra-ui/react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useState, useRef } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { FiUpload, FiFile, FiX } from 'react-icons/fi'

export default function VerifyPage() {
  const { address, isConnected } = useAppKitAccount()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [verificationResult, setVerificationResult] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const t = useTranslation()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    }
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setVerificationResult(null)
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

    setIsVerifying(true)
    setVerificationResult(null)

    try {
      // Simulate file processing and hash generation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock verification result
      const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`
      setVerificationResult(`Document processed. Hash: ${mockHash}`)

      toast({
        title: 'Verification Complete',
        description: 'Document has been processed successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: 'An error occurred while processing the document',
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

  return (
    <main>
      <Container maxW="container.sm" py={20}>
        <VStack spacing={6} align="stretch">
          <header>
            <Heading as="h1" size="xl" mb={2}>
              Verify
            </Heading>
            <Text fontSize="lg" color="gray.400">
              Check the authenticity of a document
            </Text>
          </header>

          <section aria-label="Document Upload">
            <Box bg="whiteAlpha.100" p={6} borderRadius="md">
              <VStack spacing={6} align="stretch">
                <FormControl>
                  <FormLabel fontSize="md" fontWeight="semibold" mb={3}>
                    Upload Document
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
                    <Box
                      bg="whiteAlpha.200"
                      borderRadius="lg"
                      p={4}
                      border="1px solid"
                      borderColor="gray.600"
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
                  isDisabled={!selectedFile}
                  isLoading={isVerifying}
                  loadingText="Verifying..."
                  size="lg"
                  leftIcon={<Icon as={FiUpload} />}
                >
                  Verify
                </Button>

                {verificationResult && (
                  <Box
                    bg="green.900"
                    border="1px solid"
                    borderColor="green.500"
                    borderRadius="md"
                    p={4}
                    mt={4}
                  >
                    <Text fontSize="sm" color="green.300" fontFamily="mono">
                      {verificationResult}
                    </Text>
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
