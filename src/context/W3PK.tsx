'use client'

/**
 * W3PK Context Provider
 *
 * For integration guidelines and detailed documentation,
 * please visit: https://w3pk.w3hc.org/docs#integration-guidelines
 */

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from 'react'
import { createWeb3Passkey, getCurrentBuildHash, verifyBuildHash, inspect, inspectNow } from 'w3pk'
import { toaster } from '@/components/ui/toaster'

type SecurityMode = 'PRIMARY' | 'STRICT' | 'STANDARD' | 'YOLO'

interface SecurityScore {
  total: number
  level: string
  nextMilestone?: string
  breakdown?: Record<string, number>
}

interface PasskeySync {
  enabled: boolean
  deviceCount: number
}

interface RecoveryPhrase {
  verified: boolean
}

interface BackupStatus {
  securityScore: SecurityScore
  passkeySync?: PasskeySync
  recoveryPhrase?: RecoveryPhrase
  backupExists?: boolean
}

interface W3pkUser {
  id: string
  username: string
  displayName: string
  ethereumAddress: string
  credentialId: string
}

interface DerivedWallet {
  address: string
  privateKey?: string
  publicKey?: string
}

interface Guardian {
  id: string
  name: string
  email?: string
  phone?: string
  shareEncrypted: string
  status: 'pending' | 'active' | 'revoked'
  addedAt: string
  lastVerified?: string
}

interface GuardianInvite {
  guardianId: string
  shareCode: string
  explainer: string
}

interface SocialRecoveryConfig {
  threshold: number
  totalGuardians: number
  guardians: Guardian[]
  createdAt: string
  ethereumAddress: string
}

interface StealthAddressResult {
  stealthAddress: string
  ephemeralPublicKey: string
  viewTag: string
}

type Transaction = {
  to: string
  value?: bigint
  data?: string
  chainId: number
  gasLimit?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: number
}

type SignMessageOptions = {
  mode?: SecurityMode
  tag?: string
  requireAuth?: boolean
  origin?: string
  signingMethod?: 'EIP191' | 'SIWE' | 'EIP712' | 'rawHash'
  eip712Domain?: object
  eip712Types?: object
  eip712PrimaryType?: string
}

type TxOptions = {
  mode?: SecurityMode
  tag?: string
  requireAuth?: boolean
  origin?: string
  rpcUrl?: string
}

type TxResponse = {
  hash: string
  from: string
  chainId: number
  mode: string
  tag: string
  origin: string
}

interface W3pkType {
  isAuthenticated: boolean
  user: W3pkUser | null
  isLoading: boolean
  login: () => Promise<void>
  register: (username: string) => Promise<void>
  logout: () => Promise<void>
  signMessage: (message: string, options?: SignMessageOptions) => Promise<string | null>
  sendTransaction: (tx: Transaction, options?: TxOptions) => Promise<TxResponse>
  deriveWallet: (
    mode?: string,
    tag?: string,
    options?: { requireAuth?: boolean; origin?: string }
  ) => Promise<DerivedWallet>
  getAddress: (mode?: string, tag?: string) => Promise<string>
  getBackupStatus: () => Promise<BackupStatus>
  createBackup: (password: string) => Promise<Blob>
  restoreFromBackup: (
    backupData: string,
    password: string
  ) => Promise<{ mnemonic: string; ethereumAddress: string }>
  registerWithBackupFile: (
    backupData: string,
    password: string,
    username: string
  ) => Promise<{ address: string; username: string }>
  setupSocialRecovery: (
    guardians: { name: string; email?: string; phone?: string }[],
    threshold: number,
    password?: string
  ) => Promise<Guardian[]>
  getSocialRecoveryConfig: () => SocialRecoveryConfig | null
  generateGuardianInvite: (guardian: Guardian) => Promise<GuardianInvite>
  recoverFromGuardians: (
    shareData: string[]
  ) => Promise<{ backupFileJson: string; ethereumAddress: string }>
  clearSocialRecoveryConfig: () => void
  getStealthKeys: () => Promise<any>
  generateStealthAddressFor: (recipientMetaAddress: string) => Promise<StealthAddressResult>
}

const W3PK = createContext<W3pkType>({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  signMessage: async () => null,
  sendTransaction: async () => {
    throw new Error('sendTransaction not initialized')
  },
  deriveWallet: async () => ({ address: '', privateKey: '' }),
  getAddress: async () => '',
  getBackupStatus: async () => {
    throw new Error('getBackupStatus not initialized')
  },
  createBackup: async () => {
    throw new Error('createBackup not initialized')
  },
  restoreFromBackup: async () => {
    throw new Error('restoreFromBackup not initialized')
  },
  registerWithBackupFile: async () => {
    throw new Error('registerWithBackupFile not initialized')
  },
  setupSocialRecovery: async () => {
    throw new Error('setupSocialRecovery not initialized')
  },
  getSocialRecoveryConfig: () => null,
  generateGuardianInvite: async () => {
    throw new Error('generateGuardianInvite not initialized')
  },
  recoverFromGuardians: async () => {
    throw new Error('recoverFromGuardians not initialized')
  },
  clearSocialRecoveryConfig: () => {},
  getStealthKeys: async () => {
    throw new Error('getStealthKeys not initialized')
  },
  generateStealthAddressFor: async () => {
    throw new Error('generateStealthAddressFor not initialized')
  },
})

export const useW3PK = () => useContext(W3PK)

interface W3pkProviderProps {
  children: ReactNode
}

const REGISTRATION_TIMEOUT_MS = 45000 // 45 seconds

/**
 * Check if any persistent session exists in IndexedDB
 * This allows us to avoid triggering WebAuthn prompt when no session exists
 */
async function checkIndexedDBForPersistentSession(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return false
    }

    const dbName = 'Web3PasskeyPersistentSessions'
    const storeName = 'sessions'

    return new Promise(resolve => {
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
  } catch {
    return false
  }
}

export const W3pkProvider: React.FC<W3pkProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<W3pkUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const isUserCancelledError = useCallback((error: unknown): boolean => {
    if (error && typeof error === 'object' && 'name' in error && 'message' in error) {
      const err = error as { name: string; message: string }
      return (
        err.name === 'NotAllowedError' ||
        err.message.includes('NotAllowedError') ||
        err.message.includes('timed out') ||
        err.message.includes('not allowed')
      )
    }
    return false
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleAuthStateChanged = useCallback((isAuth: boolean, w3pkUser?: unknown) => {
    if (isAuth && w3pkUser && typeof w3pkUser === 'object') {
      const userObj = w3pkUser as Record<string, string>
      const userData: W3pkUser = {
        id: userObj.id,
        username: userObj.username,
        displayName: userObj.displayName,
        ethereumAddress: userObj.ethereumAddress,
        credentialId: userObj.credentialId,
      }
      setUser(userData)
      setIsAuthenticated(true)
    } else {
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  // Get persistent session duration from localStorage (default: 7 days)
  const getPersistentSessionDuration = (): number => {
    if (typeof window === 'undefined') return 7
    const stored = localStorage.getItem('persistentSessionDuration')
    const days = stored ? parseInt(stored, 10) : 7
    return days >= 1 && days <= 30 ? days : 7 // Validate between 1-30 days
  }

  const w3pk = useMemo(
    () =>
      createWeb3Passkey({
        stealthAddresses: {},
        onAuthStateChanged: handleAuthStateChanged,
        sessionDuration: 24, // 24 hours session duration
        persistentSession: {
          enabled: true,
          duration: getPersistentSessionDuration() * 24, // Convert days to hours
          requireReauth: false, // Silent session restore (no biometric prompt on page refresh)
        },
      }),
    [handleAuthStateChanged]
  )

  // Expose w3pk instance to window for console inspection
  useEffect(() => {
    if (typeof window !== 'undefined' && w3pk) {
      ;(window as any).w3pk = {
        ...w3pk,
        getCurrentBuildHash,
        verifyBuildHash,
        inspect,
        inspectNow,
      }
    }
  }, [w3pk])

  useEffect(() => {
    /**
     * Login Workflow - Step 1: Check for existing persistent session
     * This runs automatically on mount to restore the user's session if it exists.
     * This is the first step in the comprehensive login workflow.
     */
    const checkExistingAuth = async (): Promise<void> => {
      if (!isMounted || !w3pk) return

      try {
        // Check for active in-memory session
        if (w3pk.hasActiveSession() && w3pk.user) {
          handleAuthStateChanged(true, w3pk.user)
          return
        }

        // Check if persistent session exists in IndexedDB with timeout for mobile
        const checkPromise = checkIndexedDBForPersistentSession()
        const timeoutPromise = new Promise<boolean>(
          resolve => setTimeout(() => resolve(false), 3000) // 3 second timeout for mobile
        )

        const hasPersistentSession = await Promise.race([checkPromise, timeoutPromise])

        if (hasPersistentSession) {
          // Try to restore from persistent session via login()
          try {
            await w3pk.login()
            // Silent restore succeeded - handleAuthStateChanged called by SDK
          } catch (error) {
            // Silent restore failed - user is logged out
            handleAuthStateChanged(false)
          }
        } else {
          // No persistent session - user is logged out
          handleAuthStateChanged(false)
        }
      } catch {
        handleAuthStateChanged(false)
      }
    }

    checkExistingAuth()
  }, [isMounted, w3pk, handleAuthStateChanged])

  const register = async (username: string): Promise<void> => {
    try {
      setIsLoading(true)
      console.log('[W3PK] Registration initiated for username:', username)

      const registrationPromise = w3pk.register({ username })
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Registration timed out. Please try again or check browser console for errors.'
              )
            ),
          REGISTRATION_TIMEOUT_MS
        )
      )

      await Promise.race([registrationPromise, timeoutPromise])

      console.log('[W3PK] Registration successful')

      toaster.create({
        title: 'Done! 🎉',
        description:
          "Your encrypted wallet has been created and stored on your device. Don't forget to back it up!",
        type: 'success',
        duration: 3000,
      })
    } catch (error) {
      console.error('[W3PK] Registration failed:', error)

      const errorDetails =
        error instanceof Error ? `${error.name}: ${error.message}` : JSON.stringify(error)

      toaster.create({
        title: 'Registration Failed',
        description: errorDetails,
        type: 'error',
        duration: 15000, // Longer duration so you can read it on mobile
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (): Promise<void> => {
    try {
      setIsLoading(true)
      console.log('[W3PK] Login initiated')

      const result = await w3pk.login()
      const hasWallet = w3pk.isAuthenticated
      const displayName = result.displayName || result.username || 'Anon'

      console.log('[W3PK] Login successful:', { hasWallet, displayName })

      toaster.create({
        title: "You're in!",
        description: hasWallet
          ? `Welcome back, ${displayName}!`
          : `Welcome back, ${displayName}! No wallet found on this device.`,
        type: hasWallet ? 'success' : 'warning',
        duration: 5000,
      })
    } catch (error) {
      console.error('[W3PK] Login failed:', error)

      if (!isUserCancelledError(error)) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to authenticate with w3pk'

        // Silence passkey not available errors
        const isPasskeyNotAvailable =
          errorMessage.includes('not available on this device') ||
          errorMessage.includes('not available') ||
          errorMessage.includes('restore your wallet from a backup')

        if (!isPasskeyNotAvailable) {
          toaster.create({
            title: 'Authentication Failed',
            description: errorMessage,
            type: 'error',
            duration: 5000,
          })
        }
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const ensureAuthentication = useCallback(async (): Promise<void> => {
    // If W3PK SDK session is active, we're good
    if (w3pk.hasActiveSession()) {
      return
    }

    // No active session - prompt for login
    // W3PK SDK will handle session creation and management
    await w3pk.login()
  }, [w3pk])

  const signMessage = async (
    message: string,
    options?: SignMessageOptions
  ): Promise<string | null> => {
    if (!user) {
      toaster.create({
        title: 'Not Authenticated',
        description: 'Please log in first.',
        type: 'error',
        duration: 3000,
      })
      return null
    }

    try {
      await ensureAuthentication()
      const result = await w3pk.signMessage(message, options as any)

      // Extend session after successful operation for better UX
      w3pk.extendSession()

      return result.signature
    } catch (error) {
      if (!isUserCancelledError(error)) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to sign message with w3pk'

        toaster.create({
          title: 'Signing Failed',
          description: errorMessage,
          type: 'error',
          duration: 5000,
        })
      }
      return null
    }
  }

  const sendTransaction = async (tx: Transaction, options?: TxOptions): Promise<TxResponse> => {
    if (!user) {
      throw new Error('Not authenticated. Please log in first.')
    }

    try {
      await ensureAuthentication()
      const result = await w3pk.sendTransaction(tx, options)

      // Extend session after successful operation
      w3pk.extendSession()

      toaster.create({
        title: 'Transaction Sent',
        description: `Transaction hash: ${result.hash.substring(0, 10)}...`,
        type: 'success',
        duration: 5000,
      })

      return result
    } catch (error) {
      if (!isUserCancelledError(error)) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send transaction'

        toaster.create({
          title: 'Transaction Failed',
          description: errorMessage,
          type: 'error',
          duration: 5000,
        })
      }
      throw error
    }
  }

  const deriveWallet = useCallback(
    async (
      mode?: string,
      tag?: string,
      options?: { requireAuth?: boolean; origin?: string }
    ): Promise<DerivedWallet> => {
      if (!user) {
        throw new Error('Not authenticated. Please log in first.')
      }

      try {
        await ensureAuthentication()
        const derivedWallet = await w3pk.deriveWallet(mode as any, tag as any, options)

        // Extend session after successful operation
        w3pk.extendSession()

        return derivedWallet
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes('Not authenticated') ||
            error.message.includes('login') ||
            error.message.includes('Failed to derive wallet'))
        ) {
          try {
            await w3pk.login()
            const derivedWallet = await w3pk.deriveWallet(mode as any, tag as any, options)

            // Extend session after successful retry
            w3pk.extendSession()

            return derivedWallet
          } catch (retryError) {
            if (!isUserCancelledError(retryError)) {
              toaster.create({
                title: 'Authentication Required',
                description: 'Please authenticate to derive addresses',
                type: 'error',
                duration: 5000,
              })
            }
            throw retryError
          }
        }

        if (!isUserCancelledError(error)) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : `Failed to derive wallet (${mode || 'STANDARD'}, ${tag || 'MAIN'})`

          toaster.create({
            title: 'Derivation Failed',
            description: errorMessage,
            type: 'error',
            duration: 5000,
          })
        }
        throw error
      }
    },
    [user, w3pk, isUserCancelledError, ensureAuthentication]
  )

  const getAddress = useCallback(
    async (mode?: string, tag?: string): Promise<string> => {
      if (!user) {
        throw new Error('Not authenticated. Please log in first.')
      }

      try {
        await ensureAuthentication()
        const address = await w3pk.getAddress(mode as any, tag as any)

        // Extend session after successful operation
        w3pk.extendSession()

        return address
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes('Not authenticated') ||
            error.message.includes('login') ||
            error.message.includes('Failed to get address'))
        ) {
          try {
            await w3pk.login()
            const address = await w3pk.getAddress(mode as any, tag as any)

            // Extend session after successful retry
            w3pk.extendSession()

            return address
          } catch (retryError) {
            if (!isUserCancelledError(retryError)) {
              toaster.create({
                title: 'Authentication Required',
                description: 'Please authenticate to get address',
                type: 'error',
                duration: 5000,
              })
            }
            throw retryError
          }
        }

        if (!isUserCancelledError(error)) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : `Failed to get address (${mode || 'STANDARD'}, ${tag || 'MAIN'})`

          toaster.create({
            title: 'Failed to Get Address',
            description: errorMessage,
            type: 'error',
            duration: 5000,
          })
        }
        throw error
      }
    },
    [user, w3pk, isUserCancelledError, ensureAuthentication]
  )

  const logout = async (): Promise<void> => {
    // The SDK's logout() method clears both in-memory and ALL persistent sessions from IndexedDB
    w3pk.logout()

    // Extra cleanup for mobile: explicitly clear persistent session from IndexedDB
    // This ensures the session is cleared even if the SDK's logout has issues on mobile
    try {
      if (typeof window !== 'undefined' && window.indexedDB) {
        const dbName = 'Web3PasskeyPersistentSessions'
        const storeName = 'sessions'

        // Open and clear the database
        const request = indexedDB.open(dbName)
        request.onsuccess = event => {
          const db = (event.target as IDBOpenDBRequest).result
          if (db.objectStoreNames.contains(storeName)) {
            const transaction = db.transaction([storeName], 'readwrite')
            const objectStore = transaction.objectStore(storeName)
            objectStore.clear() // Clear all sessions
          }
          db.close()
        }
      }
    } catch (error) {
      console.error('[W3PK] Error clearing persistent session:', error)
    }
  }

  const getBackupStatus = async (): Promise<BackupStatus> => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated. Cannot check backup status.')
    }

    if (!w3pk || typeof w3pk.getBackupStatus !== 'function') {
      throw new Error('w3pk SDK does not support getBackupStatus.')
    }

    try {
      setIsLoading(true)

      try {
        const result = await w3pk.getBackupStatus()
        return result
      } catch (initialError) {
        if (
          initialError instanceof Error &&
          (initialError.message.includes('Must be authenticated') ||
            initialError.message.includes('login'))
        ) {
          await w3pk.login()
          const result = await w3pk.getBackupStatus()
          return result
        }
        throw initialError
      }
    } catch (error) {
      if (!isUserCancelledError(error)) {
        toaster.create({
          title: 'Authentication Required',
          description: 'Please authenticate to check backup status',
          type: 'error',
          duration: 5000,
        })
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const createBackup = async (password: string): Promise<Blob> => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated. Cannot create backup.')
    }

    if (!w3pk || typeof w3pk.createBackupFile !== 'function') {
      throw new Error('w3pk SDK does not support createBackupFile.')
    }

    try {
      setIsLoading(true)

      try {
        const result = await w3pk.createBackupFile('password', password)
        return result.blob
      } catch (initialError) {
        if (
          initialError instanceof Error &&
          (initialError.message.includes('Must be authenticated') ||
            initialError.message.includes('login'))
        ) {
          await w3pk.login()
          const result = await w3pk.createBackupFile('password', password)
          return result.blob
        }
        throw initialError
      }
    } catch (error) {
      if (!isUserCancelledError(error)) {
        toaster.create({
          title: 'Authentication Required',
          description: 'Please authenticate to create backup',
          type: 'error',
          duration: 5000,
        })
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const restoreFromBackup = async (
    backupData: string,
    password: string
  ): Promise<{ mnemonic: string; ethereumAddress: string }> => {
    if (!w3pk || typeof w3pk.restoreFromBackupFile !== 'function') {
      throw new Error('w3pk SDK does not support restoreFromBackupFile.')
    }

    try {
      setIsLoading(true)

      const result = await w3pk.restoreFromBackupFile(backupData, password)

      toaster.create({
        title: 'Backup Restored Successfully!',
        description: `Wallet restored: ${result.ethereumAddress}`,
        type: 'success',
        duration: 5000,
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore from backup'

      toaster.create({
        title: 'Restore Failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const registerWithBackupFile = async (
    backupData: string,
    password: string,
    username: string
  ): Promise<{ address: string; username: string }> => {
    if (!w3pk || typeof w3pk.registerWithBackupFile !== 'function') {
      throw new Error('w3pk SDK does not support registerWithBackupFile.')
    }

    try {
      setIsLoading(true)
      console.log('[W3PK] Registration with backup file initiated for username:', username)

      const result = await w3pk.registerWithBackupFile(backupData, password, username)

      console.log('[W3PK] Registration with backup successful')

      toaster.create({
        title: 'Wallet Restored & Registered! 🎉',
        description: `Your wallet has been restored and secured with a new passkey: ${result.address.slice(0, 6)}...${result.address.slice(-4)}`,
        type: 'success',
        duration: 5000,
      })

      return result
    } catch (error) {
      console.error('[W3PK] Registration with backup failed:', error)

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to register with backup file'

      toaster.create({
        title: 'Registration Failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Social recovery now uses the w3pk library's SocialRecoveryManager
  // which splits backup files instead of mnemonics for better security

  const setupSocialRecovery = async (
    guardians: { name: string; email?: string; phone?: string }[],
    threshold: number,
    password?: string
  ): Promise<Guardian[]> => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated. Cannot setup social recovery.')
    }

    try {
      setIsLoading(true)
      await ensureAuthentication()

      // Prompt user for a password to encrypt the backup file
      // This password will be required when recovering from guardians
      const backupPassword =
        password ||
        window.prompt(
          'Enter a password to encrypt your backup file.\n\n' +
            'IMPORTANT: You will need this password AND guardian shares to recover your wallet.\n' +
            'Store this password securely - guardians do NOT have access to it.'
        )

      if (!backupPassword) {
        throw new Error('Password is required for social recovery setup')
      }

      // Create password-encrypted backup file
      const backupBlob = await w3pk.createBackupFile('password', backupPassword)
      const backupJson = await backupBlob.blob.text()

      // Use w3pk's SocialRecoveryManager to split the backup file
      const { SocialRecoveryManager } = await import('w3pk')
      const socialRecoveryManager = new SocialRecoveryManager()

      const guardianObjects = await socialRecoveryManager.setupSocialRecovery(
        backupJson,
        user.ethereumAddress,
        guardians,
        threshold
      )

      toaster.create({
        title: 'Social Recovery Configured!',
        description: `Successfully set up ${threshold}-of-${guardians.length} guardian recovery. Remember your password!`,
        type: 'success',
        duration: 5000,
      })

      return guardianObjects
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to setup social recovery'

      toaster.create({
        title: 'Setup Failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getSocialRecoveryConfig = (): SocialRecoveryConfig | null => {
    // Use w3pk's SocialRecoveryManager to get config
    try {
      const { SocialRecoveryManager } = require('w3pk')
      const socialRecoveryManager = new SocialRecoveryManager()
      return socialRecoveryManager.getSocialRecoveryConfig()
    } catch {
      return null
    }
  }

  const generateGuardianInvite = async (guardian: Guardian): Promise<GuardianInvite> => {
    try {
      setIsLoading(true)

      // Use w3pk's SocialRecoveryManager to generate invite
      const { SocialRecoveryManager } = await import('w3pk')
      const socialRecoveryManager = new SocialRecoveryManager()

      const invite = await socialRecoveryManager.generateGuardianInvite(guardian)

      toaster.create({
        title: 'Guardian Invitation Generated',
        description: `Invitation ready for ${guardian.name}`,
        type: 'success',
        duration: 3000,
      })

      return invite
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate guardian invite'

      toaster.create({
        title: 'Generation Failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const recoverFromGuardians = async (
    shareData: string[]
  ): Promise<{ backupFileJson: string; ethereumAddress: string }> => {
    try {
      setIsLoading(true)

      // Use w3pk's SocialRecoveryManager to recover backup file
      const { SocialRecoveryManager } = await import('w3pk')
      const socialRecoveryManager = new SocialRecoveryManager()

      const { backupFileJson, ethereumAddress } =
        await socialRecoveryManager.recoverFromGuardians(shareData)

      toaster.create({
        title: 'Backup File Recovered!',
        description: `Successfully recovered encrypted backup file for ${ethereumAddress.slice(0, 6)}...${ethereumAddress.slice(-4)}. You can now restore your wallet with the password you set during setup.`,
        type: 'success',
        duration: 8000,
      })

      return {
        backupFileJson,
        ethereumAddress,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to recover from guardians'

      toaster.create({
        title: 'Recovery Failed',
        description: errorMessage,
        type: 'error',
        duration: 5000,
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const clearSocialRecoveryConfig = (): void => {
    try {
      // Clear from localStorage (both old and new format)
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('w3pk_social_recovery')

        toaster.create({
          title: 'Social Recovery Config Cleared',
          description: 'Guardian shares removed from local storage',
          type: 'success',
          duration: 3000,
        })
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to clear social recovery config'

      toaster.create({
        title: 'Clear Failed',
        description: errorMessage,
        type: 'error',
        duration: 3000,
      })
    }
  }

  const getStealthKeys = async (): Promise<any> => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated. Cannot get stealth keys.')
    }

    try {
      await ensureAuthentication()

      // Check if stealth module is available
      if (!w3pk.stealth || typeof w3pk.stealth.getKeys !== 'function') {
        throw new Error('Stealth address functionality not available in current w3pk version')
      }

      const keys = await w3pk.stealth.getKeys()
      w3pk.extendSession()
      return keys
    } catch (error) {
      if (!isUserCancelledError(error)) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get stealth keys'
        toaster.create({
          title: 'Failed to Get Stealth Keys',
          description: errorMessage,
          type: 'error',
          duration: 5000,
        })
      }
      throw error
    }
  }

  const generateStealthAddressFor = async (
    recipientMetaAddress: string
  ): Promise<StealthAddressResult> => {
    if (!isAuthenticated || !user) {
      throw new Error('User not authenticated. Cannot generate stealth address.')
    }

    try {
      await ensureAuthentication()

      // Check if stealth module is available
      if (!w3pk.stealth || typeof w3pk.stealth.generateStealthAddress !== 'function') {
        throw new Error('Stealth address functionality not available in current w3pk version')
      }

      // Use the stealth module's generateStealthAddress method
      // Note: This generates a stealth address for the user (sender's perspective)
      const result = await w3pk.stealth.generateStealthAddress()
      w3pk.extendSession()

      return result
    } catch (error) {
      if (!isUserCancelledError(error)) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to generate stealth address'
        toaster.create({
          title: 'Failed to Generate Stealth Address',
          description: errorMessage,
          type: 'error',
          duration: 5000,
        })
      }
      throw error
    }
  }

  return (
    <W3PK.Provider
      value={{
        isAuthenticated: isMounted && isAuthenticated,
        user,
        isLoading,
        login,
        register,
        logout,
        signMessage,
        sendTransaction,
        deriveWallet,
        getAddress,
        getBackupStatus,
        createBackup,
        restoreFromBackup,
        registerWithBackupFile,
        setupSocialRecovery,
        getSocialRecoveryConfig,
        generateGuardianInvite,
        recoverFromGuardians,
        clearSocialRecoveryConfig,
        getStealthKeys,
        generateStealthAddressFor,
      }}
    >
      {children}
    </W3PK.Provider>
  )
}

// Export w3pk utilities for use in components
export { base64UrlToArrayBuffer, base64UrlDecode, extractRS } from 'w3pk'
