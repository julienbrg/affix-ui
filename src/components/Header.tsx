'use client'

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  useDisclosure,
  VStack,
  Link as ChakraLink,
  CloseButton,
} from '@chakra-ui/react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { MenuRoot, MenuTrigger, MenuPositioner, MenuContent, MenuItem } from '@/components/ui/menu'
import { Dialog, Portal } from '@/components/ui/dialog'
import Link from 'next/link'
import { HiMenu } from 'react-icons/hi'
import LanguageSelector from './LanguageSelector'
import Spinner from './Spinner'
import { useTranslation } from '@/hooks/useTranslation'
import { useW3PK } from '@/context/W3PK'
import { useState, useEffect } from 'react'
import { FaGithub } from 'react-icons/fa'
import { toaster } from '@/components/ui/toaster'
import { brandColors } from '@/theme'

export default function Header() {
  const { isAuthenticated, user, isLoading, login, register, logout } = useW3PK()
  const t = useTranslation()
  const { open: isOpen, onOpen, onClose } = useDisclosure()
  const [username, setUsername] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isUsernameInvalid, setIsUsernameInvalid] = useState(false)

  const [scrollPosition, setScrollPosition] = useState(0)

  const shouldSlide = scrollPosition > 0
  const leftSlideValue = shouldSlide ? 2000 : 0
  const rightSlideValue = shouldSlide ? 2000 : 0

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const validateUsername = (input: string): boolean => {
    if (!input.trim()) {
      return true
    }

    const trimmedInput = input.trim()

    // Check overall format and length (3-50 chars)
    // Alphanumeric, underscore, and hyphen allowed
    // Must start and end with alphanumeric
    const formatValid =
      /^[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?$/.test(trimmedInput) &&
      trimmedInput.length >= 3 &&
      trimmedInput.length <= 50

    return formatValid
  }

  const handleLogin = async () => {
    // Check if credentials exist in localStorage or IndexedDB
    const hasCredentials = await checkForExistingCredentials()

    if (hasCredentials) {
      // User has credentials - perform normal login
      await login()
    } else {
      // No credentials - prompt for registration
      onOpen()
    }
  }

  const checkForExistingCredentials = async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined') {
        return false
      }

      // First check for persistent session in IndexedDB
      if (window.indexedDB) {
        const dbName = 'Web3PasskeyPersistentSessions'
        const storeName = 'sessions'

        const hasPersistentSession = await new Promise<boolean>(resolve => {
          const request = indexedDB.open(dbName)

          request.onerror = () => {
            resolve(false)
          }

          request.onsuccess = event => {
            const db = (event.target as IDBOpenDBRequest).result

            if (!db.objectStoreNames.contains(storeName)) {
              db.close()
              resolve(false)
              return
            }

            try {
              const transaction = db.transaction([storeName], 'readonly')
              const objectStore = transaction.objectStore(storeName)
              const countRequest = objectStore.count()

              countRequest.onsuccess = () => {
                db.close()
                resolve(countRequest.result > 0)
              }

              countRequest.onerror = () => {
                db.close()
                resolve(false)
              }
            } catch {
              db.close()
              resolve(false)
            }
          }
        })

        if (hasPersistentSession) {
          return true
        }
      }

      // Then check for w3pk_credential_index in localStorage
      const credentialIndex = localStorage.getItem('w3pk_credential_index')
      if (credentialIndex) {
        return true
      }

      return false
    } catch {
      return false
    }
  }

  const handleRegister = async () => {
    if (!username.trim()) {
      toaster.create({
        title: t.components.header.usernameRequired,
        description: t.components.header.usernameRequiredDesc,
        type: 'warning',
        duration: 3000,
      })
      setIsUsernameInvalid(true)
      return
    }

    const isValid = validateUsername(username)
    if (!isValid) {
      // toast({
      //   title: 'Invalid Username',
      //   description:
      //     'Username must be 3-50 characters long and contain only letters, numbers, underscores, and hyphens. It must start and end with a letter or number.',
      //   status: 'error',
      //   duration: 5000,
      //   isClosable: true,
      // })
      setIsUsernameInvalid(true)
      return
    }

    setIsUsernameInvalid(false)

    try {
      setIsRegistering(true)
      console.log('[Header] Starting registration for:', username.trim())

      // Add timeout to prevent infinite loading
      const registrationPromise = register(username.trim())
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Registration timeout after 60 seconds')), 60000)
      )

      await Promise.race([registrationPromise, timeoutPromise])

      console.log('[Header] Registration completed successfully')
      setUsername('')
      onClose()
    } catch (error: any) {
      console.error('[Header] Registration failed:', error)

      // Show user-friendly error message
      toaster.create({
        title: t.components.header.registrationFailed,
        description: error.message || t.components.header.registrationFailedDesc,
        type: 'error',
        duration: 8000,
      })
    } finally {
      console.log('[Header] Cleaning up registration state')
      setIsRegistering(false)
    }
  }

  useEffect(() => {
    const isValid = validateUsername(username)
    if (isValid) {
      setIsUsernameInvalid(false)
    }
  }, [username])

  const handleLogout = () => {
    logout()
  }

  const handleModalClose = () => {
    setUsername('')
    setIsUsernameInvalid(false)
    onClose()
  }

  return (
    <>
      <Box as="header" py={4} position="fixed" w="100%" top={0} zIndex={10} overflow="visible">
        <Container maxW="100%" px={{ base: 4, md: 6 }} overflow="visible">
          <Flex
            as="nav"
            aria-label="Main navigation"
            justify="space-between"
            align="center"
            overflow="visible"
          >
            <Box
              transform={`translateX(-${leftSlideValue}px)`}
              transition="transform 0.5s ease-in-out"
              suppressHydrationWarning
            >
              <Flex align="center" gap={3}>
                <Link href="/">
                  <Flex align="center" gap={5}>
                    <Heading as="h3" size="md" textAlign="center">
                      Affix
                    </Heading>
                  </Flex>
                </Link>
              </Flex>
            </Box>

            <Flex
              gap={2}
              align="center"
              transform={`translateX(${rightSlideValue}px)`}
              transition="transform 0.5s ease-in-out"
              suppressHydrationWarning
            >
              {!isAuthenticated ? (
                <Button
                  bg={brandColors.primary}
                  color="white"
                  _hover={{
                    bg: brandColors.secondary,
                  }}
                  onClick={handleLogin}
                  size="xs"
                  px={4}
                >
                  {t.common.login}
                </Button>
              ) : (
                <>
                  {/* <Box>
                    <Text fontSize="sm" color="gray.300">
                      {user?.displayName || user?.username}
                    </Text>
                  </Box> */}
                  <Button
                    bg={brandColors.primary}
                    color="white"
                    _hover={{
                      bg: brandColors.secondary,
                    }}
                    onClick={handleLogout}
                    size="xs"
                    ml={4}
                    px={4}
                  >
                    {t.common.logout}
                  </Button>
                </>
              )}
              <MenuRoot>
                <MenuTrigger asChild>
                  <IconButton aria-label="Options" variant="ghost" size="sm">
                    <HiMenu />
                  </IconButton>
                </MenuTrigger>
                <Portal>
                  <MenuPositioner>
                    <MenuContent minWidth="auto">
                      <Link href="/dashboard" color="white">
                        <MenuItem value="dashboard" fontSize="md" px={4} py={3}>
                          {t.navigation.dashboard}
                        </MenuItem>
                      </Link>
                      <Link href="/verify" color="white">
                        <MenuItem value="verify" fontSize="md" px={4} py={3}>
                          {t.navigation.verify}
                        </MenuItem>
                      </Link>
                      <Link href="/sandbox" color="white">
                        <MenuItem value="sandbox" fontSize="md" px={4} py={3}>
                          {t.navigation.sandbox}
                        </MenuItem>
                      </Link>
                      <Link href="/settings" color="white">
                        <MenuItem value="settings" fontSize="md" px={4} py={3}>
                          {t.navigation.settings}
                        </MenuItem>
                      </Link>
                    </MenuContent>
                  </MenuPositioner>
                </Portal>
              </MenuRoot>
              <LanguageSelector />
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Registration Modal */}
      <Dialog.Root
        open={isOpen}
        onOpenChange={(e: { open: boolean }) => (e.open ? null : handleModalClose())}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content p={6}>
              <Dialog.Header>
                <Dialog.Title>{t.components.header.registerTitle}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body pt={4}>
                <VStack gap={4}>
                  <Text fontSize="sm" color="gray.400">
                    {t.components.header.registerDesc}{' '}
                    <ChakraLink
                      href={'https://github.com/w3hc/w3pk/blob/main/src/auth/register.ts#L17-L102'}
                      color={brandColors.accent}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.components.header.w3pk}
                    </ChakraLink>
                    .
                  </Text>
                  <Field invalid={isUsernameInvalid} label={t.components.header.username}>
                    <Input
                      id="username-input"
                      aria-describedby={
                        isUsernameInvalid && username.trim() ? 'username-error' : undefined
                      }
                      aria-invalid={isUsernameInvalid && username.trim() ? true : undefined}
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder={t.components.header.usernamePlaceholder}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && username.trim()) {
                          handleRegister()
                        }
                      }}
                    />
                    {isUsernameInvalid && username.trim() && (
                      <Field.ErrorText id="username-error">
                        {t.components.header.usernameValidation}
                      </Field.ErrorText>
                    )}
                  </Field>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer gap={3} pt={6}>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">{t.common.cancel}</Button>
                </Dialog.ActionTrigger>
                <Button colorPalette="blue" onClick={handleRegister} disabled={!username.trim()}>
                  {isRegistering && <Spinner size="50px" />}
                  {!isRegistering && t.components.header.createAccount}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
