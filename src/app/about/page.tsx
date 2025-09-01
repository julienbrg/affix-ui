'use client'

import { Container, Heading, Text, Box, VStack } from '@chakra-ui/react'

export default function AboutPage() {
  const registryAddress = '0xa0d98DCaDab6e6FF45cd7087F8192d65aa954256'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <main>
      <Container maxW="container.md" py={20}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" textAlign="center">
            Affix Official
          </Heading>

          <Heading as="h3" size="md" textAlign="center">
            Official Website (test)
          </Heading>

          <Box>
            <Text fontSize="lg" mb={4}>
              Onchain registry:
            </Text>

            <Box
              bg="whiteAlpha.100"
              p={4}
              borderRadius="md"
              border="1px solid"
              borderColor="gray.600"
              cursor="pointer"
              onClick={() => copyToClipboard(registryAddress)}
              _hover={{ bg: 'whiteAlpha.200' }}
              transition="all 0.2s"
            >
              <Text fontFamily="mono" fontSize="md" color="blue.300" wordBreak="break-all">
                {registryAddress}
              </Text>
            </Box>

            {/* <Text fontSize="sm" color="gray.400" mt={2} textAlign="center">
              Click to copy address
            </Text> */}
          </Box>
        </VStack>
      </Container>
    </main>
  )
}
