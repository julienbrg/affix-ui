'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Heading,
  VStack,
  Text,
  Code,
  TabsRoot,
  TabsList,
  TabsContent,
  TabsTrigger,
  useDisclosure,
  HStack,
  SimpleGrid,
  Icon,
  ListRoot,
  ListItem,
  Badge,
  Link as ChakraLink,
  Flex,
  CloseButton,
  Textarea,
} from '@chakra-ui/react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { Dialog, Portal } from '@/components/ui/dialog'
import { toaster } from '@/components/ui/toaster'
import { MdDelete, MdCheckCircle, MdWarning, MdInfo, MdDownload, MdLock } from 'react-icons/md'
import {
  FiShield,
  FiCheckCircle,
  FiCloud,
  FiUsers,
  FiKey,
  FiDownload,
  FiDatabase,
  FiHardDrive,
  FiUpload,
  FiClock,
  FiUserPlus,
} from 'react-icons/fi'
import { useW3PK } from '../../../src/context/W3PK'
import { useTranslation } from '@/hooks/useTranslation'
import Spinner from '../../../src/components/Spinner'
import PasswordModal from '../../components/PasswordModal'
import { CodeBlock } from '@/components/CodeBlock'
import { detectBrowser, isWebAuthnAvailable } from '../../../src/utils/browserDetection'
import { brandColors } from '@/theme'
import { BuildVerification } from '@/components/BuildVerification'
import {
  inspectLocalStorage,
  inspectIndexedDB,
  formatValue,
  maskSensitiveData,
  clearLocalStorageItem,
  clearIndexedDBRecord,
  type LocalStorageItem,
  type IndexedDBInfo,
} from '../../../src/utils/storageInspection'
import { QRCodeSVG } from 'qrcode.react'
import {
  SliderRoot,
  SliderLabel,
  SliderValueText,
  SliderControl,
  SliderTrack,
  SliderRange,
  SliderThumb,
} from '@/components/ui/slider'

interface StoredAccount {
  username: string
  ethereumAddress: string
  id: string
  displayName?: string
}

const SettingsPage = () => {
  const t = useTranslation()
  const [backupStatus, setBackupStatus] = useState<string | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showRestorePasswordModal, setShowRestorePasswordModal] = useState(false)
  const [selectedBackupFile, setSelectedBackupFile] = useState<string | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreUsername, setRestoreUsername] = useState('')
  const [needsUsernameForRestore, setNeedsUsernameForRestore] = useState(false)
  const [isRestoreUsernameInvalid, setIsRestoreUsernameInvalid] = useState(false)
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [accountToDelete, setAccountToDelete] = useState<StoredAccount | null>(null)
  const { open: isOpen, onOpen, onClose } = useDisclosure()

  const [localStorageData, setLocalStorageData] = useState<LocalStorageItem[]>([])
  const [indexedDBData, setIndexedDBData] = useState<IndexedDBInfo[]>([])
  const [isInspectingLocalStorage, setIsInspectingLocalStorage] = useState(false)
  const [isInspectingIndexedDB, setIsInspectingIndexedDB] = useState(false)
  const [showLocalStorageModal, setShowLocalStorageModal] = useState(false)
  const [showIndexedDBModal, setShowIndexedDBModal] = useState(false)

  const [index0Address, setIndex0Address] = useState<string>('')
  const [mainAddress, setMainAddress] = useState<string>('')
  const [openbarAddress, setOpenbarAddress] = useState<string>('')
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string>('')
  const [showQRCode, setShowQRCode] = useState(false)
  const [pastedQRData, setPastedQRData] = useState<string>('')
  const [parsedQRData, setParsedQRData] = useState<any>(null)

  // Persistent session duration state
  const [persistentSessionDays, setPersistentSessionDays] = useState<number>(() => {
    if (typeof window === 'undefined') return 7
    const stored = localStorage.getItem('persistentSessionDuration')
    const days = stored ? parseInt(stored, 10) : 7
    return days >= 1 && days <= 30 ? days : 7
  })

  // Handler for session duration change
  const handleSessionDurationChange = async (details: { value: number[] }) => {
    const days = details.value[0]
    setPersistentSessionDays(days)
    localStorage.setItem('persistentSessionDuration', days.toString())

    // Wait 3 seconds then logout and login to apply the new duration
    setTimeout(async () => {
      logout()
      // Wait a bit for logout to complete, then trigger login
      setTimeout(async () => {
        try {
          await login()
        } catch (error) {
          // User cancelled login, that's okay
          console.log('Login cancelled by user')
        }
      }, 500)
    }, 3000)
  }

  // Social Recovery state
  const [guardianName, setGuardianName] = useState<string>('')
  const [guardianEmail, setGuardianEmail] = useState<string>('')
  const [guardiansList, setGuardiansList] = useState<Array<{ name: string; email?: string }>>([])
  const [threshold, setThreshold] = useState<number>(3)
  const [socialRecoveryConfig, setSocialRecoveryConfig] = useState<any>(null)
  const [selectedGuardianForInvite, setSelectedGuardianForInvite] = useState<any>(null)
  const [guardianInvite, setGuardianInvite] = useState<any>(null)

  // Recovery state
  const [recoveryShares, setRecoveryShares] = useState<string[]>([])
  const [currentShareInput, setCurrentShareInput] = useState<string>('')
  const [isRecovering, setIsRecovering] = useState(false)
  const [showRecoverySection, setShowRecoverySection] = useState(false)

  // Registration state
  const {
    open: isRegisterModalOpen,
    onOpen: onRegisterModalOpen,
    onClose: onRegisterModalClose,
  } = useDisclosure()
  const [registerUsername, setRegisterUsername] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRegisterUsernameInvalid, setIsRegisterUsernameInvalid] = useState(false)

  const {
    isAuthenticated,
    user,
    getBackupStatus,
    createBackup,
    restoreFromBackup,
    registerWithBackupFile,
    login,
    logout,
    register,
    deriveWallet,
    setupSocialRecovery,
    getSocialRecoveryConfig,
    generateGuardianInvite,
    recoverFromGuardians,
    clearSocialRecoveryConfig,
  } = useW3PK()

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

  const handleRegister = async () => {
    if (!registerUsername.trim()) {
      toaster.create({
        title: 'Username Required',
        description: 'Please enter a username to register.',
        type: 'warning',
        duration: 3000,
      })
      setIsRegisterUsernameInvalid(true)
      return
    }

    const isValid = validateUsername(registerUsername)
    if (!isValid) {
      setIsRegisterUsernameInvalid(true)
      return
    }

    setIsRegisterUsernameInvalid(false)

    try {
      setIsRegistering(true)
      console.log('[Settings] Starting registration for:', registerUsername.trim())

      // Add timeout to prevent infinite loading
      const registrationPromise = register(registerUsername.trim())
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Registration timeout after 60 seconds')), 60000)
      )

      await Promise.race([registrationPromise, timeoutPromise])

      console.log('[Settings] Registration completed successfully')
      setRegisterUsername('')
      onRegisterModalClose()

      toaster.create({
        title: 'Registration Successful',
        description: 'Your new account has been created.',
        type: 'success',
        duration: 5000,
      })
    } catch (error: any) {
      console.error('[Settings] Registration failed:', error)

      // Show user-friendly error message
      toaster.create({
        title: 'Registration Failed',
        description: error.message || 'Unable to complete registration. Please try again.',
        type: 'error',
        duration: 8000,
      })
    } finally {
      console.log('[Settings] Cleaning up registration state')
      setIsRegistering(false)
    }
  }

  const handleRegisterModalClose = () => {
    setRegisterUsername('')
    setIsRegisterUsernameInvalid(false)
    onRegisterModalClose()
  }

  const handleInspectLocalStorage = async () => {
    setIsInspectingLocalStorage(true)
    try {
      const data = await inspectLocalStorage()
      setLocalStorageData(data)

      toaster.create({
        title: 'LocalStorage Inspected',
        description: `Found ${data.length} items. Scroll down to see results.`,
        type: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Error inspecting localStorage:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to inspect localStorage',
        type: 'error',
        duration: 3000,
      })
    } finally {
      setIsInspectingLocalStorage(false)
    }
  }

  const handleInspectIndexedDB = async () => {
    setIsInspectingIndexedDB(true)
    try {
      const data = await inspectIndexedDB()
      setIndexedDBData(data)

      const totalRecords = data.reduce((sum, db) => sum + db.records.length, 0)
      toaster.create({
        title: 'IndexedDB Inspected',
        description: `Found ${data.length} database(s) with ${totalRecords} record(s). Scroll down to see results.`,
        type: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('Error inspecting IndexedDB:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to inspect IndexedDB',
        type: 'error',
        duration: 3000,
      })
    } finally {
      setIsInspectingIndexedDB(false)
    }
  }

  const handleClearLocalStorageItem = async (key: string) => {
    const success = clearLocalStorageItem(key)
    if (success) {
      const updatedData = localStorageData.filter(item => item.key !== key)
      setLocalStorageData(updatedData)

      toaster.create({
        title: 'Item Cleared',
        description: `Removed "${key}" from localStorage`,
        type: 'success',
        duration: 2000,
      })
    } else {
      toaster.create({
        title: 'Error',
        description: `Failed to clear "${key}"`,
        type: 'error',
        duration: 3000,
      })
    }
  }

  const handleClearIndexedDBRecord = async (dbName: string, storeName: string, key: string) => {
    const success = await clearIndexedDBRecord(dbName, storeName, key)
    if (success) {
      const updatedData = indexedDBData.map(db => {
        if (db.name === dbName) {
          return {
            ...db,
            records: db.records.filter(
              record => !(record.store === storeName && record.key === key)
            ),
          }
        }
        return db
      })
      setIndexedDBData(updatedData)

      toaster.create({
        title: 'Record Cleared',
        description: `Removed record from ${dbName}/${storeName}`,
        type: 'success',
        duration: 2000,
      })
    } else {
      toaster.create({
        title: 'Error',
        description: 'Failed to clear record',
        type: 'error',
        duration: 3000,
      })
    }
  }

  const loadAccounts = useCallback(() => {
    try {
      const storedAccounts: StoredAccount[] = []

      // Only show the current logged-in user
      if (user) {
        storedAccounts.push({
          username: user.username,
          ethereumAddress: user.ethereumAddress,
          id: user.id,
          displayName: user.displayName,
        })
      }

      setAccounts(storedAccounts)
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }, [user])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  useEffect(() => {
    const isValid = validateUsername(registerUsername)
    if (isValid) {
      setIsRegisterUsernameInvalid(false)
    }
  }, [registerUsername])

  useEffect(() => {
    const loadAddressesAndStatus = async () => {
      if (!isAuthenticated || !user) return

      if (deriveWallet && !isLoadingAddresses && !index0Address) {
        setIsLoadingAddresses(true)
        try {
          setIndex0Address(user.ethereumAddress)

          const mainWallet = await deriveWallet('STANDARD', 'MAIN')
          setMainAddress(mainWallet.address)

          const openbarWallet = await deriveWallet('YOLO', 'OPENBAR')
          setOpenbarAddress(openbarWallet.address)
        } catch (error) {
          console.error('Failed to load addresses:', error)
          toaster.create({
            title: 'Error loading addresses',
            description: (error as Error).message || 'Failed to derive wallet addresses',
            type: 'error',
            duration: 5000,
          })
        } finally {
          setIsLoadingAddresses(false)
        }
      }

      if (getBackupStatus && !backupStatus && !isCheckingStatus) {
        setIsCheckingStatus(true)
        try {
          const statusObject = await getBackupStatus()

          if (
            statusObject &&
            statusObject.securityScore &&
            typeof statusObject.securityScore.total === 'number'
          ) {
            const scoreValue = statusObject.securityScore.total
            const scoreLevel = statusObject.securityScore.level || 'unknown'
            const statusString = `Security Score: ${scoreValue}/100 (Level: ${scoreLevel})`
            setBackupStatus(statusString)
          }
        } catch (error) {
          console.error('Error loading backup status:', error)
          toaster.create({
            title: 'Error loading backup status',
            description: (error as Error).message || 'Failed to check security status',
            type: 'error',
            duration: 5000,
          })
        } finally {
          setIsCheckingStatus(false)
        }
      }
    }

    loadAddressesAndStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user])

  useEffect(() => {
    if (isAuthenticated && getSocialRecoveryConfig) {
      const config = getSocialRecoveryConfig()
      setSocialRecoveryConfig(config)
    }
  }, [isAuthenticated, getSocialRecoveryConfig])

  const handleDeleteAccount = (account: StoredAccount) => {
    setAccountToDelete(account)
    onOpen()
  }

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage)
        const keysToRemove: string[] = []

        keys.forEach(key => {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              if (
                value.includes(accountToDelete.ethereumAddress) ||
                value.includes(accountToDelete.username) ||
                value.includes(accountToDelete.id)
              ) {
                keysToRemove.push(key)
              }
            }
          } catch (e) {
            // Skip this key
          }
        })

        keysToRemove.forEach(key => {
          localStorage.removeItem(key)
        })

        toaster.create({
          title: 'Account Removed',
          description: `Account ${accountToDelete.username} has been removed from this device.`,
          type: 'success',
          duration: 3000,
        })

        // If we deleted the current user's account, log them out
        if (user && user.ethereumAddress === accountToDelete.ethereumAddress) {
          toaster.create({
            title: 'Logging out',
            description: 'You removed your current account. Logging out...',
            type: 'info',
            duration: 2000,
          })
          setTimeout(() => {
            logout()
          }, 2000)
        }

        loadAccounts()
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toaster.create({
        title: 'Error',
        description: 'Failed to remove account. Please try again.',
        type: 'error',
        duration: 5000,
      })
    } finally {
      setAccountToDelete(null)
      onClose()
    }
  }

  const handleRestoreBackup = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.json,.enc'
    fileInput.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      try {
        const textContent = await file.text()

        try {
          JSON.parse(textContent)
          setSelectedBackupFile(textContent)
          setShowRestorePasswordModal(true)
          return
        } catch (jsonError) {}

        setSelectedBackupFile(textContent)
        setShowRestorePasswordModal(true)
      } catch (error) {
        toaster.create({
          title: 'Error reading file',
          description: (error as Error).message || 'Failed to read backup file',
          type: 'error',
          duration: 5000,
        })
      }
    }
    fileInput.click()
  }

  const handleRestorePasswordSubmit = async (password: string) => {
    setShowRestorePasswordModal(false)

    if (!selectedBackupFile) {
      toaster.create({
        title: 'No backup file selected',
        type: 'error',
        duration: 3000,
      })
      return
    }

    setIsRestoring(true)
    try {
      let backupToRestore = selectedBackupFile

      try {
        const backupObj = JSON.parse(selectedBackupFile)

        if (backupObj['recovery-phrase.txt.enc']) {
          const encryptedContent = backupObj['recovery-phrase.txt.enc']
          backupToRestore = encryptedContent
        } else if (!backupObj.version && (backupObj.encrypted || backupObj.mnemonic)) {
          toaster.create({
            title: 'Incompatible Backup Version',
            description:
              'This backup was created with an older version of w3pk. Please create a new backup with the current version.',
            type: 'warning',
            duration: 8000,
          })
          setIsRestoring(false)
          return
        }
      } catch (e) {}

      // If NOT authenticated, prompt for username to register with backup file
      if (!isAuthenticated) {
        setNeedsUsernameForRestore(true)
        setIsRestoring(false)

        // Store password for later use
        ;(window as any)._restorePassword = password
        ;(window as any)._restoreBackup = backupToRestore
        return
      }

      // If authenticated, restore and overwrite existing credentials
      const result = await restoreFromBackup(backupToRestore, password)

      toaster.create({
        title: 'Wallet Restored!',
        description: `Successfully restored and overwrote wallet: ${result.ethereumAddress.slice(0, 6)}...${result.ethereumAddress.slice(-4)}`,
        type: 'success',
        duration: 5000,
      })

      setSelectedBackupFile(null)
    } catch (error) {
      // Error toast shown in restoreFromBackup
    } finally {
      setIsRestoring(false)
    }
  }

  const handleRestoreWithUsername = async () => {
    if (!restoreUsername.trim()) {
      toaster.create({
        title: 'Username Required',
        description: 'Please enter a username to register with the restored wallet.',
        type: 'warning',
        duration: 3000,
      })
      setIsRestoreUsernameInvalid(true)
      return
    }

    if (!validateUsername(restoreUsername)) {
      setIsRestoreUsernameInvalid(true)
      return
    }

    setIsRestoring(true)
    setNeedsUsernameForRestore(false)

    try {
      const password = (window as any)._restorePassword
      const backupData = (window as any)._restoreBackup

      if (!password || !backupData) {
        throw new Error('Missing restore data')
      }

      const result = await registerWithBackupFile(backupData, password, restoreUsername.trim())

      toaster.create({
        title: 'Wallet Restored & Registered!',
        description: `Successfully restored and registered wallet: ${result.address.slice(0, 6)}...${result.address.slice(-4)}`,
        type: 'success',
        duration: 5000,
      })

      // Clear temporary data
      delete (window as any)._restorePassword
      delete (window as any)._restoreBackup
      setSelectedBackupFile(null)
      setRestoreUsername('')
    } catch (error) {
      // Error toast shown in registerWithBackupFile
    } finally {
      setIsRestoring(false)
    }
  }

  const handleRestoreModalClose = () => {
    setShowRestorePasswordModal(false)
    setSelectedBackupFile(null)
  }

  if (!isAuthenticated || !getBackupStatus || !createBackup) {
    const browserInfo = detectBrowser()
    const webAuthnAvailable = isWebAuthnAvailable()

    let alertStatus: 'info' | 'warning' | 'error' = 'warning'
    if (browserInfo.warningLevel === 'error') alertStatus = 'error'
    else if (browserInfo.warningLevel === 'warning') alertStatus = 'warning'
    else if (browserInfo.warningLevel === 'info') alertStatus = 'info'

    return (
      <>
        <VStack gap={8} align="stretch" py={20}>
          <Box textAlign="center">
            <Heading as="h1" size="2xl" mb={4}>
              {t.settings.title}
            </Heading>
            <Text fontSize="xl" color="gray.400" maxW="2xl" mx="auto">
              {t.settings.loginRequired}
            </Text>
          </Box>

          <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
            <HStack mb={4}>
              <Icon as={MdInfo} color={brandColors.primary} boxSize={6} />
              <Heading size="md">Browser Info</Heading>
            </HStack>
            <VStack align="stretch" gap={3}>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">
                  Browser:
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="white">
                  {browserInfo.name}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">
                  Version:
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="white">
                  {browserInfo.fullVersion || browserInfo.version}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">
                  Operating System:
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="white">
                  {browserInfo.os}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">
                  WebAuthn Support:
                </Text>
                <Badge colorPalette={webAuthnAvailable ? 'green' : 'red'}>
                  {webAuthnAvailable ? 'Available' : 'Not Available'}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.400">
                  Compatibility:
                </Text>
                <Badge
                  colorPalette={
                    browserInfo.isSupported && !browserInfo.hasKnownIssues
                      ? 'green'
                      : browserInfo.hasKnownIssues
                        ? 'yellow'
                        : 'red'
                  }
                >
                  {browserInfo.isSupported && !browserInfo.hasKnownIssues
                    ? 'Fully Supported'
                    : browserInfo.hasKnownIssues
                      ? 'Known Issues'
                      : 'Not Supported'}
                </Badge>
              </HStack>
            </VStack>
          </Box>

          {browserInfo.recommendation && (
            <Box
              p={4}
              bg={
                alertStatus === 'error'
                  ? 'red.900/90'
                  : alertStatus === 'warning'
                    ? 'yellow.900/90'
                    : 'blue.900/90'
              }
              borderRadius="lg"
            >
              <Box fontSize="sm">
                <Text fontWeight="bold" mb={1}>
                  {alertStatus === 'error'
                    ? 'Browser Not Supported'
                    : alertStatus === 'warning'
                      ? 'Known Issues Detected'
                      : 'Recommendation'}
                </Text>
                <Text fontSize="sm">{browserInfo.recommendation}</Text>
              </Box>
            </Box>
          )}

          {!webAuthnAvailable && (
            <Box p={4} bg="red.900/90" borderRadius="lg">
              <Box fontSize="sm">
                <Text fontWeight="bold" mb={1}>
                  WebAuthn Not Available
                </Text>
                <Text fontSize="sm">
                  Your browser does not support WebAuthn, which is required for w3pk authentication.
                  Please update your browser or use a supported browser:
                </Text>
                <ListRoot gap={1} mt={2} ml={4} fontSize="xs">
                  <ListItem>Chrome 67+ (May 2018)</ListItem>
                  <ListItem>Firefox 60+ (May 2018)</ListItem>
                  <ListItem>Safari 14+ (September 2020)</ListItem>
                  <ListItem>Edge 18+ (November 2018)</ListItem>
                  <ListItem>Samsung Internet 11+ (February 2020)</ListItem>
                </ListRoot>
              </Box>
            </Box>
          )}

          {browserInfo.os === 'Android' && (
            <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
              <Heading size="sm" mb={3} color={brandColors.primary}>
                Recommended Browsers for Android
              </Heading>
              <ListRoot gap={2} fontSize="sm">
                <ListItem>
                  <HStack>
                    <Icon
                      as={browserInfo.name === 'Samsung Internet' ? MdCheckCircle : MdInfo}
                      color={browserInfo.name === 'Samsung Internet' ? 'green.400' : 'gray.400'}
                    />
                    <Text color="gray.300">
                      <strong>Samsung Internet</strong> (Best for Samsung devices) - ✅ Confirmed
                      working
                    </Text>
                  </HStack>
                </ListItem>
                <ListItem>
                  <HStack>
                    <Icon
                      as={browserInfo.name === 'Chrome' ? MdCheckCircle : MdInfo}
                      color={browserInfo.name === 'Chrome' ? 'green.400' : 'gray.400'}
                    />
                    <Text color="gray.300">
                      <strong>Chrome</strong> - ✅ Reliable
                    </Text>
                  </HStack>
                </ListItem>
                <ListItem>
                  <HStack>
                    <Icon
                      as={browserInfo.name === 'Edge' ? MdCheckCircle : MdInfo}
                      color={browserInfo.name === 'Edge' ? 'green.400' : 'gray.400'}
                    />
                    <Text color="gray.300">
                      <strong>Edge</strong> - ✅ Reliable
                    </Text>
                  </HStack>
                </ListItem>
                <ListItem>
                  <HStack>
                    <Icon as={MdWarning} color="yellow.400" />
                    <Text color="gray.300">
                      <strong>Firefox Mobile</strong> - ⚠️ Avoid (known passkey persistence issues)
                    </Text>
                  </HStack>
                </ListItem>
              </ListRoot>
            </Box>
          )}

          <BuildVerification />

          {/* Restore from Backup - Available without authentication */}
          <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
            <HStack mb={4}>
              <Icon as={FiUpload} color={brandColors.primary} boxSize={6} />
              <Heading size="md">Restore from Backup</Heading>
            </HStack>
            <Text fontSize="sm" color="gray.400" mb={4}>
              If you have a backup file, you can restore your wallet without logging in first.
            </Text>
            <Button
              bg={brandColors.primary}
              color="white"
              _hover={{ bg: brandColors.secondary }}
              onClick={handleRestoreBackup}
              loading={isRestoring}
              spinner={<Spinner size="200px" />}
              loadingText="Restoring..."
              disabled={isRestoring}
              width="full"
            >
              <Icon as={FiUpload} mr={2} />
              Restore from Backup File
            </Button>
          </Box>

          {/* Register a new account */}
          {/* <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
            <HStack mb={4}>
              <Icon as={FiUserPlus} color={brandColors.primary} boxSize={6} />
              <Heading size="md">Register a new account</Heading>
            </HStack>
            <Text fontSize="sm" color="gray.400" mb={4}>
              Create a new Web3 passkey account. Each account is secured with your device&apos;s
              biometric authentication or PIN, and has its own Ethereum wallet.
            </Text>
            <Button
              bg={brandColors.primary}
              color="white"
              _hover={{
                bg: brandColors.secondary,
              }}
              onClick={onRegisterModalOpen}
              width="full"
            >
              <Icon as={FiUserPlus} />
              Register
            </Button>
          </Box> */}

          <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
            <Heading size="sm" mb={3} color={brandColors.primary}>
              Debug & Inspect Storage
            </Heading>
            <Text fontSize="sm" color="gray.400" mb={4}>
              Inspect browser storage and activity logs
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Button
                onClick={handleInspectLocalStorage}
                loading={isInspectingLocalStorage}
                loadingText="Inspecting..."
                variant="outline"
                colorPalette="purple"
                size="sm"
              >
                <Icon as={FiHardDrive} mr={2} />
                Inspect LocalStorage
              </Button>
              <Button
                onClick={handleInspectIndexedDB}
                loading={isInspectingIndexedDB}
                loadingText="Inspecting..."
                variant="outline"
                colorPalette="purple"
                size="sm"
              >
                <Icon as={FiDatabase} mr={2} />
                Inspect IndexedDB
              </Button>
            </SimpleGrid>
          </Box>

          {localStorageData.length > 0 && (
            <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="purple.600">
              <HStack mb={4} justify="space-between">
                <HStack>
                  <Icon as={FiHardDrive} color={brandColors.primary} boxSize={6} />
                  <Heading size="md">LocalStorage Results</Heading>
                </HStack>
                <Badge colorPalette="purple">{localStorageData.length} items</Badge>
              </HStack>
              <VStack align="stretch" gap={3}>
                {localStorageData.map((item, index) => (
                  <Box
                    key={index}
                    bg="gray.950"
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={item.type.startsWith('w3pk') ? 'purple.700' : 'gray.800'}
                  >
                    <VStack align="stretch" gap={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="bold" color="white" flex={1}>
                          {item.key}
                        </Text>
                        <HStack gap={2}>
                          {item.encrypted && (
                            <Badge colorPalette="orange" fontSize="xs">
                              Encrypted
                            </Badge>
                          )}
                          <Badge
                            colorPalette={item.type.startsWith('w3pk') ? 'purple' : 'gray'}
                            fontSize="xs"
                          >
                            {item.type}
                          </Badge>
                          <IconButton
                            aria-label="Clear item"
                            size="xs"
                            colorPalette="red"
                            variant="ghost"
                            onClick={() => handleClearLocalStorageItem(item.key)}
                          >
                            <MdDelete />
                          </IconButton>
                        </HStack>
                      </HStack>

                      {item.parsedValue && (
                        <Box bg="black" p={3} borderRadius="md" overflowX="auto">
                          <CodeBlock>
                            {formatValue(maskSensitiveData(item.key, item.parsedValue))}
                          </CodeBlock>
                        </Box>
                      )}

                      {!item.parsedValue && (
                        <Text fontSize="xs" color="gray.500" fontFamily="monospace">
                          {item.value}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {indexedDBData.length > 0 && (
            <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="purple.600">
              <HStack mb={4} justify="space-between">
                <HStack>
                  <Icon as={FiDatabase} color={brandColors.primary} boxSize={6} />
                  <Heading size="md">IndexedDB Results</Heading>
                </HStack>
                <Badge colorPalette="purple">{indexedDBData.length} database(s)</Badge>
              </HStack>
              <VStack align="stretch" gap={4}>
                {indexedDBData.map((db, dbIndex) => (
                  <Box
                    key={dbIndex}
                    bg="gray.950"
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="purple.700"
                  >
                    <VStack align="stretch" gap={3}>
                      <HStack justify="space-between">
                        <Text fontSize="md" fontWeight="bold" color="white">
                          {db.name}
                        </Text>
                        <Badge colorPalette="purple" fontSize="xs">
                          v{db.version}
                        </Badge>
                      </HStack>

                      <Text fontSize="xs" color="gray.400">
                        Stores: {db.stores.join(', ')}
                      </Text>

                      <Text fontSize="xs" color="gray.400">
                        Records: {db.records.length}
                      </Text>

                      {db.records.length > 0 && (
                        <VStack align="stretch" gap={2} mt={2}>
                          {db.records.map((record, recordIndex) => (
                            <Box
                              key={recordIndex}
                              bg="black"
                              p={3}
                              borderRadius="md"
                              border="1px solid"
                              borderColor="gray.900"
                            >
                              <HStack justify="space-between" mb={2}>
                                <Text fontSize="xs" color="gray.400">
                                  Store: {record.store} | Key: {record.key}
                                </Text>
                                <IconButton
                                  aria-label="Clear record"
                                  size="xs"
                                  colorPalette="red"
                                  variant="ghost"
                                  onClick={() =>
                                    handleClearIndexedDBRecord(db.name, record.store, record.key)
                                  }
                                >
                                  <MdDelete />
                                </IconButton>
                              </HStack>
                              <Box overflowX="auto">
                                <CodeBlock>
                                  {formatValue(maskSensitiveData(record.key, record.value))}
                                </CodeBlock>
                              </Box>
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
        </VStack>

        <PasswordModal
          isOpen={showRestorePasswordModal}
          onClose={handleRestoreModalClose}
          onSubmit={handleRestorePasswordSubmit}
          title={`Enter Password to Restore Backup`}
          description={`Please enter the password you used when creating this backup file.`}
        />

        {/* Registration Modal - Available without authentication */}
        <Dialog.Root
          open={isRegisterModalOpen}
          onOpenChange={(e: { open: boolean }) => (e.open ? null : handleRegisterModalClose())}
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content p={6}>
                <Dialog.Header>
                  <Dialog.Title>Register New Account</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body pt={4}>
                  <VStack gap={4}>
                    <Text fontSize="sm" color="gray.400">
                      An Ethereum wallet will be created and securely stored on your device,
                      protected by your biometric or PIN thanks to{' '}
                      <ChakraLink
                        href={
                          'https://github.com/w3hc/w3pk/blob/main/src/auth/register.ts#L17-L102'
                        }
                        color={brandColors.accent}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        w3pk
                      </ChakraLink>
                      .
                    </Text>
                    <Field invalid={isRegisterUsernameInvalid} label="Username">
                      <Input
                        id="username-input"
                        aria-describedby={
                          isRegisterUsernameInvalid && registerUsername.trim()
                            ? 'username-error'
                            : undefined
                        }
                        aria-invalid={
                          isRegisterUsernameInvalid && registerUsername.trim() ? true : undefined
                        }
                        value={registerUsername}
                        onChange={e => setRegisterUsername(e.target.value)}
                        placeholder="Enter your username"
                        pl={3}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && registerUsername.trim()) {
                            handleRegister()
                          }
                        }}
                      />
                      {isRegisterUsernameInvalid && registerUsername.trim() && (
                        <Field.ErrorText id="username-error">
                          Username must be 3-50 characters long and contain only letters, numbers,
                          underscores, and hyphens. It must start and end with a letter or number.
                        </Field.ErrorText>
                      )}
                    </Field>
                  </VStack>
                </Dialog.Body>

                <Dialog.Footer gap={3} pt={6}>
                  <Dialog.ActionTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </Dialog.ActionTrigger>
                  <Button
                    colorPalette="blue"
                    onClick={handleRegister}
                    disabled={!registerUsername.trim()}
                  >
                    {isRegistering && <Spinner size="42px" />}
                    {!isRegistering && 'Create Account'}
                  </Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>

        <PasswordModal
          isOpen={showRestorePasswordModal}
          onClose={handleRestoreModalClose}
          onSubmit={handleRestorePasswordSubmit}
          title={`Enter Password to Restore Backup`}
          description={`Please enter the password you used when creating this backup file.`}
        />

        {/* Username Modal for Restore when no credentials exist */}
        <Dialog.Root
          open={needsUsernameForRestore}
          onOpenChange={(e: { open: boolean }) =>
            e.open
              ? null
              : (() => {
                  setNeedsUsernameForRestore(false)
                  setRestoreUsername('')
                  setSelectedBackupFile(null)
                  delete (window as any)._restorePassword
                  delete (window as any)._restoreBackup
                })()
          }
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content p={6}>
                <Dialog.Header>
                  <Dialog.Title>Choose Username for Restored Wallet</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body pt={4}>
                  <VStack gap={4}>
                    <Text fontSize="sm" color="gray.400">
                      No existing credentials found on this device. Please choose a username to
                      register your restored wallet with a new passkey.
                    </Text>
                    <Field invalid={isRestoreUsernameInvalid} label="Username">
                      <Input
                        id="restore-username-input"
                        aria-describedby={
                          isRestoreUsernameInvalid && restoreUsername.trim()
                            ? 'restore-username-error'
                            : undefined
                        }
                        placeholder="Enter your username"
                        value={restoreUsername}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setRestoreUsername(e.target.value)
                          setIsRestoreUsernameInvalid(false)
                        }}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleRestoreWithUsername()
                          }
                        }}
                        autoFocus
                        disabled={isRestoring}
                      />
                      {isRestoreUsernameInvalid && restoreUsername.trim() && (
                        <Text id="restore-username-error" fontSize="sm" color="red.400" mt={1}>
                          Username must be 3-50 characters, alphanumeric with underscores/hyphens,
                          and start/end with alphanumeric.
                        </Text>
                      )}
                    </Field>
                  </VStack>
                </Dialog.Body>
                <Dialog.Footer pt={4}>
                  <Dialog.CloseTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={isRestoring}
                      onClick={() => {
                        setNeedsUsernameForRestore(false)
                        setRestoreUsername('')
                        setSelectedBackupFile(null)
                        delete (window as any)._restorePassword
                        delete (window as any)._restoreBackup
                      }}
                    >
                      Cancel
                    </Button>
                  </Dialog.CloseTrigger>
                  <Button
                    bg={brandColors.primary}
                    color="white"
                    _hover={{ bg: brandColors.secondary }}
                    onClick={handleRestoreWithUsername}
                    loading={isRestoring}
                    loadingText="Restoring & Registering..."
                    disabled={isRestoring || !restoreUsername.trim()}
                  >
                    Restore & Register
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </>
    )
  }

  const handleGetBackupStatus = async () => {
    setIsCheckingStatus(true)
    setBackupStatus(null)
    try {
      const statusObject = await getBackupStatus()

      if (
        statusObject &&
        statusObject.securityScore &&
        typeof statusObject.securityScore.total === 'number'
      ) {
        const scoreValue = statusObject.securityScore.total
        const scoreLevel = statusObject.securityScore.level || 'unknown'
        const statusString = `Security Score: ${scoreValue}/100 (Level: ${scoreLevel})`
        setBackupStatus(statusString)
      } else {
        setBackupStatus('Error: Unexpected status data format.')
      }

      toaster.create({
        title: 'Backup Status Retrieved.',
        type: 'info',
        duration: 3000,
      })
    } catch (error) {
      toaster.create({
        title: 'Error retrieving status.',
        description: (error as Error).message || 'An unexpected error occurred.',
        type: 'error',
        duration: 5000,
      })
      setBackupStatus(null)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    try {
      setShowPasswordModal(true)
    } catch (error) {
      console.error('Error creating backup:', error)
      toaster.create({
        title: 'Error creating backup.',
        description: (error as Error).message || 'An unexpected error occurred.',
        type: 'error',
        duration: 5000,
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handlePasswordSubmit = async (password: string) => {
    setShowPasswordModal(false)

    try {
      const backupBlob = await createBackup(password)

      let fileExtension = '.json'
      let mimeType = 'application/json'

      try {
        const fullText = await backupBlob.text()
        JSON.parse(fullText)
        fileExtension = '.json'
        mimeType = 'application/json'

        const jsonBlob = new Blob([fullText], { type: mimeType })

        const link = document.createElement('a')
        link.href = URL.createObjectURL(jsonBlob)
        link.download = `w3pk_backup_${user?.username || 'user'}_${new Date().toISOString().slice(0, 10)}${fileExtension}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(backupBlob)
        link.download = `w3pk_backup_${user?.username || 'user'}_${new Date().toISOString().slice(0, 10)}${fileExtension}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      toaster.create({
        title: 'Backup Created Successfully!',
        type: 'success',
        duration: 3000,
      })
    } catch (error) {
      toaster.create({
        title: 'Error creating backup.',
        description: (error as Error).message || 'An unexpected error occurred.',
        type: 'error',
        duration: 5000,
      })
    }
  }

  const handleModalClose = () => {
    setShowPasswordModal(false)
  }

  const handleGenerateQRCode = () => {
    if (!user) return

    const syncData = {
      username: user.username,
      ethereumAddress: user.ethereumAddress,
      index0Address,
      mainAddress,
      openbarAddress,
      timestamp: new Date().toISOString(),
    }

    setQrCodeData(JSON.stringify(syncData))
    setShowQRCode(true)
  }

  const handlePasteQRData = (value: string) => {
    setPastedQRData(value)

    if (!value.trim()) {
      setParsedQRData(null)
      return
    }

    try {
      const parsed = JSON.parse(value)
      setParsedQRData(parsed)
    } catch (error) {
      setParsedQRData({ error: 'Invalid JSON format' })
    }
  }

  const handleAddGuardian = () => {
    if (!guardianName.trim()) {
      toaster.create({
        title: 'Invalid Input',
        description: 'Guardian name is required',
        type: 'error',
        duration: 3000,
      })
      return
    }

    setGuardiansList([
      ...guardiansList,
      { name: guardianName.trim(), email: guardianEmail.trim() || undefined },
    ])
    setGuardianName('')
    setGuardianEmail('')
  }

  const handleRemoveGuardian = (index: number) => {
    setGuardiansList(guardiansList.filter((_, i) => i !== index))
  }

  const handleSetupSocialRecovery = async () => {
    if (guardiansList.length < 2) {
      toaster.create({
        title: 'Not Enough Guardians',
        description: 'You need at least 2 guardians to set up social recovery',
        type: 'error',
        duration: 3000,
      })
      return
    }

    if (threshold > guardiansList.length) {
      toaster.create({
        title: 'Invalid Threshold',
        description: 'Threshold cannot be greater than number of guardians',
        type: 'error',
        duration: 3000,
      })
      return
    }

    try {
      const guardians = await setupSocialRecovery(guardiansList, threshold)
      const config = getSocialRecoveryConfig()
      setSocialRecoveryConfig(config)

      toaster.create({
        title: 'Social Recovery Configured!',
        description: `Successfully set up ${threshold}-of-${guardiansList.length} guardian recovery`,
        type: 'success',
        duration: 5000,
      })
    } catch (error) {
      console.error('Error setting up social recovery:', error)
    }
  }

  const handleGenerateInvite = async (guardian: any) => {
    try {
      const invite = await generateGuardianInvite(guardian)
      setSelectedGuardianForInvite(guardian)
      setGuardianInvite(invite)
    } catch (error) {
      console.error('Error generating guardian invite:', error)
    }
  }

  const handleDownloadInvite = () => {
    if (!guardianInvite) return

    const blob = new Blob([guardianInvite.explainer + '\n\n' + guardianInvite.shareCode], {
      type: 'text/plain',
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `guardian-invite-${selectedGuardianForInvite?.name || 'guardian'}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClearSocialRecovery = () => {
    clearSocialRecoveryConfig()
    setSocialRecoveryConfig(null)
  }

  const handleAddRecoveryShare = () => {
    if (!currentShareInput.trim()) {
      toaster.create({
        title: 'Invalid Input',
        description: 'Please paste a guardian share code',
        type: 'error',
        duration: 3000,
      })
      return
    }

    try {
      // Validate JSON format
      const parsed = JSON.parse(currentShareInput)
      if (!parsed.share || !parsed.guardianId) {
        throw new Error('Invalid share format')
      }

      // Check for duplicates
      const isDuplicate = recoveryShares.some(share => {
        const existingParsed = JSON.parse(share)
        return existingParsed.guardianId === parsed.guardianId
      })

      if (isDuplicate) {
        toaster.create({
          title: 'Duplicate Share',
          description: 'This guardian share has already been added',
          type: 'warning',
          duration: 3000,
        })
        return
      }

      setRecoveryShares([...recoveryShares, currentShareInput])
      setCurrentShareInput('')

      toaster.create({
        title: 'Share Added',
        description: `Added share from ${parsed.guardianName || 'guardian'}`,
        type: 'success',
        duration: 2000,
      })
    } catch (error) {
      toaster.create({
        title: 'Invalid Share Format',
        description: 'Please paste a valid guardian share code (JSON format)',
        type: 'error',
        duration: 3000,
      })
    }
  }

  const handleRemoveRecoveryShare = (index: number) => {
    setRecoveryShares(recoveryShares.filter((_, i) => i !== index))
  }

  const handleRecoverWallet = async () => {
    if (recoveryShares.length < 2) {
      toaster.create({
        title: 'Not Enough Shares',
        description: 'You need at least 2 guardian shares to recover your wallet',
        type: 'error',
        duration: 3000,
      })
      return
    }

    setIsRecovering(true)
    try {
      const result = await recoverFromGuardians(recoveryShares)

      toaster.create({
        title: 'Wallet Recovered Successfully!',
        description: `Your wallet has been recovered: ${result.ethereumAddress.slice(0, 6)}...${result.ethereumAddress.slice(-4)}`,
        type: 'success',
        duration: 5000,
      })

      // Clear recovery state
      setRecoveryShares([])
      setCurrentShareInput('')
      setShowRecoverySection(false)
    } catch (error) {
      console.error('Recovery error:', error)
      // Error toast already shown in recoverFromGuardians
    } finally {
      setIsRecovering(false)
    }
  }

  const handleUploadShareFile = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.txt,.json'
    fileInput.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      try {
        const textContent = await file.text()

        // Try to extract JSON from the file
        // Guardian files contain both explainer text and JSON
        const jsonMatch = textContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          setCurrentShareInput(jsonMatch[0])
        } else {
          setCurrentShareInput(textContent)
        }

        toaster.create({
          title: 'File Loaded',
          description: 'Guardian share loaded from file. Click "Add Share" to add it.',
          type: 'info',
          duration: 3000,
        })
      } catch (error) {
        toaster.create({
          title: 'Error reading file',
          description: (error as Error).message || 'Failed to read guardian share file',
          type: 'error',
          duration: 3000,
        })
      }
    }
    fileInput.click()
  }

  const handleSaveQRDataToStorage = async () => {
    if (!parsedQRData || parsedQRData.error || !user) {
      toaster.create({
        title: 'Cannot save',
        description: 'Invalid QR data or user not authenticated',
        type: 'error',
        duration: 3000,
      })
      return
    }

    try {
      // Create a wallet sync record
      const syncRecord = {
        passkeyUser: {
          username: user.username,
          ethereumAddress: user.ethereumAddress,
        },
        linkedWallet: {
          username: parsedQRData.username,
          ethereumAddress: parsedQRData.ethereumAddress,
          index0Address: parsedQRData.index0Address,
          mainAddress: parsedQRData.mainAddress,
          openbarAddress: parsedQRData.openbarAddress,
        },
        linkedAt: new Date().toISOString(),
        syncedFrom: parsedQRData.timestamp,
      }

      // Save to localStorage
      const storageKey = `w3pk_wallet_sync_${user.ethereumAddress}`
      localStorage.setItem(storageKey, JSON.stringify(syncRecord))

      // Save to IndexedDB
      const dbName = 'w3pk-wallet-sync'
      const request = indexedDB.open(dbName, 1)

      request.onerror = () => {
        throw new Error('Failed to open IndexedDB')
      }

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('walletLinks')) {
          db.createObjectStore('walletLinks', { keyPath: 'passkeyAddress' })
        }
      }

      request.onsuccess = event => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(['walletLinks'], 'readwrite')
        const store = transaction.objectStore('walletLinks')

        const dbRecord = {
          passkeyAddress: user.ethereumAddress,
          ...syncRecord,
        }

        store.put(dbRecord)

        transaction.oncomplete = () => {
          toaster.create({
            title: 'Wallet Linked Successfully!',
            description: `Linked wallet ${parsedQRData.ethereumAddress.slice(0, 6)}...${parsedQRData.ethereumAddress.slice(-4)} to your passkey account`,
            type: 'success',
            duration: 5000,
          })

          // Clear the pasted data
          setPastedQRData('')
          setParsedQRData(null)
        }

        transaction.onerror = () => {
          throw new Error('Failed to save to IndexedDB')
        }
      }
    } catch (error) {
      console.error('Error saving QR data:', error)
      toaster.create({
        title: 'Error saving wallet link',
        description: (error as Error).message || 'Failed to save wallet sync data',
        type: 'error',
        duration: 5000,
      })
    }
  }

  return (
    <>
      <VStack gap={8} align="stretch" py={20}>
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={4}>
            {t.settings.title}
          </Heading>
          <Text fontSize="xl" color="gray.400" maxW="2xl" mx="auto">
            Manage your accounts, backups, and recovery options
          </Text>
        </Box>

        <TabsRoot colorPalette="gray" variant="plain" size="md" defaultValue="accounts">
          <TabsList
            bg="transparent"
            p={0}
            borderRadius="none"
            gap={0}
            border="none"
            borderBottom="1px solid"
            borderColor="gray.800"
            flexWrap={{ base: 'wrap', md: 'nowrap' }}
          >
            <TabsTrigger
              value="accounts"
              px={{ base: 4, md: 5 }}
              py={3}
              borderRadius="none"
              fontWeight="normal"
              transition="all 0.2s"
              fontSize={{ base: 'sm', md: 'sm' }}
              color="gray.500"
              position="relative"
              _selected={{
                color: 'white',
                fontWeight: 'medium',
                _after: {
                  content: '""',
                  position: 'absolute',
                  bottom: '-1px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  bg: brandColors.primary,
                },
              }}
              _hover={{
                color: 'gray.300',
              }}
            >
              Accounts
            </TabsTrigger>
            <TabsTrigger
              value="backup"
              px={{ base: 4, md: 5 }}
              py={3}
              borderRadius="none"
              fontWeight="normal"
              transition="all 0.2s"
              fontSize={{ base: 'sm', md: 'sm' }}
              color="gray.500"
              position="relative"
              _selected={{
                color: 'white',
                fontWeight: 'medium',
                _after: {
                  content: '""',
                  position: 'absolute',
                  bottom: '-1px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  bg: brandColors.primary,
                },
              }}
              _hover={{
                color: 'gray.300',
              }}
            >
              Backup
            </TabsTrigger>
            <TabsTrigger
              value="sync"
              px={{ base: 4, md: 5 }}
              py={3}
              borderRadius="none"
              fontWeight="normal"
              transition="all 0.2s"
              fontSize={{ base: 'sm', md: 'sm' }}
              color="gray.500"
              position="relative"
              _selected={{
                color: 'white',
                fontWeight: 'medium',
                _after: {
                  content: '""',
                  position: 'absolute',
                  bottom: '-1px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  bg: brandColors.primary,
                },
              }}
              _hover={{
                color: 'gray.300',
              }}
            >
              Sync
            </TabsTrigger>
            <TabsTrigger
              value="recovery"
              px={{ base: 4, md: 5 }}
              py={3}
              borderRadius="none"
              fontWeight="normal"
              transition="all 0.2s"
              fontSize={{ base: 'sm', md: 'sm' }}
              color="gray.500"
              position="relative"
              _selected={{
                color: 'white',
                fontWeight: 'medium',
                _after: {
                  content: '""',
                  position: 'absolute',
                  bottom: '-1px',
                  left: 0,
                  right: 0,
                  height: '2px',
                  bg: brandColors.primary,
                },
              }}
              _hover={{
                color: 'gray.300',
              }}
            >
              Social recovery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" pt={8}>
            <VStack gap={6} align="stretch">
              <Box>
                <Heading as="h2" size="lg" mb={4}>
                  Current account
                </Heading>
                <Text fontSize="md" color="gray.400" mb={6}>
                  This is your currently logged-in account.
                </Text>
              </Box>

              {accounts.length === 0 ? (
                <Box
                  bg="gray.900"
                  p={8}
                  borderRadius="lg"
                  textAlign="center"
                  border="1px solid"
                  borderColor="gray.700"
                >
                  <Text color="gray.400">No accounts found on this device.</Text>
                </Box>
              ) : (
                accounts.map(account => (
                  <Box
                    key={account.ethereumAddress}
                    bg="gray.900"
                    p={6}
                    borderRadius="lg"
                    border={
                      user?.ethereumAddress === account.ethereumAddress
                        ? `2px solid ${brandColors.primary}`
                        : '1px solid'
                    }
                    borderColor={
                      user?.ethereumAddress === account.ethereumAddress
                        ? brandColors.primary
                        : 'gray.700'
                    }
                  >
                    <HStack justify="space-between" align="start">
                      <Box flex={1} minW={0}>
                        <HStack mb={3}>
                          <Text fontSize="lg" fontWeight="bold" color="white">
                            {account.displayName || account.username}
                          </Text>
                          {user?.ethereumAddress === account.ethereumAddress && (
                            <Badge colorPalette="purple">Current</Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" color="gray.400" mb={2}>
                          Username: {account.username}
                        </Text>
                        <Code
                          fontSize="xs"
                          bg="gray.800"
                          color="gray.300"
                          p={2}
                          borderRadius="md"
                          display="block"
                          wordBreak="break-all"
                          overflowWrap="break-word"
                        >
                          {account.ethereumAddress}
                        </Code>
                      </Box>
                      <IconButton
                        aria-label="Delete account"
                        colorPalette="red"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAccount(account)}
                        flexShrink={0}
                      >
                        <MdDelete />
                      </IconButton>
                    </HStack>
                  </Box>
                ))
              )}

              {/* Keep my session alive */}
              <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <HStack mb={4}>
                  <Icon as={FiClock} color={brandColors.primary} boxSize={6} />
                  <Heading size="md">Keep my session alive</Heading>
                </HStack>
                <Text fontSize="sm" color="gray.400" mb={6}>
                  Set how long your session should stay active. The duration timer resets every time
                  you log in. This setting applies to STANDARD and YOLO modes only. STRICT and
                  PRIMARY modes always require fresh authentication and do not use persistent
                  sessions.
                </Text>
                <SliderRoot
                  value={[persistentSessionDays]}
                  onValueChange={handleSessionDurationChange}
                  min={1}
                  max={30}
                  step={1}
                  width="full"
                >
                  <HStack justify="space-between" mb={2}>
                    <SliderLabel fontSize="sm" fontWeight="medium">
                      Session Duration
                    </SliderLabel>
                    <SliderValueText fontSize="sm" fontWeight="bold" color={brandColors.accent}>
                      {persistentSessionDays} day{persistentSessionDays > 1 ? 's' : ''}
                    </SliderValueText>
                  </HStack>
                  <SliderControl>
                    <SliderTrack bg="gray.700" height="8px">
                      <SliderRange bg={brandColors.primary} />
                    </SliderTrack>
                    <SliderThumb
                      index={0}
                      boxSize="20px"
                      bg={brandColors.accent}
                      border="3px solid"
                      borderColor="gray.800"
                      _focus={{ boxShadow: `0 0 0 3px ${brandColors.primary}40` }}
                    />
                  </SliderControl>
                </SliderRoot>
                <HStack justify="space-between" mt={2} fontSize="xs" color="gray.500">
                  <Text>1 day</Text>
                  <Text>30 days</Text>
                </HStack>
                <Box p={3} bg="blue.900/90" borderRadius="md" mt={4}>
                  <Text fontSize="xs" color="gray.300">
                    <strong>How it works:</strong> Your session is encrypted with your WebAuthn
                    credentials and stored securely in IndexedDB. The countdown starts fresh each
                    time you log in. For example, with a 7-day duration, if you log in today, your
                    session will expire 7 days from today.
                  </Text>
                </Box>
              </Box>

              {/* Register a new account */}
              {/* <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <HStack mb={4}>
                  <Icon as={FiUserPlus} color={brandColors.primary} boxSize={6} />
                  <Heading size="md">Register a new account</Heading>
                </HStack>
                <Text fontSize="sm" color="gray.400" mb={4}>
                  Create a new Web3 passkey account. Each account is secured with your device&apos;s
                  biometric authentication or PIN, and has its own Ethereum wallet.
                </Text>
                <Button
                  bg={brandColors.primary}
                  color="white"
                  _hover={{
                    bg: brandColors.secondary,
                  }}
                  onClick={onRegisterModalOpen}
                  width="full"
                >
                  <Icon as={FiUserPlus} />
                  Register
                </Button>
              </Box> */}

              {/* W3PK Build Verification */}
              <BuildVerification />
            </VStack>
          </TabsContent>

          <TabsContent value="backup" pt={8}>
            <VStack gap={8} align="stretch">
              {/* Header */}
              <Box>
                <Heading size="lg" mb={4}>
                  Wallet Backup
                </Heading>
                <Text color="gray.400" mb={6}>
                  Create encrypted backups of your wallet to ensure you never lose access
                </Text>
              </Box>

              {/* Current User Info */}
              <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <HStack mb={4}>
                  <Icon as={FiShield} color={brandColors.primary} boxSize={6} />
                  <Heading size="md">Current Account</Heading>
                </HStack>
                <VStack align="stretch" gap={3}>
                  <HStack>
                    <Text fontSize="sm" color="gray.400">
                      Logged in as:
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color="white">
                      {user?.displayName || user?.username}
                    </Text>
                  </HStack>

                  {isLoadingAddresses ? (
                    <HStack justify="center" py={2}>
                      <Spinner size="sm" />
                      <Text fontSize="xs" color="gray.400">
                        Loading addresses...
                      </Text>
                    </HStack>
                  ) : (
                    <>
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={1}>
                          Index #0 address:
                        </Text>
                        <Code
                          fontSize="xs"
                          bg="gray.800"
                          color="gray.300"
                          px={2}
                          py={1}
                          display="block"
                          wordBreak="break-all"
                        >
                          {index0Address || 'Loading...'}
                        </Code>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={1}>
                          Origin-specific, STANDARD mode, MAIN-tagged address (default wallet):
                        </Text>
                        <Code
                          fontSize="xs"
                          bg="gray.800"
                          color="gray.300"
                          px={2}
                          py={1}
                          display="block"
                          wordBreak="break-all"
                        >
                          {mainAddress || 'Loading...'}
                        </Code>
                      </Box>
                    </>
                  )}
                </VStack>
              </Box>

              {/* Security Score */}
              <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <HStack mb={4}>
                  <Icon as={FiCheckCircle} color={brandColors.primary} boxSize={6} />
                  <Heading size="md">Security Status</Heading>
                </HStack>
                {isCheckingStatus ? (
                  <HStack justify="center" py={4}>
                    <Spinner size="sm" />
                    <Text color="gray.400" fontSize="sm">
                      Checking backup status...
                    </Text>
                  </HStack>
                ) : (
                  <Text color="gray.300" fontSize="lg">
                    {backupStatus || 'Loading...'}
                  </Text>
                )}
              </Box>

              <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{ borderColor: brandColors.primary, transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Icon as={MdInfo} color={brandColors.primary} boxSize={6} mb={3} />
                  <Heading size="sm" mb={3}>
                    Refresh Backup Status
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    Reload your current security score and backup recommendations
                  </Text>
                  <Button
                    bg={brandColors.primary}
                    color="white"
                    _hover={{ bg: brandColors.secondary }}
                    onClick={handleGetBackupStatus}
                    loading={isCheckingStatus}
                    spinner={<Spinner size="50px" />}
                    loadingText="Checking..."
                    disabled={isCheckingStatus || isCreatingBackup || isRestoring}
                    width="full"
                  >
                    Refresh Status
                  </Button>
                </Box>

                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{ borderColor: brandColors.primary, transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Icon as={MdDownload} color={brandColors.primary} boxSize={6} mb={3} />
                  <Heading size="sm" mb={3}>
                    Create Backup
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    Download an encrypted backup file protected by your password
                  </Text>
                  <Button
                    bg={brandColors.primary}
                    color="white"
                    _hover={{ bg: brandColors.secondary }}
                    onClick={handleCreateBackup}
                    loading={isCreatingBackup}
                    spinner={<Spinner size="50px" />}
                    loadingText="Creating..."
                    disabled={isCheckingStatus || isCreatingBackup || isRestoring}
                    width="full"
                  >
                    Create Backup
                  </Button>
                </Box>

                <Box
                  bg="gray.900"
                  p={6}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{ borderColor: brandColors.primary, transform: 'translateY(-2px)' }}
                  transition="all 0.2s"
                >
                  <Icon as={FiUpload} color={brandColors.primary} boxSize={6} mb={3} />
                  <Heading size="sm" mb={3}>
                    Restore from Backup
                  </Heading>
                  <Text fontSize="sm" color="gray.400" mb={4}>
                    Restore your wallet from an encrypted backup file &nbsp;
                  </Text>
                  <Button
                    bg={brandColors.primary}
                    color="white"
                    _hover={{ bg: brandColors.secondary }}
                    onClick={handleRestoreBackup}
                    loading={isRestoring}
                    spinner={<Spinner size="50px" />}
                    loadingText="Restoring..."
                    disabled={isCheckingStatus || isCreatingBackup || isRestoring}
                    width="full"
                  >
                    Restore Backup
                  </Button>
                </Box>
              </SimpleGrid>

              <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <Heading size="sm" mb={4} color={brandColors.primary}>
                  About Client-Side Backup
                </Heading>
                <VStack align="stretch" gap={3} fontSize="sm" color="gray.400">
                  <Text>
                    Your wallet&apos;s core secret (the mnemonic phrase) is generated and encrypted
                    entirely on your device. The backup process retrieves this encrypted data from
                    your browser&apos;s local storage using your password, then packages it into a
                    secure file for you to download.
                  </Text>
                  <Text>
                    The encryption key for your wallet is derived using a WebAuthn signature, which
                    requires your biometric authentication (fingerprint, face scan) or device PIN.
                    This means even if someone gains access to the encrypted data stored in your
                    browser, they cannot decrypt it without your physical device and authentication.
                  </Text>
                  <Text>
                    Your backup file is encrypted using AES-256-GCM with a key derived from the
                    password you provide. Store this file securely and remember your password.
                  </Text>
                  <Box p={4} bg="yellow.900/90" mt={2}>
                    <Text fontSize="xs">
                      If you lose access to your device, passkey, AND the backup file/password, your
                      wallet cannot be recovered.
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </VStack>
          </TabsContent>

          <TabsContent value="recovery" pt={8}>
            <VStack gap={8} align="stretch">
              <Box>
                <Heading size="lg" mb={4}>
                  Social Recovery
                </Heading>
                <Text color="gray.400" mb={6}>
                  Distribute your wallet recovery among trusted guardians using Shamir Secret
                  Sharing
                </Text>
              </Box>

              <SimpleGrid columns={{ base: 1 }} gap={6}>
                {!socialRecoveryConfig ? (
                  <>
                    {/* Setup Social Recovery */}
                    <Box
                      bg="gray.900"
                      p={6}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.700"
                    >
                      <HStack mb={4}>
                        <Icon as={FiShield} color={brandColors.primary} boxSize={6} />
                        <Heading size="md">Setup Social Recovery</Heading>
                      </HStack>
                      <Text fontSize="sm" color="gray.400" mb={6}>
                        Add trusted guardians who will help you recover your wallet. You&apos;ll
                        need {threshold} out of {guardiansList.length || '?'} guardians to recover.
                      </Text>

                      {/* Add Guardian Form */}
                      <VStack align="stretch" gap={4} mb={6}>
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" mb={2}>
                            Guardian Name *
                          </Text>
                          <input
                            type="text"
                            value={guardianName}
                            onChange={e => setGuardianName(e.target.value)}
                            placeholder="Julien"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #4A5568',
                              background: '#1A202C',
                              color: 'white',
                              fontSize: '14px',
                            }}
                          />
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" mb={2}>
                            Guardian Email (Optional)
                          </Text>
                          <input
                            type="email"
                            value={guardianEmail}
                            onChange={e => setGuardianEmail(e.target.value)}
                            placeholder="julien@strat.cc"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #4A5568',
                              background: '#1A202C',
                              color: 'white',
                              fontSize: '14px',
                            }}
                          />
                        </Box>
                        <Button
                          onClick={handleAddGuardian}
                          colorPalette="purple"
                          size="sm"
                          width="fit-content"
                        >
                          Add Guardian
                        </Button>
                      </VStack>

                      {/* Guardians List */}
                      {guardiansList.length > 0 && (
                        <Box mb={6}>
                          <Text fontSize="sm" fontWeight="medium" mb={3}>
                            Guardians ({guardiansList.length})
                          </Text>
                          <VStack align="stretch" gap={2}>
                            {guardiansList.map((guardian, index) => (
                              <Box
                                key={index}
                                p={3}
                                bg="gray.950"
                                borderRadius="md"
                                border="1px solid"
                                borderColor="gray.800"
                              >
                                <HStack justify="space-between">
                                  <Box>
                                    <Text fontSize="sm" fontWeight="bold">
                                      {guardian.name}
                                    </Text>
                                    {guardian.email && (
                                      <Text fontSize="xs" color="gray.400">
                                        {guardian.email}
                                      </Text>
                                    )}
                                  </Box>
                                  <IconButton
                                    aria-label="Remove guardian"
                                    size="xs"
                                    colorPalette="red"
                                    variant="ghost"
                                    onClick={() => handleRemoveGuardian(index)}
                                  >
                                    <MdDelete />
                                  </IconButton>
                                </HStack>
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      )}

                      {/* Threshold Selector */}
                      {guardiansList.length >= 2 && (
                        <Box mb={6}>
                          <Text fontSize="sm" fontWeight="medium" mb={2}>
                            Recovery Threshold: {threshold} of {guardiansList.length}
                          </Text>
                          <Text fontSize="xs" color="gray.400" mb={3}>
                            Number of guardians needed to recover your wallet
                          </Text>
                          <input
                            type="range"
                            min="2"
                            max={guardiansList.length}
                            value={threshold}
                            onChange={e => setThreshold(parseInt(e.target.value))}
                            style={{ width: '100%' }}
                          />
                        </Box>
                      )}

                      {/* Setup Button */}
                      <Button
                        onClick={handleSetupSocialRecovery}
                        bg={brandColors.primary}
                        color="white"
                        _hover={{ bg: brandColors.secondary }}
                        disabled={guardiansList.length < 2}
                        width="full"
                      >
                        Setup Social Recovery ({threshold}-of-{guardiansList.length || '?'})
                      </Button>
                    </Box>

                    {/* Info Box */}
                    <Box p={4} bg="blue.900/90" borderRadius="lg">
                      <Text fontSize="sm">
                        <strong>How it works:</strong> Your wallet recovery will be split into{' '}
                        {guardiansList.length || '?'} encrypted shares using Shamir Secret Sharing.
                        You&apos;ll need {threshold} guardians to combine their shares to recover
                        your wallet. No single guardian can access your wallet alone.
                      </Text>
                    </Box>

                    {/* Recover Wallet Section */}
                    <Box
                      bg="gray.900"
                      p={6}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="orange.700"
                    >
                      <HStack mb={4} justify="space-between">
                        <HStack>
                          <Icon as={FiKey} color="orange.400" boxSize={6} />
                          <Heading size="md">Recover Wallet</Heading>
                        </HStack>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowRecoverySection(!showRecoverySection)}
                        >
                          {showRecoverySection ? 'Hide' : 'Show'}
                        </Button>
                      </HStack>

                      {showRecoverySection && (
                        <VStack align="stretch" gap={4}>
                          <Text fontSize="sm" color="gray.400">
                            Lost access to your wallet? Collect guardian shares to recover it.
                          </Text>

                          {/* Share Input */}
                          <Box>
                            <Text fontSize="sm" fontWeight="medium" mb={2}>
                              Guardian Share Code
                            </Text>
                            <Textarea
                              placeholder='Paste guardian share JSON here (e.g., {"guardianId":"...","share":"..."})'
                              value={currentShareInput}
                              onChange={e => setCurrentShareInput(e.target.value)}
                              minH="100px"
                              fontFamily="monospace"
                              fontSize="sm"
                              bg="gray.950"
                              borderColor="gray.700"
                              _focus={{ borderColor: brandColors.primary }}
                            />
                          </Box>

                          {/* Action Buttons */}
                          <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                            <Button
                              onClick={handleAddRecoveryShare}
                              colorPalette="purple"
                              size="sm"
                            >
                              Add Share
                            </Button>
                            <Button
                              onClick={handleUploadShareFile}
                              variant="outline"
                              colorPalette="purple"
                              size="sm"
                            >
                              <Icon as={FiUpload} mr={2} />
                              Upload File
                            </Button>
                            <Button
                              onClick={() => {
                                setRecoveryShares([])
                                setCurrentShareInput('')
                              }}
                              variant="outline"
                              colorPalette="gray"
                              size="sm"
                            >
                              Clear All
                            </Button>
                          </SimpleGrid>

                          {/* Collected Shares List */}
                          {recoveryShares.length > 0 && (
                            <Box>
                              <Text fontSize="sm" fontWeight="medium" mb={3}>
                                Collected Shares ({recoveryShares.length})
                              </Text>
                              <VStack align="stretch" gap={2}>
                                {recoveryShares.map((share, index) => {
                                  try {
                                    const parsed = JSON.parse(share)
                                    return (
                                      <Box
                                        key={index}
                                        p={3}
                                        bg="gray.950"
                                        borderRadius="md"
                                        border="1px solid"
                                        borderColor="purple.800"
                                      >
                                        <HStack justify="space-between">
                                          <Box>
                                            <Text fontSize="sm" fontWeight="bold">
                                              {parsed.guardianName || 'Guardian'} (#
                                              {parsed.guardianIndex || index + 1})
                                            </Text>
                                            <Text fontSize="xs" color="gray.400">
                                              Added {new Date().toLocaleTimeString()}
                                            </Text>
                                          </Box>
                                          <IconButton
                                            aria-label="Remove share"
                                            size="xs"
                                            colorPalette="red"
                                            variant="ghost"
                                            onClick={() => handleRemoveRecoveryShare(index)}
                                          >
                                            <MdDelete />
                                          </IconButton>
                                        </HStack>
                                      </Box>
                                    )
                                  } catch {
                                    return (
                                      <Box
                                        key={index}
                                        p={3}
                                        bg="gray.950"
                                        borderRadius="md"
                                        border="1px solid"
                                        borderColor="red.800"
                                      >
                                        <HStack justify="space-between">
                                          <Text fontSize="sm" color="red.300">
                                            Invalid share #{index + 1}
                                          </Text>
                                          <IconButton
                                            aria-label="Remove share"
                                            size="xs"
                                            colorPalette="red"
                                            variant="ghost"
                                            onClick={() => handleRemoveRecoveryShare(index)}
                                          >
                                            <MdDelete />
                                          </IconButton>
                                        </HStack>
                                      </Box>
                                    )
                                  }
                                })}
                              </VStack>
                            </Box>
                          )}

                          {/* Recovery Progress */}
                          {recoveryShares.length > 0 && (
                            <Box p={4} bg="purple.900/50" borderRadius="lg">
                              <Text fontSize="sm" fontWeight="medium" mb={2}>
                                Recovery Progress
                              </Text>
                              <Text fontSize="xs" color="gray.300">
                                {recoveryShares.length} share(s) collected. You need at least 2
                                shares to attempt recovery.
                              </Text>
                            </Box>
                          )}

                          {/* Recover Button */}
                          <Button
                            onClick={handleRecoverWallet}
                            bg="orange.500"
                            color="white"
                            _hover={{ bg: 'orange.600' }}
                            disabled={recoveryShares.length < 2 || isRecovering}
                            loading={isRecovering}
                            spinner={<Spinner size="50px" />}
                            loadingText="Recovering..."
                            width="full"
                            size="lg"
                          >
                            <Icon as={FiKey} mr={2} />
                            Recover Wallet ({recoveryShares.length} shares)
                          </Button>

                          {/* Warning */}
                          <Box p={3} bg="yellow.900/90" borderRadius="md">
                            <Text fontSize="xs" color="gray.300">
                              <strong>Important:</strong> Make sure the shares are from the correct
                              guardians. Invalid shares will cause recovery to fail.
                            </Text>
                          </Box>
                        </VStack>
                      )}
                    </Box>
                  </>
                ) : (
                  <>
                    {/* Social Recovery Configured */}
                    <Box
                      bg="gray.900"
                      p={6}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="green.700"
                    >
                      <HStack mb={4}>
                        <Icon as={MdCheckCircle} color="green.400" boxSize={6} />
                        <Heading size="md">Social Recovery Active</Heading>
                      </HStack>
                      <Text fontSize="sm" color="gray.400" mb={4}>
                        Your wallet is protected with {socialRecoveryConfig.threshold}-of-
                        {socialRecoveryConfig.totalGuardians} guardian recovery
                      </Text>

                      {/* Guardians List */}
                      <VStack align="stretch" gap={3} mb={4}>
                        {socialRecoveryConfig.guardians.map((guardian: any, index: number) => (
                          <Box
                            key={guardian.id}
                            p={4}
                            bg="gray.950"
                            borderRadius="md"
                            border="1px solid"
                            borderColor="gray.800"
                          >
                            <HStack justify="space-between" mb={2}>
                              <Box>
                                <HStack>
                                  <Text fontSize="sm" fontWeight="bold">
                                    {guardian.name}
                                  </Text>
                                  <Badge
                                    colorPalette={
                                      guardian.status === 'active'
                                        ? 'green'
                                        : guardian.status === 'pending'
                                          ? 'yellow'
                                          : 'gray'
                                    }
                                    fontSize="xs"
                                  >
                                    {guardian.status}
                                  </Badge>
                                </HStack>
                                {guardian.email && (
                                  <Text fontSize="xs" color="gray.400">
                                    {guardian.email}
                                  </Text>
                                )}
                              </Box>
                              <Button
                                size="xs"
                                onClick={() => handleGenerateInvite(guardian)}
                                colorPalette="purple"
                                px={4}
                                flexShrink={0}
                              >
                                Generate Invite
                              </Button>
                            </HStack>
                          </Box>
                        ))}
                      </VStack>

                      {/* Clear Local Storage Button */}
                      <Box p={4} bg="blue.900/90" borderRadius="lg">
                        <VStack gap={3} align="stretch">
                          <Text fontSize="sm" color="gray.300">
                            <strong>All guardians have their shares?</strong> You can now remove the
                            guardian configuration from local storage. The shares are safely stored
                            with your guardians and can be used for recovery anytime.
                          </Text>
                          <Button
                            onClick={handleClearSocialRecovery}
                            colorPalette="red"
                            variant="outline"
                            width="full"
                            size="sm"
                          >
                            Clear Guardian Config from Local Storage
                          </Button>
                        </VStack>
                      </Box>
                    </Box>

                    {/* Guardian Invite Modal Content */}
                    {guardianInvite && (
                      <Box
                        bg="gray.900"
                        p={6}
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="purple.700"
                      >
                        <HStack justify="space-between" mb={4}>
                          <Heading size="md">Guardian Invitation</Heading>
                          <CloseButton onClick={() => setGuardianInvite(null)} />
                        </HStack>

                        {/* QR Code */}
                        <Box
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                          p={4}
                          bg="white"
                          borderRadius="lg"
                          width="fit-content"
                          mx="auto"
                          mb={4}
                        >
                          <QRCodeSVG
                            value={guardianInvite.shareCode}
                            size={256}
                            level="H"
                            marginSize={4}
                          />
                        </Box>

                        {/* Actions */}
                        <VStack gap={3}>
                          <Button
                            onClick={handleDownloadInvite}
                            bg={brandColors.primary}
                            color="white"
                            _hover={{ bg: brandColors.secondary }}
                            width="full"
                          >
                            <Icon as={FiDownload} mr={2} />
                            Download Invitation
                          </Button>
                          <Text fontSize="xs" color="gray.400" textAlign="center">
                            Send this invitation to{' '}
                            <strong>{selectedGuardianForInvite?.name}</strong> via a secure channel
                          </Text>
                        </VStack>
                      </Box>
                    )}
                  </>
                )}
              </SimpleGrid>
            </VStack>
          </TabsContent>

          <TabsContent value="sync" pt={8}>
            <VStack gap={8} align="stretch">
              <Box>
                <Heading size="lg" mb={4}>
                  Device Sync
                </Heading>
                <Text color="gray.400" mb={6}>
                  Your passkey automatically syncs across devices using platform services
                </Text>
              </Box>

              {/* QR Code Section */}
              <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <HStack mb={4} justify="space-between">
                  <HStack>
                    <Icon as={FiKey} color={brandColors.primary} boxSize={6} />
                    <Heading size="md">Sync QR Code</Heading>
                  </HStack>
                </HStack>
                <Text fontSize="sm" color="gray.400" mb={4}>
                  Generate a QR code containing your wallet addresses to easily sync or verify your
                  account information on another device.
                </Text>

                {!showQRCode ? (
                  <Button
                    bg={brandColors.primary}
                    color="white"
                    _hover={{ bg: brandColors.secondary }}
                    onClick={handleGenerateQRCode}
                    disabled={!index0Address || !mainAddress}
                    width="full"
                  >
                    Generate Sync QR Code
                  </Button>
                ) : (
                  <VStack gap={4} align="stretch">
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      p={4}
                      bg="white"
                      borderRadius="lg"
                      width="fit-content"
                      mx="auto"
                    >
                      <QRCodeSVG value={qrCodeData} size={256} level="H" marginSize={4} />
                    </Box>
                    <Box p={4} bg="yellow.900/90" borderRadius="md">
                      <Text fontSize="xs" color="gray.300">
                        <strong>Note:</strong> This QR code contains your public wallet addresses
                        only. It does NOT contain your private keys or recovery phrase. Use it to
                        verify your account on another device.
                      </Text>
                    </Box>
                    <Button variant="outline" onClick={() => setShowQRCode(false)} width="full">
                      Hide QR Code
                    </Button>
                  </VStack>
                )}
              </Box>

              {/* Paste QR Data Section */}
              <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <HStack mb={4}>
                  <Icon as={FiCloud} color={brandColors.primary} boxSize={6} />
                  <Heading size="md">Verify QR Code Data</Heading>
                </HStack>
                <Text fontSize="sm" color="gray.400" mb={4}>
                  Paste the JSON string from a scanned QR code to verify the wallet addresses.
                </Text>

                <VStack gap={4} align="stretch">
                  <Textarea
                    placeholder='Paste JSON data here (e.g., {"username":"...","ethereumAddress":"..."})'
                    value={pastedQRData}
                    onChange={e => handlePasteQRData(e.target.value)}
                    minH="120px"
                    fontFamily="monospace"
                    fontSize="sm"
                    bg="gray.950"
                    borderColor="gray.700"
                    _focus={{ borderColor: brandColors.primary }}
                    p={3}
                  />

                  {parsedQRData && (
                    <VStack gap={3} align="stretch">
                      <Box
                        p={4}
                        bg={parsedQRData.error ? 'red.900/90' : 'gray.950'}
                        borderRadius="md"
                        border="1px solid"
                        borderColor={parsedQRData.error ? 'red.700' : 'gray.800'}
                      >
                        {parsedQRData.error ? (
                          <Text fontSize="sm" color="red.300">
                            <strong>Error:</strong> {parsedQRData.error}
                          </Text>
                        ) : (
                          <VStack align="stretch" gap={2}>
                            <Text fontSize="sm" fontWeight="bold" color="white" mb={2}>
                              Parsed Data:
                            </Text>
                            {parsedQRData.username && (
                              <HStack>
                                <Text fontSize="xs" color="gray.400" width="140px">
                                  Username:
                                </Text>
                                <Text fontSize="xs" color="white" fontWeight="medium">
                                  {parsedQRData.username}
                                </Text>
                              </HStack>
                            )}
                            {parsedQRData.ethereumAddress && (
                              <HStack>
                                <Text fontSize="xs" color="gray.400" width="140px">
                                  Ethereum Address:
                                </Text>
                                <Code
                                  fontSize="xs"
                                  bg="gray.900"
                                  color="gray.300"
                                  p={1}
                                  borderRadius="sm"
                                >
                                  {parsedQRData.ethereumAddress}
                                </Code>
                              </HStack>
                            )}
                            {parsedQRData.index0Address && (
                              <HStack>
                                <Text fontSize="xs" color="gray.400" width="140px">
                                  Index #0:
                                </Text>
                                <Code
                                  fontSize="xs"
                                  bg="gray.900"
                                  color="gray.300"
                                  p={1}
                                  borderRadius="sm"
                                >
                                  {parsedQRData.index0Address}
                                </Code>
                              </HStack>
                            )}
                            {parsedQRData.mainAddress && (
                              <HStack>
                                <Text fontSize="xs" color="gray.400" width="140px">
                                  MAIN-tagged:
                                </Text>
                                <Code
                                  fontSize="xs"
                                  bg="gray.900"
                                  color="gray.300"
                                  p={1}
                                  borderRadius="sm"
                                >
                                  {parsedQRData.mainAddress}
                                </Code>
                              </HStack>
                            )}
                            {parsedQRData.openbarAddress && (
                              <HStack>
                                <Text fontSize="xs" color="gray.400" width="140px">
                                  OPENBAR-tagged:
                                </Text>
                                <Code
                                  fontSize="xs"
                                  bg="gray.900"
                                  color="gray.300"
                                  p={1}
                                  borderRadius="sm"
                                >
                                  {parsedQRData.openbarAddress}
                                </Code>
                              </HStack>
                            )}
                            {parsedQRData.timestamp && (
                              <HStack>
                                <Text fontSize="xs" color="gray.400" width="140px">
                                  Generated:
                                </Text>
                                <Text fontSize="xs" color="gray.300">
                                  {new Date(parsedQRData.timestamp).toLocaleString()}
                                </Text>
                              </HStack>
                            )}
                          </VStack>
                        )}
                      </Box>

                      {!parsedQRData.error && (
                        <>
                          <Button
                            bg={brandColors.primary}
                            color="white"
                            _hover={{ bg: brandColors.secondary }}
                            onClick={handleSaveQRDataToStorage}
                            width="full"
                          >
                            <Icon as={FiDatabase} mr={2} />
                            Link This Wallet to Your Passkey Account
                          </Button>

                          <Box p={3} bg="blue.900/90" borderRadius="md">
                            <Text fontSize="xs" color="gray.300">
                              <strong>What happens when you link:</strong> This will save the wallet
                              addresses to both localStorage and IndexedDB, creating a persistent
                              link between your passkey account and this HD wallet. You can use this
                              to verify or sync wallet data across devices.
                            </Text>
                          </Box>
                        </>
                      )}
                    </VStack>
                  )}
                </VStack>
              </Box>

              {/* How QR Code Sync Works */}
              <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <HStack mb={4}>
                  <Icon as={FiShield} color={brandColors.primary} boxSize={6} />
                  <Heading size="md">How QR Code Wallet Sync Works</Heading>
                </HStack>
                <VStack align="stretch" gap={3} fontSize="sm" color="gray.400">
                  <Text>
                    <strong>Step 1: Generate QR Code</strong> - On your primary device, generate a
                    QR code containing your wallet&apos;s public addresses. This QR code is safe to
                    share as it only contains public information.
                  </Text>
                  <Text>
                    <strong>Step 2: Scan & Verify</strong> - On your secondary device, scan the QR
                    code using any QR scanner app, or manually copy the JSON data displayed in the
                    QR code.
                  </Text>
                  <Text>
                    <strong>Step 3: Link Wallets</strong> - Paste the JSON data into the
                    verification area above and click &quot;Link This Wallet&quot;. This creates a
                    persistent connection between your passkey account and the HD wallet addresses.
                  </Text>
                  <Text>
                    <strong>What Gets Stored:</strong> Only public wallet addresses are stored in
                    localStorage and IndexedDB. Your private keys and recovery phrase remain secure
                    and are never transmitted or stored through this sync mechanism.
                  </Text>
                </VStack>
              </Box>

              {/* Passkey Platform Sync Info */}
              <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <HStack mb={4}>
                  <Icon as={FiCloud} color={brandColors.primary} boxSize={6} />
                  <Heading size="md">Passkey Platform Sync</Heading>
                </HStack>
                <VStack align="stretch" gap={3} fontSize="sm" color="gray.400">
                  <Text>
                    Your passkey credentials automatically sync across devices within the same
                    ecosystem:
                  </Text>
                  <ListRoot gap={2} fontSize="sm" variant="plain">
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" mr={2} />
                      <strong>Apple:</strong> Syncs via iCloud Keychain (iPhone, iPad, Mac)
                    </ListItem>
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" mr={2} />
                      <strong>Google:</strong> Syncs via Password Manager (Android, Chrome)
                    </ListItem>
                    <ListItem>
                      <Icon as={MdWarning} color="yellow.400" mr={2} />
                      <strong>Windows Hello:</strong> Device-specific, use encrypted backup for new
                      devices
                    </ListItem>
                    <ListItem>
                      <Icon as={MdWarning} color="yellow.400" mr={2} />
                      <strong>Hardware Keys:</strong> No sync, keep encrypted backup separately
                    </ListItem>
                  </ListRoot>
                  <Box p={3} bg="yellow.900/90" borderRadius="md" mt={2}>
                    <Text fontSize="xs" color="gray.300">
                      <strong>Cross-platform limitation:</strong> Passkeys do not sync across
                      different ecosystems (e.g., iPhone to Android). However, encrypted backups ARE
                      fully cross-platform - you can restore your wallet on any device with the
                      backup file and password, regardless of the original platform.
                    </Text>
                  </Box>
                </VStack>
              </Box>

              {/* Best Practices */}
              <Box bg="gray.900" p={6} borderRadius="lg" border="1px solid" borderColor="gray.700">
                <HStack mb={4}>
                  <Icon as={FiCheckCircle} color={brandColors.primary} boxSize={6} />
                  <Heading size="md">Best Practices</Heading>
                </HStack>
                <VStack align="stretch" gap={2} fontSize="sm" color="gray.400">
                  <ListRoot gap={2} variant="plain">
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" mr={2} />
                      Always create an encrypted backup before syncing to a new device
                    </ListItem>
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" mr={2} />
                      Verify wallet addresses match after syncing
                    </ListItem>
                    <ListItem>
                      <Icon as={MdCheckCircle} color="green.400" mr={2} />
                      Use the Debug & Inspect Storage tools to verify sync data was saved correctly
                    </ListItem>
                    <ListItem>
                      <Icon as={MdWarning} color="yellow.400" mr={2} />
                      Never share your QR code publicly or on untrusted channels
                    </ListItem>
                    <ListItem>
                      <Icon as={MdInfo} color="blue.400" mr={2} />
                      QR codes only contain public addresses, but still treat them as sensitive
                      account information
                    </ListItem>
                  </ListRoot>
                </VStack>
              </Box>
            </VStack>
          </TabsContent>
        </TabsRoot>
      </VStack>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={handleModalClose}
        onSubmit={handlePasswordSubmit}
        title={`Enter Password to Create Backup`}
        description={`Please enter your password to create the backup. This is required by the w3pk SDK to access your encrypted wallet data.`}
      />

      <PasswordModal
        isOpen={showRestorePasswordModal}
        onClose={handleRestoreModalClose}
        onSubmit={handleRestorePasswordSubmit}
        title={`Enter Password to Restore Backup`}
        description={`Please enter the password you used when creating this backup file.`}
      />

      {/* Username Modal for Restore when no credentials exist */}
      <Dialog.Root
        open={needsUsernameForRestore}
        onOpenChange={(e: { open: boolean }) =>
          e.open
            ? null
            : (() => {
                setNeedsUsernameForRestore(false)
                setRestoreUsername('')
                setSelectedBackupFile(null)
                delete (window as any)._restorePassword
                delete (window as any)._restoreBackup
              })()
        }
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content p={6}>
              <Dialog.Header>
                <Dialog.Title>Choose Username for Restored Wallet</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body pt={4}>
                <VStack gap={4}>
                  <Text fontSize="sm" color="gray.400">
                    No existing credentials found on this device. Please choose a username to
                    register your restored wallet with a new passkey.
                  </Text>
                  <Field invalid={isRestoreUsernameInvalid} label="Username">
                    <Input
                      id="restore-username-input"
                      aria-describedby={
                        isRestoreUsernameInvalid && restoreUsername.trim()
                          ? 'restore-username-error'
                          : undefined
                      }
                      placeholder="Enter your username"
                      value={restoreUsername}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setRestoreUsername(e.target.value)
                        setIsRestoreUsernameInvalid(false)
                      }}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleRestoreWithUsername()
                        }
                      }}
                      autoFocus
                      disabled={isRestoring}
                    />
                    {isRestoreUsernameInvalid && restoreUsername.trim() && (
                      <Text id="restore-username-error" fontSize="sm" color="red.400" mt={1}>
                        Username must be 3-50 characters, alphanumeric with underscores/hyphens, and
                        start/end with alphanumeric.
                      </Text>
                    )}
                  </Field>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer pt={4}>
                <Dialog.CloseTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isRestoring}
                    onClick={() => {
                      setNeedsUsernameForRestore(false)
                      setRestoreUsername('')
                      setSelectedBackupFile(null)
                      delete (window as any)._restorePassword
                      delete (window as any)._restoreBackup
                    }}
                  >
                    Cancel
                  </Button>
                </Dialog.CloseTrigger>
                <Button
                  bg={brandColors.primary}
                  color="white"
                  _hover={{ bg: brandColors.secondary }}
                  onClick={handleRestoreWithUsername}
                  loading={isRestoring}
                  loadingText="Restoring & Registering..."
                  disabled={isRestoring || !restoreUsername.trim()}
                >
                  Restore & Register
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root
        open={isOpen}
        onOpenChange={(e: { open: boolean }) => (e.open ? null : onClose())}
        role="alertdialog"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content p={6}>
              <Dialog.Header>
                <Dialog.Title>Remove Account</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body pt={4}>
                <VStack gap={4} align="stretch">
                  <Text>
                    Are you sure you want to remove the account{' '}
                    <strong>{accountToDelete?.username}</strong>?
                  </Text>
                  <Box bg="red.900" p={3} borderRadius="md">
                    <Text fontSize="sm" color="red.200">
                      <strong>Warning:</strong> This will delete all data for this account from this
                      device. Make sure you have a backup before proceeding. This action cannot be
                      undone.
                    </Text>
                  </Box>
                  {user?.ethereumAddress === accountToDelete?.ethereumAddress && (
                    <Box bg="orange.900" p={3} borderRadius="md">
                      <Text fontSize="sm" color="orange.200">
                        This is your currently logged-in account. You will be logged out after
                        removal.
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Dialog.Body>

              <Dialog.Footer gap={3} pt={6}>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </Dialog.ActionTrigger>
                <Button
                  bg={brandColors.accent}
                  color="white"
                  _hover={{ bg: '#3690e0' }}
                  onClick={confirmDeleteAccount}
                >
                  Remove Account
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root
        open={showLocalStorageModal}
        onOpenChange={(e: { open: boolean }) => (e.open ? null : setShowLocalStorageModal(false))}
        size="xl"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content p={6}>
              <Dialog.Header>
                <Dialog.Title>
                  <HStack>
                    <Icon as={FiHardDrive} />
                    <Text>LocalStorage Inspection</Text>
                  </HStack>
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body pt={4}>
                <VStack align="stretch" gap={4}>
                  <Text fontSize="sm" color="gray.400">
                    Found {localStorageData.length} items in localStorage
                  </Text>

                  {localStorageData.length === 0 ? (
                    <Box bg="gray.900" p={4} borderRadius="md" textAlign="center">
                      <Text color="gray.500">No data found</Text>
                    </Box>
                  ) : (
                    localStorageData.map((item, index) => (
                      <Box
                        key={index}
                        bg="gray.900"
                        p={4}
                        borderRadius="md"
                        border="1px solid"
                        borderColor={item.type.startsWith('w3pk') ? 'purple.600' : 'gray.700'}
                      >
                        <VStack align="stretch" gap={2}>
                          <HStack justify="space-between">
                            <Text fontSize="sm" fontWeight="bold" color="white">
                              {item.key}
                            </Text>
                            <HStack gap={2}>
                              {item.encrypted && (
                                <Badge colorPalette="orange" fontSize="xs">
                                  Encrypted
                                </Badge>
                              )}
                              <Badge
                                colorPalette={item.type.startsWith('w3pk') ? 'purple' : 'gray'}
                                fontSize="xs"
                              >
                                {item.type}
                              </Badge>
                            </HStack>
                          </HStack>

                          {item.parsedValue && (
                            <Box bg="gray.950" p={3} borderRadius="md" overflowX="auto">
                              <CodeBlock>
                                {formatValue(maskSensitiveData(item.key, item.parsedValue))}
                              </CodeBlock>
                            </Box>
                          )}

                          {!item.parsedValue && (
                            <Text fontSize="xs" color="gray.500" fontFamily="monospace">
                              {item.value}
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    ))
                  )}
                </VStack>
              </Dialog.Body>
              <Dialog.Footer gap={3} pt={6}>
                <Button onClick={() => setShowLocalStorageModal(false)}>Close</Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root
        open={showIndexedDBModal}
        onOpenChange={(e: { open: boolean }) => (e.open ? null : setShowIndexedDBModal(false))}
        size="xl"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content p={6}>
              <Dialog.Header>
                <Dialog.Title>
                  <HStack>
                    <Icon as={FiDatabase} />
                    <Text>IndexedDB Inspection</Text>
                  </HStack>
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body pt={4}>
                <VStack align="stretch" gap={4}>
                  <Text fontSize="sm" color="gray.400">
                    Found {indexedDBData.length} database(s)
                  </Text>

                  {indexedDBData.length === 0 ? (
                    <Box bg="gray.900" p={4} borderRadius="md" textAlign="center">
                      <Text color="gray.500">No w3pk-related databases found</Text>
                    </Box>
                  ) : (
                    indexedDBData.map((db, dbIndex) => (
                      <Box
                        key={dbIndex}
                        bg="gray.900"
                        p={4}
                        borderRadius="md"
                        border="1px solid"
                        borderColor="purple.600"
                      >
                        <VStack align="stretch" gap={3}>
                          <HStack justify="space-between">
                            <Text fontSize="md" fontWeight="bold" color="white">
                              {db.name}
                            </Text>
                            <Badge colorPalette="purple" fontSize="xs">
                              v{db.version}
                            </Badge>
                          </HStack>

                          <Text fontSize="xs" color="gray.400">
                            Stores: {db.stores.join(', ')}
                          </Text>

                          <Text fontSize="xs" color="gray.400">
                            Records: {db.records.length}
                          </Text>

                          {db.records.length > 0 && (
                            <VStack align="stretch" gap={2} mt={2}>
                              {db.records.map((record, recordIndex) => (
                                <Box
                                  key={recordIndex}
                                  bg="gray.950"
                                  p={3}
                                  borderRadius="md"
                                  border="1px solid"
                                  borderColor="gray.800"
                                >
                                  <Text fontSize="xs" color="gray.400" mb={2}>
                                    Store: {record.store} | Key: {record.key}
                                  </Text>
                                  <Box overflowX="auto">
                                    <CodeBlock>
                                      {formatValue(maskSensitiveData(record.key, record.value))}
                                    </CodeBlock>
                                  </Box>
                                </Box>
                              ))}
                            </VStack>
                          )}
                        </VStack>
                      </Box>
                    ))
                  )}
                </VStack>
              </Dialog.Body>
              <Dialog.Footer gap={3} pt={6}>
                <Button onClick={() => setShowIndexedDBModal(false)}>Close</Button>
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

export default SettingsPage
