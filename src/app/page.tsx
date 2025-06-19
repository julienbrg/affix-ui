'use client'

import {
  Container,
  Text,
  useToast,
  Button,
  Tooltip,
  Box,
  VStack,
  HStack,
  Heading,
  SimpleGrid,
  Icon,
  Flex,
  Badge,
  Divider,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider, parseEther, formatEther } from 'ethers'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import {
  FiShield,
  FiCheck,
  FiUsers,
  FiLock,
  FiUpload,
  FiSearch,
  FiMail,
  FiArrowRight,
  FiEye,
  FiDatabase,
  FiUserCheck,
} from 'react-icons/fi'

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(1deg); }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [txLink, setTxLink] = useState<string>()
  const [txHash, setTxHash] = useState<string>()
  const [balance, setBalance] = useState<string>('0')

  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const toast = useToast()
  const t = useTranslation()

  useEffect(() => {
    const checkBalance = async () => {
      if (address && walletProvider) {
        try {
          const provider = new BrowserProvider(walletProvider as any)
          const balance = await provider.getBalance(address)
          setBalance(formatEther(balance))
        } catch (error) {
          console.error('Error fetching balance:', error)
        }
      }
    }

    checkBalance()
  }, [address, walletProvider])

  const handleSend = async () => {
    setTxHash('')
    setTxLink('')
    if (!address || !walletProvider) {
      toast({
        title: t.common.error,
        description: t.home.notConnected,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    try {
      const provider = new BrowserProvider(walletProvider as any)
      const signer = await provider.getSigner()

      const tx = await signer.sendTransaction({
        to: address,
        value: parseEther('0.0001'),
      })

      const receipt = await tx.wait(1)

      setTxHash(receipt?.hash)
      setTxLink('https://sepolia.etherscan.io/tx/' + receipt?.hash)

      toast({
        title: t.common.success,
        description: `${t.home.transactionSuccess}: 0.0001 ETH to ${address}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Transaction failed:', error)
      toast({
        title: t.home.transactionFailed,
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const hasEnoughBalance = Number(balance) >= 0.0001

  return (
    <Container maxW="container.xl" py={10}>
      {/* Hero Section */}
      <Box textAlign="center" py={20} position="relative">
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="400px"
          h="400px"
          bg="radial-gradient(circle, rgba(69, 162, 248, 0.1) 0%, transparent 70%)"
          borderRadius="full"
          animation={`${pulse} 4s ease-in-out infinite`}
          zIndex={-1}
        />

        <VStack spacing={6} animation={`${slideIn} 0.8s ease-out`}>
          {/* <Badge
            bg="whiteAlpha.200"
            color="#45a2f8"
            px={4}
            py={2}
            borderRadius="full"
            fontSize="sm"
            fontWeight="semibold"
            border="1px solid"
            borderColor="#45a2f8"
          >
            🔗 Powered by JUJU
          </Badge> */}

          <Heading
            as="h1"
            size="3xl"
            bgGradient="linear(to-r, white, #45a2f8)"
            bgClip="text"
            lineHeight="1.2"
            maxW="800px"
          >
            Verify Document Authenticity with{' '}
            <Text as="span" color="#45a2f8">
              Unbreakable
            </Text>{' '}
            Proof
          </Heading>

          <Text fontSize="xl" color="gray.300" maxW="600px" lineHeight="1.6">
            Publish digital footprints onchain. Anyone can verify. Your documents stay private.
            Zero-knowledge, maximum trust.
          </Text>

          <Flex
            direction={{ base: 'column', md: 'row' }}
            // spacing={4}
            gap={4}
            pt={4}
            justify="center"
            align="center"
          >
            <Link href="/dashboard">
              <Button
                size="lg"
                bg="#45a2f8"
                color="white"
                _hover={{
                  bg: '#3182ce',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(69, 162, 248, 0.3)',
                }}
                rightIcon={<Icon as={FiArrowRight} />}
                transition="all 0.3s ease"
                px={8}
                w={{ base: '250px', md: 'auto' }}
              >
                Your Dashboard
              </Button>
            </Link>

            <Link href="/verify">
              <Button
                size="lg"
                variant="outline"
                borderColor="#45a2f8"
                color="#45a2f8"
                _hover={{
                  bg: 'whiteAlpha.100',
                  transform: 'translateY(-2px)',
                }}
                rightIcon={<Icon as={FiSearch} />}
                transition="all 0.3s ease"
                px={8}
                w={{ base: '250px', md: 'auto' }}
              >
                Verify a Document
              </Button>
            </Link>
          </Flex>
        </VStack>
      </Box>

      {/* Features Grid */}
      <Box py={20}>
        <VStack spacing={12}>
          <Heading
            as="h2"
            size="xl"
            textAlign="center"
            bgGradient="linear(to-r, white, gray.300)"
            bgClip="text"
          >
            Why Choose Veridocs?
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="full">
            <FeatureCard
              icon={FiCheck}
              title="Easy to Verify"
              description="One-click verification for anyone, anywhere. No technical knowledge required."
              color="green.400"
              delay="0s"
            />

            <FeatureCard
              icon={FiShield}
              title="Unbreakable Security"
              description="Blockchain-powered proof that cannot be tampered with or forged."
              color="#45a2f8"
              delay="0.2s"
            />

            <FeatureCard
              icon={FiLock}
              title="Privacy First"
              description="We don't store your documents. Only cryptographic fingerprints go onchain."
              color="purple.400"
              delay="0.4s"
            />
          </SimpleGrid>
        </VStack>
      </Box>

      {/* How It Works */}
      <Box py={20} bg="whiteAlpha.50" borderRadius="3xl" px={8}>
        <VStack spacing={12}>
          <Heading
            as="h2"
            size="xl"
            textAlign="center"
            bgGradient="linear(to-r, white, gray.300)"
            bgClip="text"
          >
            How It Works
          </Heading>

          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} w="full" maxW="1000px">
            <StepCard
              step={1}
              icon={FiUpload}
              title="Publish Digital Footprint"
              description="Upload your document and we create a unique cryptographic fingerprint that goes onchain"
              animation={`${float} 3s ease-in-out infinite`}
            />

            <StepCard
              step={2}
              icon={FiEye}
              title="Anyone Can Verify"
              description="Share the document with anyone - they can instantly verify its authenticity"
              animation={`${float} 3s ease-in-out infinite 0.5s`}
            />

            <StepCard
              step={3}
              icon={FiUserCheck}
              title="Guaranteed Authenticity"
              description="Prove a statement was made by you with immutable blockchain evidence"
              animation={`${float} 3s ease-in-out infinite 1s`}
            />
          </SimpleGrid>
        </VStack>
      </Box>

      {/* Trust Indicators */}
      <Box py={20}>
        <VStack spacing={8}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full" maxW="800px">
            <TrustCard
              icon={FiDatabase}
              title="We Don't Store Your Documents"
              description="Your files never leave your device. Only mathematical proofs are recorded onchain."
              iconColor="red.400"
            />

            <TrustCard
              icon={FiUserCheck}
              title="Guarantee Authorship"
              description="Cryptographically prove a statement was made by you at a specific time."
              iconColor="green.400"
            />
          </SimpleGrid>
        </VStack>
      </Box>

      {/* Call to Action */}
      <Box
        textAlign="center"
        py={20}
        bg="linear-gradient(135deg, rgba(69, 162, 248, 0.1) 0%, rgba(140, 28, 132, 0.1) 100%)"
        borderRadius="3xl"
        border="1px solid"
        borderColor="whiteAlpha.200"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="-50%"
          right="-20%"
          w="300px"
          h="300px"
          bg="radial-gradient(circle, rgba(69, 162, 248, 0.1) 0%, transparent 70%)"
          borderRadius="full"
          animation={`${pulse} 6s ease-in-out infinite`}
        />

        <VStack spacing={6}>
          <Heading as="h2" size="xl" color="white">
            Ready to Secure Your Documents?
          </Heading>

          <Text fontSize="lg" color="gray.300" maxW="500px">
            Join the future of document verification. Get started today or reach out to learn more.
          </Text>

          <Button
            size="lg"
            bg="#8c1c84"
            color="white"
            _hover={{
              bg: '#6d1566',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(140, 28, 132, 0.4)',
            }}
            leftIcon={<Icon as={FiMail} />}
            transition="all 0.3s ease"
            px={8}
            as="a"
            href="mailto:julien@strat.cc"
          >
            Contact Us
          </Button>
        </VStack>
      </Box>
    </Container>
  )
}

interface FeatureCardProps {
  icon: any
  title: string
  description: string
  color: string
  delay: string
}

function FeatureCard({ icon, title, description, color, delay }: FeatureCardProps) {
  return (
    <Box
      bg="whiteAlpha.100"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="whiteAlpha.200"
      _hover={{
        bg: 'whiteAlpha.200',
        transform: 'translateY(-4px)',
        borderColor: color,
      }}
      transition="all 0.3s ease"
      animation={`${slideIn} 0.8s ease-out ${delay}`}
      cursor="pointer"
    >
      <VStack spacing={4} align="start">
        <Icon as={icon} boxSize={8} color={color} />
        <Heading as="h3" size="md" color="white">
          {title}
        </Heading>
        <Text color="gray.300" lineHeight="1.6">
          {description}
        </Text>
      </VStack>
    </Box>
  )
}

interface StepCardProps {
  step: number
  icon: any
  title: string
  description: string
  animation: string
}

function StepCard({ step, icon, title, description, animation }: StepCardProps) {
  return (
    <VStack spacing={4} textAlign="center" animation={animation}>
      <Box position="relative">
        <Box
          w={16}
          h={16}
          bg="#45a2f8"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="xl"
          fontWeight="bold"
          color="white"
          position="relative"
          zIndex={2}
        >
          {step}
        </Box>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w={20}
          h={20}
          bg="rgba(69, 162, 248, 0.2)"
          borderRadius="full"
          zIndex={1}
        />
      </Box>

      <Icon as={icon} boxSize={8} color="#45a2f8" />

      <Heading as="h3" size="md" color="white">
        {title}
      </Heading>

      <Text color="gray.300" lineHeight="1.6">
        {description}
      </Text>
    </VStack>
  )
}

interface TrustCardProps {
  icon: any
  title: string
  description: string
  iconColor: string
}

function TrustCard({ icon, title, description, iconColor }: TrustCardProps) {
  return (
    <Flex
      bg="whiteAlpha.100"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="whiteAlpha.200"
      align="start"
      gap={4}
      _hover={{
        bg: 'whiteAlpha.200',
        transform: 'translateY(-2px)',
      }}
      transition="all 0.3s ease"
    >
      <Icon as={icon} boxSize={6} color={iconColor} mt={1} />
      <VStack align="start" spacing={2}>
        <Heading as="h3" size="sm" color="white">
          {title}
        </Heading>
        <Text color="gray.300" fontSize="sm" lineHeight="1.6">
          {description}
        </Text>
      </VStack>
    </Flex>
  )
}
