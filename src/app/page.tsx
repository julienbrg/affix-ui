'use client'

import { Text, VStack, Box, Heading, Container, Flex, SimpleGrid, HStack } from '@chakra-ui/react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'
import Link from 'next/link'
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
  FiFile,
  FiImage,
  FiVideo,
  FiCpu,
  FiTarget,
  FiGlobe,
  FiEdit3,
  FiStar,
} from 'react-icons/fi'

interface FeatureCardProps {
  icon: any
  title: string
  description: string
  color: string
  delay: string
}

function FeatureCard({ icon, title, description, color, delay }: FeatureCardProps) {
  const Icon = icon
  return (
    <Box
      bg="rgba(15, 23, 42, 0.6)"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="rgba(69, 162, 248, 0.2)"
      _hover={{
        bg: 'rgba(15, 23, 42, 0.8)',
        transform: 'translateY(-4px)',
        borderColor: color,
      }}
      transition="all 0.3s ease"
      cursor="pointer"
    >
      <VStack gap={4} align="start">
        <Icon size={32} color={color} />
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

interface DocumentTypeCardProps {
  icon: any
  title: string
  color: string
}

function DocumentTypeCard({ icon, title, color }: DocumentTypeCardProps) {
  const Icon = icon
  return (
    <VStack
      gap={3}
      p={4}
      bg="rgba(15, 23, 42, 0.6)"
      borderRadius="lg"
      border="1px solid"
      borderColor="rgba(69, 162, 248, 0.2)"
      _hover={{
        bg: 'rgba(15, 23, 42, 0.8)',
        transform: 'translateY(-2px)',
        borderColor: color,
      }}
      transition="all 0.3s ease"
      cursor="pointer"
    >
      <Icon size={32} color={color} />
      <Text color="white" fontWeight="semibold">
        {title}
      </Text>
    </VStack>
  )
}

interface StepCardProps {
  step: number
  icon: any
  title: string
  description: string
}

function StepCard({ step, icon, title, description }: StepCardProps) {
  const Icon = icon
  return (
    <VStack gap={4} textAlign="center" pb={20}>
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

      <Icon size={32} color="#45a2f8" />

      <Heading as="h3" size="md" color="white">
        {title}
      </Heading>

      <Text color="gray.300" lineHeight="1.6">
        {description}
      </Text>
    </VStack>
  )
}

interface RoadmapCardProps {
  icon: any
  title: string
  description: string
  status: string
  statusColor: string
}

function RoadmapCard({ icon, title, description, status, statusColor }: RoadmapCardProps) {
  const Icon = icon
  return (
    <Box
      bg="rgba(15, 23, 42, 0.6)"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="rgba(69, 162, 248, 0.2)"
      _hover={{
        bg: 'rgba(15, 23, 42, 0.8)',
        transform: 'translateY(-2px)',
      }}
      transition="all 0.3s ease"
    >
      <VStack gap={4} align="start">
        <HStack justify="space-between" w="full">
          <Icon size={32} color="#45a2f8" />
          <Box color="#8c1c84" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="medium">
            {status}
          </Box>
        </HStack>
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

interface TrustCardProps {
  icon: any
  title: string
  description: string
  iconColor: string
}

function TrustCard({ icon, title, description, iconColor }: TrustCardProps) {
  const Icon = icon
  return (
    <Flex
      bg="rgba(15, 23, 42, 0.6)"
      p={6}
      borderRadius="xl"
      border="1px solid"
      borderColor="rgba(69, 162, 248, 0.2)"
      align="start"
      gap={4}
      _hover={{
        bg: 'rgba(15, 23, 42, 0.8)',
        transform: 'translateY(-2px)',
      }}
      transition="all 0.3s ease"
    >
      <Icon size={24} color={iconColor} />
      <VStack align="start" gap={2}>
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

export default function Home() {
  const t = useTranslation()

  return (
    <>
      <Container maxW="container.xl" py={20}>
        {/* Hero Section */}
        <Box textAlign="center" position="relative">
          <VStack gap={6}>
            <Heading
              as="h2"
              size={{ base: 'xl', sm: '2xl', md: '3xl' }}
              color="white"
              lineHeight="1.2"
              maxW={{ base: '100%', md: '800px' }}
              px={{ base: 4, md: 0 }}
              textAlign={{ base: 'center', md: 'left' }}
            >
              <Text as="span" color="#45a2f8">
                Affix{' '}
              </Text>
              {t.home.hero.tagline}
            </Heading>
            <Heading
              as="h2"
              size={{ base: 'xl', sm: '2xl', md: '3xl' }}
              color="white"
              lineHeight="1.2"
              maxW={{ base: '100%', md: '800px' }}
              px={{ base: 4, md: 0 }}
              textAlign={{ base: 'center', md: 'left' }}
            >
              {t.home.hero.letTheWorld}{' '}
              <Text as="span" color="#45a2f8">
                {t.home.hero.verify}
              </Text>{' '}
              {t.home.hero.it}
            </Heading>

            <Text fontSize="xl" color="gray.300" maxW="600px" lineHeight="1.6">
              {t.home.hero.description}
            </Text>

            <Flex
              direction={{ base: 'column', md: 'row' }}
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
                  }}
                  px={8}
                  w={{ base: '250px', md: 'auto' }}
                >
                  {t.home.hero.dashboardButton} <FiArrowRight />
                </Button>
              </Link>

              <Link href="/verify">
                <Button
                  size="lg"
                  variant="outline"
                  borderColor="#45a2f8"
                  color="#45a2f8"
                  _hover={{
                    bg: 'gray.800',
                  }}
                  px={8}
                  w={{ base: '250px', md: 'auto' }}
                >
                  {t.home.hero.verifyButton} <FiSearch />
                </Button>
              </Link>
            </Flex>
          </VStack>
        </Box>

        {/* Problem Statement */}
        <Box py={20} textAlign="center">
          <VStack gap={6}>
            <Heading as="h2" size="lg" color="white">
              {t.home.problem.title}
            </Heading>
            <Text fontSize="lg" color="gray.300" maxW="700px" lineHeight="1.6">
              {t.home.problem.description}
            </Text>
          </VStack>
        </Box>

        {/* Features Grid */}
        <Box py={20}>
          <VStack gap={12}>
            <Heading
              as="h2"
              size="xl"
              textAlign="center"
              bgGradient="linear(to-r, white, gray.300)"
              bgClip="text"
            >
              {t.home.features.title}
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={8} w="full">
              <FeatureCard
                icon={FiCheck}
                title={t.home.features.easyToVerify}
                description={t.home.features.easyToVerifyDesc}
                color="green.400"
                delay="0s"
              />

              <FeatureCard
                icon={FiShield}
                title={t.home.features.unbreakableSecurity}
                description={t.home.features.unbreakableSecurityDesc}
                color="#45a2f8"
                delay="0.2s"
              />

              <FeatureCard
                icon={FiLock}
                title={t.home.features.privacyFirst}
                description={t.home.features.privacyFirstDesc}
                color="purple.400"
                delay="0.4s"
              />

              <FeatureCard
                icon={FiCpu}
                title={t.home.features.aiPowered}
                description={t.home.features.aiPoweredDesc}
                color="cyan.400"
                delay="0.6s"
              />

              <FeatureCard
                icon={FiUsers}
                title={t.home.features.forEveryone}
                description={t.home.features.forEveryoneDesc}
                color="yellow.400"
                delay="0.8s"
              />

              <FeatureCard
                icon={FiTarget}
                title={t.home.features.antiFraud}
                description={t.home.features.antiFraudDesc}
                color="red.400"
                delay="1s"
              />
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Document Types */}
        <Box py={20}>
          <VStack gap={12}>
            <Heading
              as="h2"
              size="xl"
              textAlign="center"
              bgGradient="linear(to-r, white, gray.300)"
              bgClip="text"
            >
              {t.home.documentTypes.title}
            </Heading>

            <SimpleGrid columns={{ base: 2, md: 4 }} gap={6} w="full">
              <DocumentTypeCard icon={FiFile} title={t.home.documentTypes.pdfs} color="#45a2f8" />
              <DocumentTypeCard icon={FiImage} title={t.home.documentTypes.images} color="green.400" />
              <DocumentTypeCard icon={FiVideo} title={t.home.documentTypes.videos} color="purple.400" />
              <DocumentTypeCard icon={FiDatabase} title={t.home.documentTypes.anyFile} color="orange.400" />
            </SimpleGrid>
          </VStack>
        </Box>

        {/* How It Works */}
        <Box
          py={12}
          bg="rgba(15, 23, 42, 0.4)"
          borderRadius="3xl"
          px={8}
          border="1px solid"
          borderColor="rgba(69, 162, 248, 0.2)"
        >
          <VStack gap={10}>
            <Heading
              as="h2"
              size="xl"
              textAlign="center"
              bgGradient="linear(to-r, white, gray.300)"
              bgClip="text"
            >
              {t.home.howItWorks.title}
            </Heading>

            <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8} w="full" maxW="1000px">
              <StepCard
                step={1}
                icon={FiUpload}
                title={t.home.howItWorks.step1Title}
                description={t.home.howItWorks.step1Desc}
              />

              <StepCard
                step={2}
                icon={FiEye}
                title={t.home.howItWorks.step2Title}
                description={t.home.howItWorks.step2Desc}
              />

              <StepCard
                step={3}
                icon={FiUserCheck}
                title={t.home.howItWorks.step3Title}
                description={t.home.howItWorks.step3Desc}
              />
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Trust Indicators */}
        <Box py={20}>
          <VStack gap={8}>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} w="full" maxW="800px">
              <TrustCard
                icon={FiDatabase}
                title={t.home.trust.noStorage}
                description={t.home.trust.noStorageDesc}
                iconColor="red.400"
              />

              <TrustCard
                icon={FiUserCheck}
                title={t.home.trust.guaranteeAuthorship}
                description={t.home.trust.guaranteeAuthorshipDesc}
                iconColor="green.400"
              />
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Roadmap */}
        <Box py={20}>
          <VStack gap={12}>
            <Heading
              as="h2"
              size="xl"
              textAlign="center"
              bgGradient="linear(to-r, white, gray.300)"
              bgClip="text"
            >
              {t.home.roadmap.title}
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap={8} w="full" maxW="1100px">
              <RoadmapCard
                icon={FiGlobe}
                title={t.home.roadmap.publicDocuments}
                description={t.home.roadmap.publicDocumentsDesc}
                status={t.home.roadmap.comingSoon}
                statusColor="blue.400"
              />

              <RoadmapCard
                icon={FiEdit3}
                title={t.home.roadmap.digitalAgreements}
                description={t.home.roadmap.digitalAgreementsDesc}
                status={t.home.roadmap.comingSoon}
                statusColor="blue.400"
              />

              <RoadmapCard
                icon={FiStar}
                title={t.home.roadmap.mainnetLaunch}
                description={t.home.roadmap.mainnetLaunchDesc}
                status={t.home.roadmap.comingSoon}
                statusColor="blue.400"
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
          borderColor="gray.700"
          position="relative"
          overflow="hidden"
        >
          <VStack gap={6}>
            <Heading as="h2" size="xl" color="white">
              {t.home.cta.title}
            </Heading>

            <Text fontSize="lg" color="gray.300" maxW="500px">
              {t.home.cta.description}
            </Text>

            <a href="mailto:julien@strat.cc" style={{ display: 'inline-block' }} target="_blank">
              <Button
                size="lg"
                bg="#8c1c84"
                color="white"
                _hover={{
                  bg: '#6d1566',
                }}
                px={8}
              >
                <FiMail /> {t.home.cta.contactButton}
              </Button>
            </a>
          </VStack>
        </Box>
      </Container>
    </>
  )
}
