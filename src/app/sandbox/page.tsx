'use client'

import { Container, VStack, Heading, Text } from '@chakra-ui/react'
import { useTranslation } from '@/hooks/useTranslation'

export default function SandboxPage() {
  const t = useTranslation()

  return (
    <main>
      <Container maxW="container.xl" py={20}>
        <VStack gap={8} align="stretch">
          <header>
            <Heading as="h1" size="xl" mb={2}>
              {t.sandbox.title}
            </Heading>
            <Text color="gray.400">{t.sandbox.subtitle}</Text>
          </header>
        </VStack>
      </Container>
    </main>
  )
}
