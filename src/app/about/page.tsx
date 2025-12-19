'use client'

import { Text, VStack, Box, Heading, Container, HStack } from '@chakra-ui/react'
import { Button } from '@/components/ui/button'
import { FiCopy, FiExternalLink } from 'react-icons/fi'
import { toaster } from '@/components/ui/toaster'

const AFFIX_OFFICIAL_CONTRACT = '0x5A4b81Fb55985a5294326092099F1588ED5B0920'

export default function AboutPage() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toaster.create({
      title: 'Copied to clipboard',
      type: 'info',
      duration: 2000,
    })
  }

  const openInExplorer = () => {
    window.open(`https://optimistic.etherscan.io/address/${AFFIX_OFFICIAL_CONTRACT}`, '_blank')
  }

  return (
    <main>
      <Container maxW="container.md" py={20}>
        <VStack gap={8} align="stretch">
          <header>
            <Heading as="h1" size="2xl" mb={4}>
              About Affix
            </Heading>
            <Text fontSize="lg" color="gray.400">
              Official contract information
            </Text>
          </header>

          <Box bg="whiteAlpha.50" p={8} borderRadius="lg" border="1px solid" borderColor="gray.700">
            <VStack gap={6} align="stretch">
              <VStack align="start" gap={2}>
                <Text fontSize="md" fontWeight="medium" color="gray.300">
                  Affix Official Contract Address
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Deployed on OP Mainnet (Chain ID: 10)
                </Text>
              </VStack>

              <Box
                bg="whiteAlpha.100"
                p={4}
                borderRadius="md"
                border="1px solid"
                borderColor="gray.600"
              >
                <Text fontSize="md" fontFamily="mono" color="gray.200" wordBreak="break-all" mb={4}>
                  {AFFIX_OFFICIAL_CONTRACT}
                </Text>

                <HStack gap={3} justify="center">
                  <Button
                    onClick={() => copyToClipboard(AFFIX_OFFICIAL_CONTRACT)}
                    bg="#45a2f8"
                    color="white"
                    _hover={{ bg: '#3182ce' }}
                    size="sm"
                  >
                    <FiCopy /> Copy Address
                  </Button>

                  <Button
                    onClick={openInExplorer}
                    variant="outline"
                    borderColor="gray.600"
                    color="gray.300"
                    _hover={{ bg: 'whiteAlpha.100', borderColor: 'gray.500' }}
                    size="sm"
                  >
                    <FiExternalLink /> View on Explorer
                  </Button>
                </HStack>
              </Box>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </main>
  )
}
