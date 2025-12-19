/**
 * Translation system for the application
 * Contains all text strings organized by language
 */

import { Language } from '@/utils/i18n'

// Define the structure of our translations
type TranslationKeys = {
  common: {
    login: string
    logout: string
    register: string
    pleaseLogin: string
    cancel: string
    submit: string
    copy: string
    view: string
    remove: string
    tryAgain: string
    browse: string
  }
  home: {
    title: string
    subtitle: string
    greeting: string
    greetingSubtitle: string
    hero: {
      tagline: string
      letTheWorld: string
      verify: string
      it: string
      description: string
      dashboardButton: string
      verifyButton: string
    }
    problem: {
      title: string
      description: string
    }
    features: {
      title: string
      easyToVerify: string
      easyToVerifyDesc: string
      unbreakableSecurity: string
      unbreakableSecurityDesc: string
      privacyFirst: string
      privacyFirstDesc: string
      aiPowered: string
      aiPoweredDesc: string
      forEveryone: string
      forEveryoneDesc: string
      antiFraud: string
      antiFraudDesc: string
    }
    documentTypes: {
      title: string
      pdfs: string
      images: string
      videos: string
      anyFile: string
    }
    howItWorks: {
      title: string
      step1Title: string
      step1Desc: string
      step2Title: string
      step2Desc: string
      step3Title: string
      step3Desc: string
    }
    trust: {
      noStorage: string
      noStorageDesc: string
      guaranteeAuthorship: string
      guaranteeAuthorshipDesc: string
    }
    roadmap: {
      title: string
      publicDocuments: string
      publicDocumentsDesc: string
      digitalAgreements: string
      digitalAgreementsDesc: string
      mainnetLaunch: string
      mainnetLaunchDesc: string
      comingSoon: string
    }
    cta: {
      title: string
      description: string
      contactButton: string
    }
  }
  navigation: {
    settings: string
    dashboard: string
    verify: string
    sandbox: string
  }
  settings: {
    title: string
    loginRequired: string
  }
  dashboard: {
    title: string
    subtitle: string
    loginPrompt: string
    exploreWithout: string
    tryThe: string
    toExplore: string
    checkingPermissions: string
    welcome: string
    yourAddress: string
    issueDocument: {
      title: string
      issueOnBehalf: string
      contractAddress: string
      clickToUpload: string
      documentCID: string
      issueButton: string
      fileTooLarge: string
      fileTooLargeDesc: string
      cidGenerated: string
      cidGeneratedDesc: string
      error: string
      computeError: string
      noDocument: string
      noDocumentDesc: string
      notAuthenticated: string
      notAuthenticatedDesc: string
      txSubmitted: string
      txHash: string
      success: string
      viewTxOn: string
      viewTx: string
      failed: string
    }
    addAgent: {
      title: string
      agentAddress: string
      placeholder: string
      addButton: string
      registryContract: string
      noAddress: string
      noAddressDesc: string
      invalidAddress: string
      invalidAddressDesc: string
      noRegistry: string
      noRegistryDesc: string
      alreadyAgent: string
      notAuthenticated: string
      success: string
      failed: string
    }
  }
  verify: {
    title: string
    subtitle: string
    upload: {
      dropHere: string
      supportsAny: string
      noDocument: string
      noDocumentDesc: string
      copied: string
      clickToCopy: string
    }
    progress: {
      computing: string
      checking: string
      aiVerifying: string
      complete: string
    }
    results: {
      title: string
      verified: string
      notFound: string
      verifiedBadge: string
      unverifiedBadge: string
      issuedOn: string
      issuedBy: string
      entityUrl: string
      metadata: string
      registryAddress: string
      aiVerification: string
      registryVerified: string
      registryNotVerified: string
    }
    toast: {
      verified: string
      foundIn: string
      notFound: string
      notFoundDesc: string
      failed: string
      fileTooLarge: string
      fileTooLargeDesc: string
    }
  }
  sandbox: {
    title: string
    subtitle: string
  }
  errors: {
    somethingWrong: string
    apology: string
    errorDetails: string
    errorId: string
    tryAgain: string
    persistProblem: string
    contactSupport: string
  }
  notFound: {
    code: string
    title: string
    description: string
    returnHome: string
  }
  components: {
    header: {
      registerTitle: string
      registerDesc: string
      w3pk: string
      username: string
      usernamePlaceholder: string
      usernameValidation: string
      createAccount: string
      usernameRequired: string
      usernameRequiredDesc: string
      registrationFailed: string
      registrationFailedDesc: string
    }
    passwordModal: {
      password: string
      placeholder: string
      passwordRequired: string
      passwordRequiredDesc: string
      weakPassword: string
      weakPasswordDesc: string
      submissionError: string
      passwordMustInclude: string
      atLeast12: string
      oneUppercase: string
      oneLowercase: string
      oneNumber: string
      oneSpecial: string
      notMeetRequirements: string
      strongPassword: string
      satisfied: string
      required: string
    }
  }
}

// Define translations for each supported language
type Translations = {
  [key in Language]: TranslationKeys
}

export const translations: Translations = {
  // English
  en: {
    common: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      pleaseLogin: 'Please login',
      cancel: 'Cancel',
      submit: 'Submit',
      copy: 'Copy',
      view: 'View',
      remove: 'Remove',
      tryAgain: 'Try Again',
      browse: 'browse',
    },
    home: {
      title: 'Welcome!',
      subtitle: "It's a pleasure to have you here!",
      greeting: 'Hello Anon!',
      greetingSubtitle: 'Sit back, relax, and build something cool!',
      hero: {
        tagline: 'your onchain seal',
        letTheWorld: 'Let the world',
        verify: 'verify',
        it: 'it',
        description:
          'Authenticate your documents onchain while keeping your existing workflows intact. Anyone can then instantly verify that documents are genuine and unaltered.',
        dashboardButton: 'Your Dashboard',
        verifyButton: 'Verify',
      },
      problem: {
        title: 'The Document Fraud Epidemic...',
        description:
          'Fake documents cause billions of dollars in losses every year. From fraudulent certificates to forged contracts, document verification is broken. Web3 fixes this.',
      },
      features: {
        title: 'Discover Affix!',
        easyToVerify: 'Easy to Verify',
        easyToVerifyDesc:
          'One-click verification for anyone, anywhere. No technical knowledge required.',
        unbreakableSecurity: 'Unbreakable Security',
        unbreakableSecurityDesc: 'Blockchain-powered proof that cannot be tampered with or forged.',
        privacyFirst: 'Privacy First',
        privacyFirstDesc:
          "We don't store your documents. Only cryptographic fingerprints go onchain.",
        aiPowered: 'AI-Powered Verification',
        aiPoweredDesc:
          'AI helps you verify things. It checks if instance addresses match URLs registered onchain for enhanced security.',
        forEveryone: 'For Everyone',
        forEveryoneDesc:
          'Perfect for organizations, businesses, and individuals who need document authenticity.',
        antiFraud: 'Anti-Fraud Protection',
        antiFraudDesc:
          'Combat the billions in annual losses from fake documents with blockchain verification.',
      },
      documentTypes: {
        title: 'Works with Any Document Type',
        pdfs: 'PDFs',
        images: 'Images',
        videos: 'Videos',
        anyFile: 'Any File',
      },
      howItWorks: {
        title: 'How It Works',
        step1Title: 'Publish Digital Footprint',
        step1Desc:
          'Upload any document type and we create a unique cryptographic fingerprint that goes onchain',
        step2Title: 'Anyone Can Verify',
        step2Desc:
          'Share the document with anyone - they can instantly verify its authenticity with AI assistance',
        step3Title: 'Guaranteed Authenticity',
        step3Desc:
          'Prove a statement was made by you with immutable blockchain evidence and AI verification',
      },
      trust: {
        noStorage: "We Don't Store Your Documents",
        noStorageDesc:
          'Your files never leave your device. Only mathematical proofs are recorded onchain.',
        guaranteeAuthorship: 'Guarantee Authorship',
        guaranteeAuthorshipDesc:
          "Cryptographically prove a statement was made by you at a specific time. That's the magic of Web3.",
      },
      roadmap: {
        title: 'Roadmap',
        publicDocuments: 'Public documents',
        publicDocumentsDesc:
          'Public documents stored in a decentralized fashion for permanent accessibility, transparency, and more',
        digitalAgreements: 'Digital Agreements',
        digitalAgreementsDesc: 'DocuSign-style functionality for agreements and contract signing',
        mainnetLaunch: 'Mainnet Launch',
        mainnetLaunchDesc:
          "We're in contact with several institutions in Burkina Faso. They're ready to deploy their own instance...",
        comingSoon: 'Coming Soon',
      },
      cta: {
        title: 'Ready to Authenticate Your Documents with Affix?',
        description:
          'Join us in the fight against document fraud. Get started today or reach out to learn more.',
        contactButton: 'Contact Us',
      },
    },
    navigation: {
      settings: 'Settings',
      dashboard: 'Dashboard',
      verify: 'Verify',
      sandbox: 'Sandbox',
    },
    settings: {
      title: 'Settings',
      loginRequired: 'Please login to access your settings',
    },
    dashboard: {
      title: 'Welcome to Your Dashboard',
      subtitle: 'Manage your documents and permissions',
      loginPrompt: 'Please login',
      exploreWithout: 'Want to explore without logging in?',
      tryThe: 'Try the',
      toExplore: 'to explore the platform',
      checkingPermissions: 'Checking permissions...',
      welcome: 'Welcome',
      yourAddress: 'Your Address:',
      issueDocument: {
        title: 'Issue Document',
        issueOnBehalf: 'Issue a document on behalf of',
        contractAddress: 'Contract address',
        clickToUpload: 'Click to upload document',
        documentCID: 'Document CID',
        issueButton: 'Issue Document',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
        cidGenerated: 'CID Generated',
        cidGeneratedDesc: 'Document hash computed successfully',
        error: 'Error',
        computeError: 'Failed to compute document hash',
        noDocument: 'No document',
        noDocumentDesc: 'Please upload a document first',
        notAuthenticated: 'Not authenticated',
        notAuthenticatedDesc: 'Please login to issue documents',
        txSubmitted: 'Transaction Submitted',
        txHash: 'Hash',
        success: 'Document Issued Successfully',
        viewTxOn: 'View transaction on',
        viewTx: 'View Transaction',
        failed: 'Issuance Failed',
      },
      addAgent: {
        title: 'Add Agent',
        agentAddress: 'Agent Address',
        placeholder: 'Enter the Ethereum address of the new agent',
        addButton: 'Add as Agent',
        registryContract: 'Registry Contract',
        noAddress: 'No address provided',
        noAddressDesc: 'Please enter an address',
        invalidAddress: 'Invalid address',
        invalidAddressDesc: 'Please enter a valid Ethereum address',
        noRegistry: 'No registry found',
        noRegistryDesc: 'Cannot add agent without a registry address',
        alreadyAgent: 'Already an Agent',
        notAuthenticated: 'Not Authenticated',
        success: 'Agent Created',
        failed: 'Failed to Make Agent',
      },
    },
    verify: {
      title: 'Verify Documents',
      subtitle: 'Verify document authenticity.',
      upload: {
        dropHere: 'Drop your document here, or',
        supportsAny: 'Supports any file format',
        noDocument: 'No document provided',
        noDocumentDesc: 'Please upload a file or enter a document CID/hash',
        copied: 'Copied to clipboard',
        clickToCopy: 'Click to copy - This CID will be used for verification',
      },
      progress: {
        computing: 'Computing document hash (CID)...',
        checking: 'Checking registry...',
        aiVerifying: 'Document found! Performing AI verification...',
        complete: 'Verification complete!',
      },
      results: {
        title: 'Verification Results',
        verified: 'Document Verified!',
        notFound: 'Not Found',
        verifiedBadge: 'VERIFIED',
        unverifiedBadge: 'UNVERIFIED',
        issuedOn: 'Issued On',
        issuedBy: 'Issued By',
        entityUrl: 'Entity URL',
        metadata: 'Metadata',
        registryAddress: 'Registry Address',
        aiVerification: 'AI Verification',
        registryVerified: 'Registry address verified on entity website',
        registryNotVerified: 'Could not verify registry address on entity website',
      },
      toast: {
        verified: 'Document Verified!',
        foundIn: 'Found in',
        notFound: 'Document Not Found',
        notFoundDesc: 'This document has not been registered on the blockchain',
        failed: 'Verification Failed',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
      },
    },
    sandbox: {
      title: 'Sandbox',
      subtitle: 'Explore and experiment with the Affix platform (soon)',
    },
    errors: {
      somethingWrong: 'Something went wrong!',
      apology:
        'We apologize for the inconvenience. An error occurred while processing your request.',
      errorDetails: 'Error Details:',
      errorId: 'Error ID:',
      tryAgain: 'Try Again',
      persistProblem: 'If the problem persists, please refresh the page or',
      contactSupport: 'contact support',
    },
    notFound: {
      code: '404',
      title: 'Page Not Found',
      description: "The page you're looking for doesn't exist.",
      returnHome: 'Return Home',
    },
    components: {
      header: {
        registerTitle: 'Register New Account',
        registerDesc:
          'An Ethereum wallet will be created and securely stored on your device, protected by your biometric or PIN thanks to',
        w3pk: 'w3pk',
        username: 'Username',
        usernamePlaceholder: 'Enter your username',
        usernameValidation:
          'Username must be 3-50 characters long and contain only letters, numbers, underscores, and hyphens. It must start and end with a letter or number.',
        createAccount: 'Create Account',
        usernameRequired: 'Username Required',
        usernameRequiredDesc: 'Please enter a username to register.',
        registrationFailed: 'Registration Failed',
        registrationFailedDesc: 'Unable to complete registration. Please try again.',
      },
      passwordModal: {
        password: 'Password',
        placeholder: 'Enter your password',
        passwordRequired: 'Password Required.',
        passwordRequiredDesc: 'Please enter your password.',
        weakPassword: 'Weak Password.',
        weakPasswordDesc: 'Please use a stronger password that meets all requirements.',
        submissionError: 'Submission Error.',
        passwordMustInclude: 'Password must include:',
        atLeast12: 'At least 12 characters',
        oneUppercase: 'One uppercase letter',
        oneLowercase: 'One lowercase letter',
        oneNumber: 'One number',
        oneSpecial: 'One special character',
        notMeetRequirements: 'Password does not meet all requirements',
        strongPassword: 'Strong password!',
        satisfied: '(satisfied)',
        required: '(required)',
      },
    },
  },

  // Mandarin Chinese
  zh: {
    common: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      pleaseLogin: 'Please login',
      cancel: 'Cancel',
      submit: 'Submit',
      copy: 'Copy',
      view: 'View',
      remove: 'Remove',
      tryAgain: 'Try Again',
      browse: 'browse',
    },
    home: {
      title: 'Welcome!',
      subtitle: "It's a pleasure to have you here!",
      greeting: 'Hello Anon!',
      greetingSubtitle: 'Sit back, relax, and build something cool!',
      hero: {
        tagline: 'your onchain seal',
        letTheWorld: 'Let the world',
        verify: 'verify',
        it: 'it',
        description:
          'Authenticate your documents onchain while keeping your existing workflows intact. Anyone can then instantly verify that documents are genuine and unaltered.',
        dashboardButton: 'Your Dashboard',
        verifyButton: 'Verify',
      },
      problem: {
        title: 'The Document Fraud Epidemic...',
        description:
          'Fake documents cause billions of dollars in losses every year. From fraudulent certificates to forged contracts, document verification is broken. Web3 fixes this.',
      },
      features: {
        title: 'Discover Affix!',
        easyToVerify: 'Easy to Verify',
        easyToVerifyDesc:
          'One-click verification for anyone, anywhere. No technical knowledge required.',
        unbreakableSecurity: 'Unbreakable Security',
        unbreakableSecurityDesc: 'Blockchain-powered proof that cannot be tampered with or forged.',
        privacyFirst: 'Privacy First',
        privacyFirstDesc:
          "We don't store your documents. Only cryptographic fingerprints go onchain.",
        aiPowered: 'AI-Powered Verification',
        aiPoweredDesc:
          'AI helps you verify things. It checks if instance addresses match URLs registered onchain for enhanced security.',
        forEveryone: 'For Everyone',
        forEveryoneDesc:
          'Perfect for organizations, businesses, and individuals who need document authenticity.',
        antiFraud: 'Anti-Fraud Protection',
        antiFraudDesc:
          'Combat the billions in annual losses from fake documents with blockchain verification.',
      },
      documentTypes: {
        title: 'Works with Any Document Type',
        pdfs: 'PDFs',
        images: 'Images',
        videos: 'Videos',
        anyFile: 'Any File',
      },
      howItWorks: {
        title: 'How It Works',
        step1Title: 'Publish Digital Footprint',
        step1Desc:
          'Upload any document type and we create a unique cryptographic fingerprint that goes onchain',
        step2Title: 'Anyone Can Verify',
        step2Desc:
          'Share the document with anyone - they can instantly verify its authenticity with AI assistance',
        step3Title: 'Guaranteed Authenticity',
        step3Desc:
          'Prove a statement was made by you with immutable blockchain evidence and AI verification',
      },
      trust: {
        noStorage: "We Don't Store Your Documents",
        noStorageDesc:
          'Your files never leave your device. Only mathematical proofs are recorded onchain.',
        guaranteeAuthorship: 'Guarantee Authorship',
        guaranteeAuthorshipDesc:
          "Cryptographically prove a statement was made by you at a specific time. That's the magic of Web3.",
      },
      roadmap: {
        title: 'Roadmap',
        publicDocuments: 'Public documents',
        publicDocumentsDesc:
          'Public documents stored in a decentralized fashion for permanent accessibility, transparency, and more',
        digitalAgreements: 'Digital Agreements',
        digitalAgreementsDesc: 'DocuSign-style functionality for agreements and contract signing',
        mainnetLaunch: 'Mainnet Launch',
        mainnetLaunchDesc:
          "We're in contact with several institutions in Burkina Faso. They're ready to deploy their own instance...",
        comingSoon: 'Coming Soon',
      },
      cta: {
        title: 'Ready to Authenticate Your Documents with Affix?',
        description:
          'Join us in the fight against document fraud. Get started today or reach out to learn more.',
        contactButton: 'Contact Us',
      },
    },
    navigation: {
      settings: 'Settings',
      dashboard: 'Dashboard',
      verify: 'Verify',
      sandbox: 'Sandbox',
    },
    settings: {
      title: 'Settings',
      loginRequired: 'Please login to access your settings',
    },
    dashboard: {
      title: 'Welcome to Your Dashboard',
      subtitle: 'Manage your documents and permissions',
      loginPrompt: 'Please login',
      exploreWithout: 'Want to explore without logging in?',
      tryThe: 'Try the',
      toExplore: 'to explore the platform',
      checkingPermissions: 'Checking permissions...',
      welcome: 'Welcome',
      yourAddress: 'Your Address:',
      issueDocument: {
        title: 'Issue Document',
        issueOnBehalf: 'Issue a document on behalf of',
        contractAddress: 'Contract address',
        clickToUpload: 'Click to upload document',
        documentCID: 'Document CID',
        issueButton: 'Issue Document',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
        cidGenerated: 'CID Generated',
        cidGeneratedDesc: 'Document hash computed successfully',
        error: 'Error',
        computeError: 'Failed to compute document hash',
        noDocument: 'No document',
        noDocumentDesc: 'Please upload a document first',
        notAuthenticated: 'Not authenticated',
        notAuthenticatedDesc: 'Please login to issue documents',
        txSubmitted: 'Transaction Submitted',
        txHash: 'Hash',
        success: 'Document Issued Successfully',
        viewTxOn: 'View transaction on',
        viewTx: 'View Transaction',
        failed: 'Issuance Failed',
      },
      addAgent: {
        title: 'Add Agent',
        agentAddress: 'Agent Address',
        placeholder: 'Enter the Ethereum address of the new agent',
        addButton: 'Add as Agent',
        registryContract: 'Registry Contract',
        noAddress: 'No address provided',
        noAddressDesc: 'Please enter an address',
        invalidAddress: 'Invalid address',
        invalidAddressDesc: 'Please enter a valid Ethereum address',
        noRegistry: 'No registry found',
        noRegistryDesc: 'Cannot add agent without a registry address',
        alreadyAgent: 'Already an Agent',
        notAuthenticated: 'Not Authenticated',
        success: 'Agent Created',
        failed: 'Failed to Make Agent',
      },
    },
    verify: {
      title: 'Verify Documents',
      subtitle: 'Verify document authenticity.',
      upload: {
        dropHere: 'Drop your document here, or',
        supportsAny: 'Supports any file format',
        noDocument: 'No document provided',
        noDocumentDesc: 'Please upload a file or enter a document CID/hash',
        copied: 'Copied to clipboard',
        clickToCopy: 'Click to copy - This CID will be used for verification',
      },
      progress: {
        computing: 'Computing document hash (CID)...',
        checking: 'Checking registry...',
        aiVerifying: 'Document found! Performing AI verification...',
        complete: 'Verification complete!',
      },
      results: {
        title: 'Verification Results',
        verified: 'Document Verified!',
        notFound: 'Not Found',
        verifiedBadge: 'VERIFIED',
        unverifiedBadge: 'UNVERIFIED',
        issuedOn: 'Issued On',
        issuedBy: 'Issued By',
        entityUrl: 'Entity URL',
        metadata: 'Metadata',
        registryAddress: 'Registry Address',
        aiVerification: 'AI Verification',
        registryVerified: 'Registry address verified on entity website',
        registryNotVerified: 'Could not verify registry address on entity website',
      },
      toast: {
        verified: 'Document Verified!',
        foundIn: 'Found in',
        notFound: 'Document Not Found',
        notFoundDesc: 'This document has not been registered on the blockchain',
        failed: 'Verification Failed',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
      },
    },
    sandbox: {
      title: 'Sandbox',
      subtitle: 'Explore and experiment with the Affix platform (soon)',
    },
    errors: {
      somethingWrong: 'Something went wrong!',
      apology:
        'We apologize for the inconvenience. An error occurred while processing your request.',
      errorDetails: 'Error Details:',
      errorId: 'Error ID:',
      tryAgain: 'Try Again',
      persistProblem: 'If the problem persists, please refresh the page or',
      contactSupport: 'contact support',
    },
    notFound: {
      code: '404',
      title: 'Page Not Found',
      description: "The page you're looking for doesn't exist.",
      returnHome: 'Return Home',
    },
    components: {
      header: {
        registerTitle: 'Register New Account',
        registerDesc:
          'An Ethereum wallet will be created and securely stored on your device, protected by your biometric or PIN thanks to',
        w3pk: 'w3pk',
        username: 'Username',
        usernamePlaceholder: 'Enter your username',
        usernameValidation:
          'Username must be 3-50 characters long and contain only letters, numbers, underscores, and hyphens. It must start and end with a letter or number.',
        createAccount: 'Create Account',
        usernameRequired: 'Username Required',
        usernameRequiredDesc: 'Please enter a username to register.',
        registrationFailed: 'Registration Failed',
        registrationFailedDesc: 'Unable to complete registration. Please try again.',
      },
      passwordModal: {
        password: 'Password',
        placeholder: 'Enter your password',
        passwordRequired: 'Password Required.',
        passwordRequiredDesc: 'Please enter your password.',
        weakPassword: 'Weak Password.',
        weakPasswordDesc: 'Please use a stronger password that meets all requirements.',
        submissionError: 'Submission Error.',
        passwordMustInclude: 'Password must include:',
        atLeast12: 'At least 12 characters',
        oneUppercase: 'One uppercase letter',
        oneLowercase: 'One lowercase letter',
        oneNumber: 'One number',
        oneSpecial: 'One special character',
        notMeetRequirements: 'Password does not meet all requirements',
        strongPassword: 'Strong password!',
        satisfied: '(satisfied)',
        required: '(required)',
      },
    },
  },

  // Hindi
  hi: {
    common: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      pleaseLogin: 'Please login',
      cancel: 'Cancel',
      submit: 'Submit',
      copy: 'Copy',
      view: 'View',
      remove: 'Remove',
      tryAgain: 'Try Again',
      browse: 'browse',
    },
    home: {
      title: 'Welcome!',
      subtitle: "It's a pleasure to have you here!",
      greeting: 'Hello Anon!',
      greetingSubtitle: 'Sit back, relax, and build something cool!',
      hero: {
        tagline: 'your onchain seal',
        letTheWorld: 'Let the world',
        verify: 'verify',
        it: 'it',
        description:
          'Authenticate your documents onchain while keeping your existing workflows intact. Anyone can then instantly verify that documents are genuine and unaltered.',
        dashboardButton: 'Your Dashboard',
        verifyButton: 'Verify',
      },
      problem: {
        title: 'The Document Fraud Epidemic...',
        description:
          'Fake documents cause billions of dollars in losses every year. From fraudulent certificates to forged contracts, document verification is broken. Web3 fixes this.',
      },
      features: {
        title: 'Discover Affix!',
        easyToVerify: 'Easy to Verify',
        easyToVerifyDesc:
          'One-click verification for anyone, anywhere. No technical knowledge required.',
        unbreakableSecurity: 'Unbreakable Security',
        unbreakableSecurityDesc: 'Blockchain-powered proof that cannot be tampered with or forged.',
        privacyFirst: 'Privacy First',
        privacyFirstDesc:
          "We don't store your documents. Only cryptographic fingerprints go onchain.",
        aiPowered: 'AI-Powered Verification',
        aiPoweredDesc:
          'AI helps you verify things. It checks if instance addresses match URLs registered onchain for enhanced security.',
        forEveryone: 'For Everyone',
        forEveryoneDesc:
          'Perfect for organizations, businesses, and individuals who need document authenticity.',
        antiFraud: 'Anti-Fraud Protection',
        antiFraudDesc:
          'Combat the billions in annual losses from fake documents with blockchain verification.',
      },
      documentTypes: {
        title: 'Works with Any Document Type',
        pdfs: 'PDFs',
        images: 'Images',
        videos: 'Videos',
        anyFile: 'Any File',
      },
      howItWorks: {
        title: 'How It Works',
        step1Title: 'Publish Digital Footprint',
        step1Desc:
          'Upload any document type and we create a unique cryptographic fingerprint that goes onchain',
        step2Title: 'Anyone Can Verify',
        step2Desc:
          'Share the document with anyone - they can instantly verify its authenticity with AI assistance',
        step3Title: 'Guaranteed Authenticity',
        step3Desc:
          'Prove a statement was made by you with immutable blockchain evidence and AI verification',
      },
      trust: {
        noStorage: "We Don't Store Your Documents",
        noStorageDesc:
          'Your files never leave your device. Only mathematical proofs are recorded onchain.',
        guaranteeAuthorship: 'Guarantee Authorship',
        guaranteeAuthorshipDesc:
          "Cryptographically prove a statement was made by you at a specific time. That's the magic of Web3.",
      },
      roadmap: {
        title: 'Roadmap',
        publicDocuments: 'Public documents',
        publicDocumentsDesc:
          'Public documents stored in a decentralized fashion for permanent accessibility, transparency, and more',
        digitalAgreements: 'Digital Agreements',
        digitalAgreementsDesc: 'DocuSign-style functionality for agreements and contract signing',
        mainnetLaunch: 'Mainnet Launch',
        mainnetLaunchDesc:
          "We're in contact with several institutions in Burkina Faso. They're ready to deploy their own instance...",
        comingSoon: 'Coming Soon',
      },
      cta: {
        title: 'Ready to Authenticate Your Documents with Affix?',
        description:
          'Join us in the fight against document fraud. Get started today or reach out to learn more.',
        contactButton: 'Contact Us',
      },
    },
    navigation: {
      settings: 'Settings',
      dashboard: 'Dashboard',
      verify: 'Verify',
      sandbox: 'Sandbox',
    },
    settings: {
      title: 'Settings',
      loginRequired: 'Please login to access your settings',
    },
    dashboard: {
      title: 'Welcome to Your Dashboard',
      subtitle: 'Manage your documents and permissions',
      loginPrompt: 'Please login',
      exploreWithout: 'Want to explore without logging in?',
      tryThe: 'Try the',
      toExplore: 'to explore the platform',
      checkingPermissions: 'Checking permissions...',
      welcome: 'Welcome',
      yourAddress: 'Your Address:',
      issueDocument: {
        title: 'Issue Document',
        issueOnBehalf: 'Issue a document on behalf of',
        contractAddress: 'Contract address',
        clickToUpload: 'Click to upload document',
        documentCID: 'Document CID',
        issueButton: 'Issue Document',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
        cidGenerated: 'CID Generated',
        cidGeneratedDesc: 'Document hash computed successfully',
        error: 'Error',
        computeError: 'Failed to compute document hash',
        noDocument: 'No document',
        noDocumentDesc: 'Please upload a document first',
        notAuthenticated: 'Not authenticated',
        notAuthenticatedDesc: 'Please login to issue documents',
        txSubmitted: 'Transaction Submitted',
        txHash: 'Hash',
        success: 'Document Issued Successfully',
        viewTxOn: 'View transaction on',
        viewTx: 'View Transaction',
        failed: 'Issuance Failed',
      },
      addAgent: {
        title: 'Add Agent',
        agentAddress: 'Agent Address',
        placeholder: 'Enter the Ethereum address of the new agent',
        addButton: 'Add as Agent',
        registryContract: 'Registry Contract',
        noAddress: 'No address provided',
        noAddressDesc: 'Please enter an address',
        invalidAddress: 'Invalid address',
        invalidAddressDesc: 'Please enter a valid Ethereum address',
        noRegistry: 'No registry found',
        noRegistryDesc: 'Cannot add agent without a registry address',
        alreadyAgent: 'Already an Agent',
        notAuthenticated: 'Not Authenticated',
        success: 'Agent Created',
        failed: 'Failed to Make Agent',
      },
    },
    verify: {
      title: 'Verify Documents',
      subtitle: 'Verify document authenticity.',
      upload: {
        dropHere: 'Drop your document here, or',
        supportsAny: 'Supports any file format',
        noDocument: 'No document provided',
        noDocumentDesc: 'Please upload a file or enter a document CID/hash',
        copied: 'Copied to clipboard',
        clickToCopy: 'Click to copy - This CID will be used for verification',
      },
      progress: {
        computing: 'Computing document hash (CID)...',
        checking: 'Checking registry...',
        aiVerifying: 'Document found! Performing AI verification...',
        complete: 'Verification complete!',
      },
      results: {
        title: 'Verification Results',
        verified: 'Document Verified!',
        notFound: 'Not Found',
        verifiedBadge: 'VERIFIED',
        unverifiedBadge: 'UNVERIFIED',
        issuedOn: 'Issued On',
        issuedBy: 'Issued By',
        entityUrl: 'Entity URL',
        metadata: 'Metadata',
        registryAddress: 'Registry Address',
        aiVerification: 'AI Verification',
        registryVerified: 'Registry address verified on entity website',
        registryNotVerified: 'Could not verify registry address on entity website',
      },
      toast: {
        verified: 'Document Verified!',
        foundIn: 'Found in',
        notFound: 'Document Not Found',
        notFoundDesc: 'This document has not been registered on the blockchain',
        failed: 'Verification Failed',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
      },
    },
    sandbox: {
      title: 'Sandbox',
      subtitle: 'Explore and experiment with the Affix platform (soon)',
    },
    errors: {
      somethingWrong: 'Something went wrong!',
      apology:
        'We apologize for the inconvenience. An error occurred while processing your request.',
      errorDetails: 'Error Details:',
      errorId: 'Error ID:',
      tryAgain: 'Try Again',
      persistProblem: 'If the problem persists, please refresh the page or',
      contactSupport: 'contact support',
    },
    notFound: {
      code: '404',
      title: 'Page Not Found',
      description: "The page you're looking for doesn't exist.",
      returnHome: 'Return Home',
    },
    components: {
      header: {
        registerTitle: 'Register New Account',
        registerDesc:
          'An Ethereum wallet will be created and securely stored on your device, protected by your biometric or PIN thanks to',
        w3pk: 'w3pk',
        username: 'Username',
        usernamePlaceholder: 'Enter your username',
        usernameValidation:
          'Username must be 3-50 characters long and contain only letters, numbers, underscores, and hyphens. It must start and end with a letter or number.',
        createAccount: 'Create Account',
        usernameRequired: 'Username Required',
        usernameRequiredDesc: 'Please enter a username to register.',
        registrationFailed: 'Registration Failed',
        registrationFailedDesc: 'Unable to complete registration. Please try again.',
      },
      passwordModal: {
        password: 'Password',
        placeholder: 'Enter your password',
        passwordRequired: 'Password Required.',
        passwordRequiredDesc: 'Please enter your password.',
        weakPassword: 'Weak Password.',
        weakPasswordDesc: 'Please use a stronger password that meets all requirements.',
        submissionError: 'Submission Error.',
        passwordMustInclude: 'Password must include:',
        atLeast12: 'At least 12 characters',
        oneUppercase: 'One uppercase letter',
        oneLowercase: 'One lowercase letter',
        oneNumber: 'One number',
        oneSpecial: 'One special character',
        notMeetRequirements: 'Password does not meet all requirements',
        strongPassword: 'Strong password!',
        satisfied: '(satisfied)',
        required: '(required)',
      },
    },
  },

  // French
  fr: {
    common: {
      login: 'Connexion',
      logout: 'Déconnexion',
      register: "S'inscrire",
      pleaseLogin: 'Veuillez vous connecter',
      cancel: 'Annuler',
      submit: 'Envoyer',
      copy: 'Copier',
      view: 'Voir',
      remove: 'Supprimer',
      tryAgain: 'Réessayer',
      browse: 'parcourir',
    },
    home: {
      title: 'Bienvenue !',
      subtitle: "C'est un plaisir de vous avoir ici !",
      greeting: 'Bonjour Anon !',
      greetingSubtitle: 'Détendez-vous et créez quelque chose de cool !',
      hero: {
        tagline: 'Apposer votre sceau',
        letTheWorld: 'Tout le monde peut',
        verify: 'vérifier',
        it: 'ça',
        description:
          "Authentifiez vos documents sur la blockchain sans changer vos habitudes de travail. N'importe qui peut ensuite vérifier instantanément que les documents sont authentiques et non altérés.",
        dashboardButton: 'Dashboard',
        verifyButton: 'Vérifier',
      },
      problem: {
        title: 'Une épidémie de fraude aux documents...',
        description:
          'Les faux documents causent des milliards de pertes chaque année. Des certificats frauduleux aux contrats falsifiés, les faux documents sont un vrai problème. Affix résout ce problème.',
      },
      features: {
        title: 'Découvrez Affix !',
        easyToVerify: 'Facile à vérifier',
        easyToVerifyDesc:
          'Vérification en un clic pour tous, partout. Aucune connaissance technique requise.',
        unbreakableSecurity: 'Sécurité inviolable',
        unbreakableSecurityDesc:
          'Les preuve enregistrées sur la blockchain. Rien ni personne ne peut les altérer.',
        privacyFirst: 'Confidentialité maximum',
        privacyFirstDesc:
          'Nous ne stockons pas vos documents. Seules les empreintes cryptographiques sont enregistrées sur la blockchain.',
        aiPowered: 'Vérification par IA',
        aiPoweredDesc:
          "L'assistant vérifie si les adresses d'instance correspondent aux URL enregistrées onchain pour une sécurité renforcée.",
        forEveryone: 'Pour tous',
        forEveryoneDesc:
          "Parfait pour les organisations, les entreprises et les particuliers qui ont besoin d'émettre des documents officiels.",
        antiFraud: 'Protection anti-fraude',
        antiFraudDesc:
          'Combattez les milliards de pertes annuelles dues aux faux documents grâce à Affix.',
      },
      documentTypes: {
        title: 'Fonctionne avec tous les types de documents',
        pdfs: 'PDF',
        images: 'Images',
        videos: 'Vidéos',
        anyFile: 'Tout Fichier',
      },
      howItWorks: {
        title: 'Comment ça marche',
        step1Title: "Publier l'empreinte numérique",
        step1Desc:
          "Téléchargez n'importe quel type de document et nous créons une empreinte cryptographique unique qui va en chaîne",
        step2Title: 'Tout le monde peut vérifier',
        step2Desc:
          "Partagez le document avec n'importe qui - ils peuvent vérifier instantanément son authenticité avec l'assistance de l'IA",
        step3Title: 'Authenticité garantie',
        step3Desc:
          "Prouvez qu'une déclaration a été faite par vous avec des preuves blockchain immuables et une vérification IA",
      },
      trust: {
        noStorage: 'Nous ne stockons pas vos documents',
        noStorageDesc:
          'Vos fichiers ne quittent jamais votre appareil. Seules les preuves mathématiques sont enregistrées en chaîne.',
        guaranteeAuthorship: 'Garantir la paternité',
        guaranteeAuthorshipDesc:
          "Prouvez cryptographiquement qu'une déclaration a été faite par vous à un moment précis. C'est toute la magie du Web3.",
      },
      roadmap: {
        title: 'Feuille de Route',
        publicDocuments: 'Documents publics',
        publicDocumentsDesc:
          'Documents publics stockés de manière décentralisée pour une accessibilité permanente, la transparence et plus encore',
        digitalAgreements: 'Signatures numériques',
        digitalAgreementsDesc:
          'Fonctionnalité de type DocuSign pour les accords et la signature de contrats',
        mainnetLaunch: 'Lancement sur Mainnet',
        mainnetLaunchDesc:
          'Nous sommes en contact avec plusieurs institutions au Burkina Faso. Elles sont prêtes à déployer leur propre instance...',
        comingSoon: 'Soon',
      },
      cta: {
        title: 'Prêt à authentifier vos documents avec Affix ?',
        description:
          "Rejoignez-nous dans la lutte contre la fraude documentaire. Commencez dès aujourd'hui ou contactez-nous pour en savoir plus.",
        contactButton: 'Contactez-nous',
      },
    },
    navigation: {
      settings: 'Paramètres',
      dashboard: 'Dashboard',
      verify: 'Vérifier',
      sandbox: 'Sandbox',
    },
    settings: {
      title: 'Paramètres',
      loginRequired: 'Veuillez vous connecter pour accéder à vos paramètres',
    },
    dashboard: {
      title: 'Bienvenue sur votre dashboard',
      subtitle: 'Gérez vos documents et permissions',
      loginPrompt: 'Veuillez vous connecter',
      exploreWithout: 'Vous voulez explorer sans vous connecter ?',
      tryThe: 'Essayez le',
      toExplore: 'pour explorer la plateforme',
      checkingPermissions: 'Vérification des permissions...',
      welcome: 'Bienvenue',
      yourAddress: 'Votre adresse :',
      issueDocument: {
        title: 'Émettre un document',
        issueOnBehalf: 'Émettre un document au nom de',
        contractAddress: 'Adresse du contrat',
        clickToUpload: 'Cliquez pour télécharger un document',
        documentCID: 'CID du Document',
        issueButton: 'Émettre le Document',
        fileTooLarge: 'Fichier trop volumineux',
        fileTooLargeDesc: 'Veuillez sélectionner un fichier de moins de 10 Mo',
        cidGenerated: 'CID Généré',
        cidGeneratedDesc: 'Hash du document calculé avec succès',
        error: 'Erreur',
        computeError: 'Échec du calcul du hash du document',
        noDocument: 'Aucun document',
        noDocumentDesc: "Veuillez d'abord télécharger un document",
        notAuthenticated: 'Non authentifié',
        notAuthenticatedDesc: 'Veuillez vous connecter pour émettre des documents',
        txSubmitted: 'Transaction Soumise',
        txHash: 'Hash',
        success: 'Document Émis avec Succès',
        viewTxOn: 'Voir la transaction sur',
        viewTx: 'Voir la Transaction',
        failed: "Échec de l'Émission",
      },
      addAgent: {
        title: 'Ajouter un agent',
        agentAddress: "Adresse de l'agent",
        placeholder: "Entrez l'adresse Ethereum du nouvel agent",
        addButton: 'Ajouter comme agent',
        registryContract: 'Contrat de registre',
        noAddress: 'Aucune adresse fournie',
        noAddressDesc: 'Veuillez entrer une adresse',
        invalidAddress: 'Adresse invalide',
        invalidAddressDesc: 'Veuillez entrer une adresse Ethereum valide',
        noRegistry: 'Aucun registre trouvé',
        noRegistryDesc: "Impossible d'ajouter un agent sans adresse de registre",
        alreadyAgent: 'Déjà un agent',
        notAuthenticated: 'Non authentifié',
        success: 'Agent créé',
        failed: "Échec de la création de l'agent",
      },
    },
    verify: {
      title: 'Vérifier un document',
      subtitle: "Vérifiez l'authenticité d'un document.",
      upload: {
        dropHere: 'Déposez votre document ici, ou',
        supportsAny: 'Prend en charge tous les formats de fichiers',
        noDocument: 'Aucun document fourni',
        noDocumentDesc: 'Veuillez télécharger un fichier ou entrer un CID/hash de document',
        copied: 'Copié dans le presse-papiers',
        clickToCopy: 'Cliquez pour copier - Ce CID sera utilisé pour la vérification',
      },
      progress: {
        computing: 'Calcul du hash du document (CID)...',
        checking: 'Vérification du registre...',
        aiVerifying: 'Document trouvé ! Exécution de la vérification IA...',
        complete: 'Vérification terminée !',
      },
      results: {
        title: 'Résultats de la Vérification',
        verified: 'Document Vérifié !',
        notFound: 'Non Trouvé',
        verifiedBadge: 'VÉRIFIÉ',
        unverifiedBadge: 'NON VÉRIFIÉ',
        issuedOn: 'Émis le',
        issuedBy: 'Émis par',
        entityUrl: "URL de l'Entité",
        metadata: 'Métadonnées',
        registryAddress: 'Adresse du Registre',
        aiVerification: 'Vérification IA',
        registryVerified: "Adresse du registre vérifiée sur le site web de l'entité",
        registryNotVerified:
          "Impossible de vérifier l'adresse du registre sur le site web de l'entité",
      },
      toast: {
        verified: 'Document Vérifié !',
        foundIn: 'Trouvé dans',
        notFound: 'Document Non Trouvé',
        notFoundDesc: "Ce document n'a pas été enregistré sur la blockchain",
        failed: 'Échec de la Vérification',
        fileTooLarge: 'Fichier trop volumineux',
        fileTooLargeDesc: 'Veuillez sélectionner un fichier de moins de 10 Mo',
      },
    },
    sandbox: {
      title: 'Sandbox',
      subtitle: 'Explorez et expérimentez Affix (soon)',
    },
    errors: {
      somethingWrong: "Quelque chose s'est mal passé !",
      apology:
        "Nous nous excusons pour le désagrément. Une erreur s'est produite lors du traitement de votre demande.",
      errorDetails: "Détails de l'Erreur :",
      errorId: "ID de l'Erreur :",
      tryAgain: 'Réessayer',
      persistProblem: 'Si le problème persiste, veuillez actualiser la page ou',
      contactSupport: 'contacter le support',
    },
    notFound: {
      code: '404',
      title: 'Page Non Trouvée',
      description: "La page que vous recherchez n'existe pas.",
      returnHome: "Retour à l'Accueil",
    },
    components: {
      header: {
        registerTitle: 'Créer un Nouveau Compte',
        registerDesc:
          'Un portefeuille Ethereum sera créé et stocké en toute sécurité sur votre appareil, protégé par votre biométrie ou code PIN grâce à',
        w3pk: 'w3pk',
        username: "Nom d'utilisateur",
        usernamePlaceholder: "Entrez votre nom d'utilisateur",
        usernameValidation:
          "Le nom d'utilisateur doit contenir entre 3 et 50 caractères et ne contenir que des lettres, des chiffres, des tirets bas et des traits d'union. Il doit commencer et se terminer par une lettre ou un chiffre.",
        createAccount: 'Créer un Compte',
        usernameRequired: "Nom d'utilisateur Requis",
        usernameRequiredDesc: "Veuillez entrer un nom d'utilisateur pour vous inscrire.",
        registrationFailed: "Échec de l'Inscription",
        registrationFailedDesc: "Impossible de terminer l'inscription. Veuillez réessayer.",
      },
      passwordModal: {
        password: 'Mot de passe',
        placeholder: 'Entrez votre mot de passe',
        passwordRequired: 'Mot de passe Requis.',
        passwordRequiredDesc: 'Veuillez entrer votre mot de passe.',
        weakPassword: 'Mot de passe Faible.',
        weakPasswordDesc:
          'Veuillez utiliser un mot de passe plus fort qui répond à toutes les exigences.',
        submissionError: 'Erreur de Soumission.',
        passwordMustInclude: 'Le mot de passe doit inclure :',
        atLeast12: 'Au moins 12 caractères',
        oneUppercase: 'Une lettre majuscule',
        oneLowercase: 'Une lettre minuscule',
        oneNumber: 'Un chiffre',
        oneSpecial: 'Un caractère spécial',
        notMeetRequirements: 'Le mot de passe ne répond pas à toutes les exigences',
        strongPassword: 'Mot de passe fort !',
        satisfied: '(satisfait)',
        required: '(requis)',
      },
    },
  },

  // Spanish
  es: {
    common: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      pleaseLogin: 'Please login',
      cancel: 'Cancel',
      submit: 'Submit',
      copy: 'Copy',
      view: 'View',
      remove: 'Remove',
      tryAgain: 'Try Again',
      browse: 'browse',
    },
    home: {
      title: 'Welcome!',
      subtitle: "It's a pleasure to have you here!",
      greeting: 'Hello Anon!',
      greetingSubtitle: 'Sit back, relax, and build something cool!',
      hero: {
        tagline: 'your onchain seal',
        letTheWorld: 'Let the world',
        verify: 'verify',
        it: 'it',
        description:
          'Authenticate your documents onchain while keeping your existing workflows intact. Anyone can then instantly verify that documents are genuine and unaltered.',
        dashboardButton: 'Your Dashboard',
        verifyButton: 'Verify',
      },
      problem: {
        title: 'The Document Fraud Epidemic...',
        description:
          'Fake documents cause billions of dollars in losses every year. From fraudulent certificates to forged contracts, document verification is broken. Web3 fixes this.',
      },
      features: {
        title: 'Discover Affix!',
        easyToVerify: 'Easy to Verify',
        easyToVerifyDesc:
          'One-click verification for anyone, anywhere. No technical knowledge required.',
        unbreakableSecurity: 'Unbreakable Security',
        unbreakableSecurityDesc: 'Blockchain-powered proof that cannot be tampered with or forged.',
        privacyFirst: 'Privacy First',
        privacyFirstDesc:
          "We don't store your documents. Only cryptographic fingerprints go onchain.",
        aiPowered: 'AI-Powered Verification',
        aiPoweredDesc:
          'AI helps you verify things. It checks if instance addresses match URLs registered onchain for enhanced security.',
        forEveryone: 'For Everyone',
        forEveryoneDesc:
          'Perfect for organizations, businesses, and individuals who need document authenticity.',
        antiFraud: 'Anti-Fraud Protection',
        antiFraudDesc:
          'Combat the billions in annual losses from fake documents with blockchain verification.',
      },
      documentTypes: {
        title: 'Works with Any Document Type',
        pdfs: 'PDFs',
        images: 'Images',
        videos: 'Videos',
        anyFile: 'Any File',
      },
      howItWorks: {
        title: 'How It Works',
        step1Title: 'Publish Digital Footprint',
        step1Desc:
          'Upload any document type and we create a unique cryptographic fingerprint that goes onchain',
        step2Title: 'Anyone Can Verify',
        step2Desc:
          'Share the document with anyone - they can instantly verify its authenticity with AI assistance',
        step3Title: 'Guaranteed Authenticity',
        step3Desc:
          'Prove a statement was made by you with immutable blockchain evidence and AI verification',
      },
      trust: {
        noStorage: "We Don't Store Your Documents",
        noStorageDesc:
          'Your files never leave your device. Only mathematical proofs are recorded onchain.',
        guaranteeAuthorship: 'Guarantee Authorship',
        guaranteeAuthorshipDesc:
          "Cryptographically prove a statement was made by you at a specific time. That's the magic of Web3.",
      },
      roadmap: {
        title: 'Roadmap',
        publicDocuments: 'Public documents',
        publicDocumentsDesc:
          'Public documents stored in a decentralized fashion for permanent accessibility, transparency, and more',
        digitalAgreements: 'Digital Agreements',
        digitalAgreementsDesc: 'DocuSign-style functionality for agreements and contract signing',
        mainnetLaunch: 'Mainnet Launch',
        mainnetLaunchDesc:
          "We're in contact with several institutions in Burkina Faso. They're ready to deploy their own instance...",
        comingSoon: 'Coming Soon',
      },
      cta: {
        title: 'Ready to Authenticate Your Documents with Affix?',
        description:
          'Join us in the fight against document fraud. Get started today or reach out to learn more.',
        contactButton: 'Contact Us',
      },
    },
    navigation: {
      settings: 'Settings',
      dashboard: 'Dashboard',
      verify: 'Verify',
      sandbox: 'Sandbox',
    },
    settings: {
      title: 'Settings',
      loginRequired: 'Please login to access your settings',
    },
    dashboard: {
      title: 'Welcome to Your Dashboard',
      subtitle: 'Manage your documents and permissions',
      loginPrompt: 'Please login',
      exploreWithout: 'Want to explore without logging in?',
      tryThe: 'Try the',
      toExplore: 'to explore the platform',
      checkingPermissions: 'Checking permissions...',
      welcome: 'Welcome',
      yourAddress: 'Your Address:',
      issueDocument: {
        title: 'Issue Document',
        issueOnBehalf: 'Issue a document on behalf of',
        contractAddress: 'Contract address',
        clickToUpload: 'Click to upload document',
        documentCID: 'Document CID',
        issueButton: 'Issue Document',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
        cidGenerated: 'CID Generated',
        cidGeneratedDesc: 'Document hash computed successfully',
        error: 'Error',
        computeError: 'Failed to compute document hash',
        noDocument: 'No document',
        noDocumentDesc: 'Please upload a document first',
        notAuthenticated: 'Not authenticated',
        notAuthenticatedDesc: 'Please login to issue documents',
        txSubmitted: 'Transaction Submitted',
        txHash: 'Hash',
        success: 'Document Issued Successfully',
        viewTxOn: 'View transaction on',
        viewTx: 'View Transaction',
        failed: 'Issuance Failed',
      },
      addAgent: {
        title: 'Add Agent',
        agentAddress: 'Agent Address',
        placeholder: 'Enter the Ethereum address of the new agent',
        addButton: 'Add as Agent',
        registryContract: 'Registry Contract',
        noAddress: 'No address provided',
        noAddressDesc: 'Please enter an address',
        invalidAddress: 'Invalid address',
        invalidAddressDesc: 'Please enter a valid Ethereum address',
        noRegistry: 'No registry found',
        noRegistryDesc: 'Cannot add agent without a registry address',
        alreadyAgent: 'Already an Agent',
        notAuthenticated: 'Not Authenticated',
        success: 'Agent Created',
        failed: 'Failed to Make Agent',
      },
    },
    verify: {
      title: 'Verify Documents',
      subtitle: 'Verify document authenticity.',
      upload: {
        dropHere: 'Drop your document here, or',
        supportsAny: 'Supports any file format',
        noDocument: 'No document provided',
        noDocumentDesc: 'Please upload a file or enter a document CID/hash',
        copied: 'Copied to clipboard',
        clickToCopy: 'Click to copy - This CID will be used for verification',
      },
      progress: {
        computing: 'Computing document hash (CID)...',
        checking: 'Checking registry...',
        aiVerifying: 'Document found! Performing AI verification...',
        complete: 'Verification complete!',
      },
      results: {
        title: 'Verification Results',
        verified: 'Document Verified!',
        notFound: 'Not Found',
        verifiedBadge: 'VERIFIED',
        unverifiedBadge: 'UNVERIFIED',
        issuedOn: 'Issued On',
        issuedBy: 'Issued By',
        entityUrl: 'Entity URL',
        metadata: 'Metadata',
        registryAddress: 'Registry Address',
        aiVerification: 'AI Verification',
        registryVerified: 'Registry address verified on entity website',
        registryNotVerified: 'Could not verify registry address on entity website',
      },
      toast: {
        verified: 'Document Verified!',
        foundIn: 'Found in',
        notFound: 'Document Not Found',
        notFoundDesc: 'This document has not been registered on the blockchain',
        failed: 'Verification Failed',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
      },
    },
    sandbox: {
      title: 'Sandbox',
      subtitle: 'Explore and experiment with the Affix platform (soon)',
    },
    errors: {
      somethingWrong: 'Something went wrong!',
      apology:
        'We apologize for the inconvenience. An error occurred while processing your request.',
      errorDetails: 'Error Details:',
      errorId: 'Error ID:',
      tryAgain: 'Try Again',
      persistProblem: 'If the problem persists, please refresh the page or',
      contactSupport: 'contact support',
    },
    notFound: {
      code: '404',
      title: 'Page Not Found',
      description: "The page you're looking for doesn't exist.",
      returnHome: 'Return Home',
    },
    components: {
      header: {
        registerTitle: 'Register New Account',
        registerDesc:
          'An Ethereum wallet will be created and securely stored on your device, protected by your biometric or PIN thanks to',
        w3pk: 'w3pk',
        username: 'Username',
        usernamePlaceholder: 'Enter your username',
        usernameValidation:
          'Username must be 3-50 characters long and contain only letters, numbers, underscores, and hyphens. It must start and end with a letter or number.',
        createAccount: 'Create Account',
        usernameRequired: 'Username Required',
        usernameRequiredDesc: 'Please enter a username to register.',
        registrationFailed: 'Registration Failed',
        registrationFailedDesc: 'Unable to complete registration. Please try again.',
      },
      passwordModal: {
        password: 'Password',
        placeholder: 'Enter your password',
        passwordRequired: 'Password Required.',
        passwordRequiredDesc: 'Please enter your password.',
        weakPassword: 'Weak Password.',
        weakPasswordDesc: 'Please use a stronger password that meets all requirements.',
        submissionError: 'Submission Error.',
        passwordMustInclude: 'Password must include:',
        atLeast12: 'At least 12 characters',
        oneUppercase: 'One uppercase letter',
        oneLowercase: 'One lowercase letter',
        oneNumber: 'One number',
        oneSpecial: 'One special character',
        notMeetRequirements: 'Password does not meet all requirements',
        strongPassword: 'Strong password!',
        satisfied: '(satisfied)',
        required: '(required)',
      },
    },
  },

  // Arabic
  ar: {
    common: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      pleaseLogin: 'Please login',
      cancel: 'Cancel',
      submit: 'Submit',
      copy: 'Copy',
      view: 'View',
      remove: 'Remove',
      tryAgain: 'Try Again',
      browse: 'browse',
    },
    home: {
      title: 'Welcome!',
      subtitle: "It's a pleasure to have you here!",
      greeting: 'Hello Anon!',
      greetingSubtitle: 'Sit back, relax, and build something cool!',
      hero: {
        tagline: 'your onchain seal',
        letTheWorld: 'Let the world',
        verify: 'verify',
        it: 'it',
        description:
          'Authenticate your documents onchain while keeping your existing workflows intact. Anyone can then instantly verify that documents are genuine and unaltered.',
        dashboardButton: 'Your Dashboard',
        verifyButton: 'Verify',
      },
      problem: {
        title: 'The Document Fraud Epidemic...',
        description:
          'Fake documents cause billions of dollars in losses every year. From fraudulent certificates to forged contracts, document verification is broken. Web3 fixes this.',
      },
      features: {
        title: 'Discover Affix!',
        easyToVerify: 'Easy to Verify',
        easyToVerifyDesc:
          'One-click verification for anyone, anywhere. No technical knowledge required.',
        unbreakableSecurity: 'Unbreakable Security',
        unbreakableSecurityDesc: 'Blockchain-powered proof that cannot be tampered with or forged.',
        privacyFirst: 'Privacy First',
        privacyFirstDesc:
          "We don't store your documents. Only cryptographic fingerprints go onchain.",
        aiPowered: 'AI-Powered Verification',
        aiPoweredDesc:
          'AI helps you verify things. It checks if instance addresses match URLs registered onchain for enhanced security.',
        forEveryone: 'For Everyone',
        forEveryoneDesc:
          'Perfect for organizations, businesses, and individuals who need document authenticity.',
        antiFraud: 'Anti-Fraud Protection',
        antiFraudDesc:
          'Combat the billions in annual losses from fake documents with blockchain verification.',
      },
      documentTypes: {
        title: 'Works with Any Document Type',
        pdfs: 'PDFs',
        images: 'Images',
        videos: 'Videos',
        anyFile: 'Any File',
      },
      howItWorks: {
        title: 'How It Works',
        step1Title: 'Publish Digital Footprint',
        step1Desc:
          'Upload any document type and we create a unique cryptographic fingerprint that goes onchain',
        step2Title: 'Anyone Can Verify',
        step2Desc:
          'Share the document with anyone - they can instantly verify its authenticity with AI assistance',
        step3Title: 'Guaranteed Authenticity',
        step3Desc:
          'Prove a statement was made by you with immutable blockchain evidence and AI verification',
      },
      trust: {
        noStorage: "We Don't Store Your Documents",
        noStorageDesc:
          'Your files never leave your device. Only mathematical proofs are recorded onchain.',
        guaranteeAuthorship: 'Guarantee Authorship',
        guaranteeAuthorshipDesc:
          "Cryptographically prove a statement was made by you at a specific time. That's the magic of Web3.",
      },
      roadmap: {
        title: 'Roadmap',
        publicDocuments: 'Public documents',
        publicDocumentsDesc:
          'Public documents stored in a decentralized fashion for permanent accessibility, transparency, and more',
        digitalAgreements: 'Digital Agreements',
        digitalAgreementsDesc: 'DocuSign-style functionality for agreements and contract signing',
        mainnetLaunch: 'Mainnet Launch',
        mainnetLaunchDesc:
          "We're in contact with several institutions in Burkina Faso. They're ready to deploy their own instance...",
        comingSoon: 'Coming Soon',
      },
      cta: {
        title: 'Ready to Authenticate Your Documents with Affix?',
        description:
          'Join us in the fight against document fraud. Get started today or reach out to learn more.',
        contactButton: 'Contact Us',
      },
    },
    navigation: {
      settings: 'Settings',
      dashboard: 'Dashboard',
      verify: 'Verify',
      sandbox: 'Sandbox',
    },
    settings: {
      title: 'Settings',
      loginRequired: 'Please login to access your settings',
    },
    dashboard: {
      title: 'Welcome to Your Dashboard',
      subtitle: 'Manage your documents and permissions',
      loginPrompt: 'Please login',
      exploreWithout: 'Want to explore without logging in?',
      tryThe: 'Try the',
      toExplore: 'to explore the platform',
      checkingPermissions: 'Checking permissions...',
      welcome: 'Welcome',
      yourAddress: 'Your Address:',
      issueDocument: {
        title: 'Issue Document',
        issueOnBehalf: 'Issue a document on behalf of',
        contractAddress: 'Contract address',
        clickToUpload: 'Click to upload document',
        documentCID: 'Document CID',
        issueButton: 'Issue Document',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
        cidGenerated: 'CID Generated',
        cidGeneratedDesc: 'Document hash computed successfully',
        error: 'Error',
        computeError: 'Failed to compute document hash',
        noDocument: 'No document',
        noDocumentDesc: 'Please upload a document first',
        notAuthenticated: 'Not authenticated',
        notAuthenticatedDesc: 'Please login to issue documents',
        txSubmitted: 'Transaction Submitted',
        txHash: 'Hash',
        success: 'Document Issued Successfully',
        viewTxOn: 'View transaction on',
        viewTx: 'View Transaction',
        failed: 'Issuance Failed',
      },
      addAgent: {
        title: 'Add Agent',
        agentAddress: 'Agent Address',
        placeholder: 'Enter the Ethereum address of the new agent',
        addButton: 'Add as Agent',
        registryContract: 'Registry Contract',
        noAddress: 'No address provided',
        noAddressDesc: 'Please enter an address',
        invalidAddress: 'Invalid address',
        invalidAddressDesc: 'Please enter a valid Ethereum address',
        noRegistry: 'No registry found',
        noRegistryDesc: 'Cannot add agent without a registry address',
        alreadyAgent: 'Already an Agent',
        notAuthenticated: 'Not Authenticated',
        success: 'Agent Created',
        failed: 'Failed to Make Agent',
      },
    },
    verify: {
      title: 'Verify Documents',
      subtitle: 'Verify document authenticity.',
      upload: {
        dropHere: 'Drop your document here, or',
        supportsAny: 'Supports any file format',
        noDocument: 'No document provided',
        noDocumentDesc: 'Please upload a file or enter a document CID/hash',
        copied: 'Copied to clipboard',
        clickToCopy: 'Click to copy - This CID will be used for verification',
      },
      progress: {
        computing: 'Computing document hash (CID)...',
        checking: 'Checking registry...',
        aiVerifying: 'Document found! Performing AI verification...',
        complete: 'Verification complete!',
      },
      results: {
        title: 'Verification Results',
        verified: 'Document Verified!',
        notFound: 'Not Found',
        verifiedBadge: 'VERIFIED',
        unverifiedBadge: 'UNVERIFIED',
        issuedOn: 'Issued On',
        issuedBy: 'Issued By',
        entityUrl: 'Entity URL',
        metadata: 'Metadata',
        registryAddress: 'Registry Address',
        aiVerification: 'AI Verification',
        registryVerified: 'Registry address verified on entity website',
        registryNotVerified: 'Could not verify registry address on entity website',
      },
      toast: {
        verified: 'Document Verified!',
        foundIn: 'Found in',
        notFound: 'Document Not Found',
        notFoundDesc: 'This document has not been registered on the blockchain',
        failed: 'Verification Failed',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
      },
    },
    sandbox: {
      title: 'Sandbox',
      subtitle: 'Explore and experiment with the Affix platform (soon)',
    },
    errors: {
      somethingWrong: 'Something went wrong!',
      apology:
        'We apologize for the inconvenience. An error occurred while processing your request.',
      errorDetails: 'Error Details:',
      errorId: 'Error ID:',
      tryAgain: 'Try Again',
      persistProblem: 'If the problem persists, please refresh the page or',
      contactSupport: 'contact support',
    },
    notFound: {
      code: '404',
      title: 'Page Not Found',
      description: "The page you're looking for doesn't exist.",
      returnHome: 'Return Home',
    },
    components: {
      header: {
        registerTitle: 'Register New Account',
        registerDesc:
          'An Ethereum wallet will be created and securely stored on your device, protected by your biometric or PIN thanks to',
        w3pk: 'w3pk',
        username: 'Username',
        usernamePlaceholder: 'Enter your username',
        usernameValidation:
          'Username must be 3-50 characters long and contain only letters, numbers, underscores, and hyphens. It must start and end with a letter or number.',
        createAccount: 'Create Account',
        usernameRequired: 'Username Required',
        usernameRequiredDesc: 'Please enter a username to register.',
        registrationFailed: 'Registration Failed',
        registrationFailedDesc: 'Unable to complete registration. Please try again.',
      },
      passwordModal: {
        password: 'Password',
        placeholder: 'Enter your password',
        passwordRequired: 'Password Required.',
        passwordRequiredDesc: 'Please enter your password.',
        weakPassword: 'Weak Password.',
        weakPasswordDesc: 'Please use a stronger password that meets all requirements.',
        submissionError: 'Submission Error.',
        passwordMustInclude: 'Password must include:',
        atLeast12: 'At least 12 characters',
        oneUppercase: 'One uppercase letter',
        oneLowercase: 'One lowercase letter',
        oneNumber: 'One number',
        oneSpecial: 'One special character',
        notMeetRequirements: 'Password does not meet all requirements',
        strongPassword: 'Strong password!',
        satisfied: '(satisfied)',
        required: '(required)',
      },
    },
  },

  // Bengali
  bn: {
    common: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      pleaseLogin: 'Please login',
      cancel: 'Cancel',
      submit: 'Submit',
      copy: 'Copy',
      view: 'View',
      remove: 'Remove',
      tryAgain: 'Try Again',
      browse: 'browse',
    },
    home: {
      title: 'Welcome!',
      subtitle: "It's a pleasure to have you here!",
      greeting: 'Hello Anon!',
      greetingSubtitle: 'Sit back, relax, and build something cool!',
      hero: {
        tagline: 'your onchain seal',
        letTheWorld: 'Let the world',
        verify: 'verify',
        it: 'it',
        description:
          'Authenticate your documents onchain while keeping your existing workflows intact. Anyone can then instantly verify that documents are genuine and unaltered.',
        dashboardButton: 'Your Dashboard',
        verifyButton: 'Verify',
      },
      problem: {
        title: 'The Document Fraud Epidemic...',
        description:
          'Fake documents cause billions of dollars in losses every year. From fraudulent certificates to forged contracts, document verification is broken. Web3 fixes this.',
      },
      features: {
        title: 'Discover Affix!',
        easyToVerify: 'Easy to Verify',
        easyToVerifyDesc:
          'One-click verification for anyone, anywhere. No technical knowledge required.',
        unbreakableSecurity: 'Unbreakable Security',
        unbreakableSecurityDesc: 'Blockchain-powered proof that cannot be tampered with or forged.',
        privacyFirst: 'Privacy First',
        privacyFirstDesc:
          "We don't store your documents. Only cryptographic fingerprints go onchain.",
        aiPowered: 'AI-Powered Verification',
        aiPoweredDesc:
          'AI helps you verify things. It checks if instance addresses match URLs registered onchain for enhanced security.',
        forEveryone: 'For Everyone',
        forEveryoneDesc:
          'Perfect for organizations, businesses, and individuals who need document authenticity.',
        antiFraud: 'Anti-Fraud Protection',
        antiFraudDesc:
          'Combat the billions in annual losses from fake documents with blockchain verification.',
      },
      documentTypes: {
        title: 'Works with Any Document Type',
        pdfs: 'PDFs',
        images: 'Images',
        videos: 'Videos',
        anyFile: 'Any File',
      },
      howItWorks: {
        title: 'How It Works',
        step1Title: 'Publish Digital Footprint',
        step1Desc:
          'Upload any document type and we create a unique cryptographic fingerprint that goes onchain',
        step2Title: 'Anyone Can Verify',
        step2Desc:
          'Share the document with anyone - they can instantly verify its authenticity with AI assistance',
        step3Title: 'Guaranteed Authenticity',
        step3Desc:
          'Prove a statement was made by you with immutable blockchain evidence and AI verification',
      },
      trust: {
        noStorage: "We Don't Store Your Documents",
        noStorageDesc:
          'Your files never leave your device. Only mathematical proofs are recorded onchain.',
        guaranteeAuthorship: 'Guarantee Authorship',
        guaranteeAuthorshipDesc:
          "Cryptographically prove a statement was made by you at a specific time. That's the magic of Web3.",
      },
      roadmap: {
        title: 'Roadmap',
        publicDocuments: 'Public documents',
        publicDocumentsDesc:
          'Public documents stored in a decentralized fashion for permanent accessibility, transparency, and more',
        digitalAgreements: 'Digital Agreements',
        digitalAgreementsDesc: 'DocuSign-style functionality for agreements and contract signing',
        mainnetLaunch: 'Mainnet Launch',
        mainnetLaunchDesc:
          "We're in contact with several institutions in Burkina Faso. They're ready to deploy their own instance...",
        comingSoon: 'Coming Soon',
      },
      cta: {
        title: 'Ready to Authenticate Your Documents with Affix?',
        description:
          'Join us in the fight against document fraud. Get started today or reach out to learn more.',
        contactButton: 'Contact Us',
      },
    },
    navigation: {
      settings: 'Settings',
      dashboard: 'Dashboard',
      verify: 'Verify',
      sandbox: 'Sandbox',
    },
    settings: {
      title: 'Settings',
      loginRequired: 'Please login to access your settings',
    },
    dashboard: {
      title: 'Welcome to Your Dashboard',
      subtitle: 'Manage your documents and permissions',
      loginPrompt: 'Please login',
      exploreWithout: 'Want to explore without logging in?',
      tryThe: 'Try the',
      toExplore: 'to explore the platform',
      checkingPermissions: 'Checking permissions...',
      welcome: 'Welcome',
      yourAddress: 'Your Address:',
      issueDocument: {
        title: 'Issue Document',
        issueOnBehalf: 'Issue a document on behalf of',
        contractAddress: 'Contract address',
        clickToUpload: 'Click to upload document',
        documentCID: 'Document CID',
        issueButton: 'Issue Document',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
        cidGenerated: 'CID Generated',
        cidGeneratedDesc: 'Document hash computed successfully',
        error: 'Error',
        computeError: 'Failed to compute document hash',
        noDocument: 'No document',
        noDocumentDesc: 'Please upload a document first',
        notAuthenticated: 'Not authenticated',
        notAuthenticatedDesc: 'Please login to issue documents',
        txSubmitted: 'Transaction Submitted',
        txHash: 'Hash',
        success: 'Document Issued Successfully',
        viewTxOn: 'View transaction on',
        viewTx: 'View Transaction',
        failed: 'Issuance Failed',
      },
      addAgent: {
        title: 'Add Agent',
        agentAddress: 'Agent Address',
        placeholder: 'Enter the Ethereum address of the new agent',
        addButton: 'Add as Agent',
        registryContract: 'Registry Contract',
        noAddress: 'No address provided',
        noAddressDesc: 'Please enter an address',
        invalidAddress: 'Invalid address',
        invalidAddressDesc: 'Please enter a valid Ethereum address',
        noRegistry: 'No registry found',
        noRegistryDesc: 'Cannot add agent without a registry address',
        alreadyAgent: 'Already an Agent',
        notAuthenticated: 'Not Authenticated',
        success: 'Agent Created',
        failed: 'Failed to Make Agent',
      },
    },
    verify: {
      title: 'Verify Documents',
      subtitle: 'Verify document authenticity.',
      upload: {
        dropHere: 'Drop your document here, or',
        supportsAny: 'Supports any file format',
        noDocument: 'No document provided',
        noDocumentDesc: 'Please upload a file or enter a document CID/hash',
        copied: 'Copied to clipboard',
        clickToCopy: 'Click to copy - This CID will be used for verification',
      },
      progress: {
        computing: 'Computing document hash (CID)...',
        checking: 'Checking registry...',
        aiVerifying: 'Document found! Performing AI verification...',
        complete: 'Verification complete!',
      },
      results: {
        title: 'Verification Results',
        verified: 'Document Verified!',
        notFound: 'Not Found',
        verifiedBadge: 'VERIFIED',
        unverifiedBadge: 'UNVERIFIED',
        issuedOn: 'Issued On',
        issuedBy: 'Issued By',
        entityUrl: 'Entity URL',
        metadata: 'Metadata',
        registryAddress: 'Registry Address',
        aiVerification: 'AI Verification',
        registryVerified: 'Registry address verified on entity website',
        registryNotVerified: 'Could not verify registry address on entity website',
      },
      toast: {
        verified: 'Document Verified!',
        foundIn: 'Found in',
        notFound: 'Document Not Found',
        notFoundDesc: 'This document has not been registered on the blockchain',
        failed: 'Verification Failed',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
      },
    },
    sandbox: {
      title: 'Sandbox',
      subtitle: 'Explore and experiment with the Affix platform (soon)',
    },
    errors: {
      somethingWrong: 'Something went wrong!',
      apology:
        'We apologize for the inconvenience. An error occurred while processing your request.',
      errorDetails: 'Error Details:',
      errorId: 'Error ID:',
      tryAgain: 'Try Again',
      persistProblem: 'If the problem persists, please refresh the page or',
      contactSupport: 'contact support',
    },
    notFound: {
      code: '404',
      title: 'Page Not Found',
      description: "The page you're looking for doesn't exist.",
      returnHome: 'Return Home',
    },
    components: {
      header: {
        registerTitle: 'Register New Account',
        registerDesc:
          'An Ethereum wallet will be created and securely stored on your device, protected by your biometric or PIN thanks to',
        w3pk: 'w3pk',
        username: 'Username',
        usernamePlaceholder: 'Enter your username',
        usernameValidation:
          'Username must be 3-50 characters long and contain only letters, numbers, underscores, and hyphens. It must start and end with a letter or number.',
        createAccount: 'Create Account',
        usernameRequired: 'Username Required',
        usernameRequiredDesc: 'Please enter a username to register.',
        registrationFailed: 'Registration Failed',
        registrationFailedDesc: 'Unable to complete registration. Please try again.',
      },
      passwordModal: {
        password: 'Password',
        placeholder: 'Enter your password',
        passwordRequired: 'Password Required.',
        passwordRequiredDesc: 'Please enter your password.',
        weakPassword: 'Weak Password.',
        weakPasswordDesc: 'Please use a stronger password that meets all requirements.',
        submissionError: 'Submission Error.',
        passwordMustInclude: 'Password must include:',
        atLeast12: 'At least 12 characters',
        oneUppercase: 'One uppercase letter',
        oneLowercase: 'One lowercase letter',
        oneNumber: 'One number',
        oneSpecial: 'One special character',
        notMeetRequirements: 'Password does not meet all requirements',
        strongPassword: 'Strong password!',
        satisfied: '(satisfied)',
        required: '(required)',
      },
    },
  },

  // Russian
  ru: {
    common: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      pleaseLogin: 'Please login',
      cancel: 'Cancel',
      submit: 'Submit',
      copy: 'Copy',
      view: 'View',
      remove: 'Remove',
      tryAgain: 'Try Again',
      browse: 'browse',
    },
    home: {
      title: 'Welcome!',
      subtitle: "It's a pleasure to have you here!",
      greeting: 'Hello Anon!',
      greetingSubtitle: 'Sit back, relax, and build something cool!',
      hero: {
        tagline: 'your onchain seal',
        letTheWorld: 'Let the world',
        verify: 'verify',
        it: 'it',
        description:
          'Authenticate your documents onchain while keeping your existing workflows intact. Anyone can then instantly verify that documents are genuine and unaltered.',
        dashboardButton: 'Your Dashboard',
        verifyButton: 'Verify',
      },
      problem: {
        title: 'The Document Fraud Epidemic...',
        description:
          'Fake documents cause billions of dollars in losses every year. From fraudulent certificates to forged contracts, document verification is broken. Web3 fixes this.',
      },
      features: {
        title: 'Discover Affix!',
        easyToVerify: 'Easy to Verify',
        easyToVerifyDesc:
          'One-click verification for anyone, anywhere. No technical knowledge required.',
        unbreakableSecurity: 'Unbreakable Security',
        unbreakableSecurityDesc: 'Blockchain-powered proof that cannot be tampered with or forged.',
        privacyFirst: 'Privacy First',
        privacyFirstDesc:
          "We don't store your documents. Only cryptographic fingerprints go onchain.",
        aiPowered: 'AI-Powered Verification',
        aiPoweredDesc:
          'AI helps you verify things. It checks if instance addresses match URLs registered onchain for enhanced security.',
        forEveryone: 'For Everyone',
        forEveryoneDesc:
          'Perfect for organizations, businesses, and individuals who need document authenticity.',
        antiFraud: 'Anti-Fraud Protection',
        antiFraudDesc:
          'Combat the billions in annual losses from fake documents with blockchain verification.',
      },
      documentTypes: {
        title: 'Works with Any Document Type',
        pdfs: 'PDFs',
        images: 'Images',
        videos: 'Videos',
        anyFile: 'Any File',
      },
      howItWorks: {
        title: 'How It Works',
        step1Title: 'Publish Digital Footprint',
        step1Desc:
          'Upload any document type and we create a unique cryptographic fingerprint that goes onchain',
        step2Title: 'Anyone Can Verify',
        step2Desc:
          'Share the document with anyone - they can instantly verify its authenticity with AI assistance',
        step3Title: 'Guaranteed Authenticity',
        step3Desc:
          'Prove a statement was made by you with immutable blockchain evidence and AI verification',
      },
      trust: {
        noStorage: "We Don't Store Your Documents",
        noStorageDesc:
          'Your files never leave your device. Only mathematical proofs are recorded onchain.',
        guaranteeAuthorship: 'Guarantee Authorship',
        guaranteeAuthorshipDesc:
          "Cryptographically prove a statement was made by you at a specific time. That's the magic of Web3.",
      },
      roadmap: {
        title: 'Roadmap',
        publicDocuments: 'Public documents',
        publicDocumentsDesc:
          'Public documents stored in a decentralized fashion for permanent accessibility, transparency, and more',
        digitalAgreements: 'Digital Agreements',
        digitalAgreementsDesc: 'DocuSign-style functionality for agreements and contract signing',
        mainnetLaunch: 'Mainnet Launch',
        mainnetLaunchDesc:
          "We're in contact with several institutions in Burkina Faso. They're ready to deploy their own instance...",
        comingSoon: 'Coming Soon',
      },
      cta: {
        title: 'Ready to Authenticate Your Documents with Affix?',
        description:
          'Join us in the fight against document fraud. Get started today or reach out to learn more.',
        contactButton: 'Contact Us',
      },
    },
    navigation: {
      settings: 'Settings',
      dashboard: 'Dashboard',
      verify: 'Verify',
      sandbox: 'Sandbox',
    },
    settings: {
      title: 'Settings',
      loginRequired: 'Please login to access your settings',
    },
    dashboard: {
      title: 'Welcome to Your Dashboard',
      subtitle: 'Manage your documents and permissions',
      loginPrompt: 'Please login',
      exploreWithout: 'Want to explore without logging in?',
      tryThe: 'Try the',
      toExplore: 'to explore the platform',
      checkingPermissions: 'Checking permissions...',
      welcome: 'Welcome',
      yourAddress: 'Your Address:',
      issueDocument: {
        title: 'Issue Document',
        issueOnBehalf: 'Issue a document on behalf of',
        contractAddress: 'Contract address',
        clickToUpload: 'Click to upload document',
        documentCID: 'Document CID',
        issueButton: 'Issue Document',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
        cidGenerated: 'CID Generated',
        cidGeneratedDesc: 'Document hash computed successfully',
        error: 'Error',
        computeError: 'Failed to compute document hash',
        noDocument: 'No document',
        noDocumentDesc: 'Please upload a document first',
        notAuthenticated: 'Not authenticated',
        notAuthenticatedDesc: 'Please login to issue documents',
        txSubmitted: 'Transaction Submitted',
        txHash: 'Hash',
        success: 'Document Issued Successfully',
        viewTxOn: 'View transaction on',
        viewTx: 'View Transaction',
        failed: 'Issuance Failed',
      },
      addAgent: {
        title: 'Add Agent',
        agentAddress: 'Agent Address',
        placeholder: 'Enter the Ethereum address of the new agent',
        addButton: 'Add as Agent',
        registryContract: 'Registry Contract',
        noAddress: 'No address provided',
        noAddressDesc: 'Please enter an address',
        invalidAddress: 'Invalid address',
        invalidAddressDesc: 'Please enter a valid Ethereum address',
        noRegistry: 'No registry found',
        noRegistryDesc: 'Cannot add agent without a registry address',
        alreadyAgent: 'Already an Agent',
        notAuthenticated: 'Not Authenticated',
        success: 'Agent Created',
        failed: 'Failed to Make Agent',
      },
    },
    verify: {
      title: 'Verify Documents',
      subtitle: 'Verify document authenticity.',
      upload: {
        dropHere: 'Drop your document here, or',
        supportsAny: 'Supports any file format',
        noDocument: 'No document provided',
        noDocumentDesc: 'Please upload a file or enter a document CID/hash',
        copied: 'Copied to clipboard',
        clickToCopy: 'Click to copy - This CID will be used for verification',
      },
      progress: {
        computing: 'Computing document hash (CID)...',
        checking: 'Checking registry...',
        aiVerifying: 'Document found! Performing AI verification...',
        complete: 'Verification complete!',
      },
      results: {
        title: 'Verification Results',
        verified: 'Document Verified!',
        notFound: 'Not Found',
        verifiedBadge: 'VERIFIED',
        unverifiedBadge: 'UNVERIFIED',
        issuedOn: 'Issued On',
        issuedBy: 'Issued By',
        entityUrl: 'Entity URL',
        metadata: 'Metadata',
        registryAddress: 'Registry Address',
        aiVerification: 'AI Verification',
        registryVerified: 'Registry address verified on entity website',
        registryNotVerified: 'Could not verify registry address on entity website',
      },
      toast: {
        verified: 'Document Verified!',
        foundIn: 'Found in',
        notFound: 'Document Not Found',
        notFoundDesc: 'This document has not been registered on the blockchain',
        failed: 'Verification Failed',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
      },
    },
    sandbox: {
      title: 'Sandbox',
      subtitle: 'Explore and experiment with the Affix platform (soon)',
    },
    errors: {
      somethingWrong: 'Something went wrong!',
      apology:
        'We apologize for the inconvenience. An error occurred while processing your request.',
      errorDetails: 'Error Details:',
      errorId: 'Error ID:',
      tryAgain: 'Try Again',
      persistProblem: 'If the problem persists, please refresh the page or',
      contactSupport: 'contact support',
    },
    notFound: {
      code: '404',
      title: 'Page Not Found',
      description: "The page you're looking for doesn't exist.",
      returnHome: 'Return Home',
    },
    components: {
      header: {
        registerTitle: 'Register New Account',
        registerDesc:
          'An Ethereum wallet will be created and securely stored on your device, protected by your biometric or PIN thanks to',
        w3pk: 'w3pk',
        username: 'Username',
        usernamePlaceholder: 'Enter your username',
        usernameValidation:
          'Username must be 3-50 characters long and contain only letters, numbers, underscores, and hyphens. It must start and end with a letter or number.',
        createAccount: 'Create Account',
        usernameRequired: 'Username Required',
        usernameRequiredDesc: 'Please enter a username to register.',
        registrationFailed: 'Registration Failed',
        registrationFailedDesc: 'Unable to complete registration. Please try again.',
      },
      passwordModal: {
        password: 'Password',
        placeholder: 'Enter your password',
        passwordRequired: 'Password Required.',
        passwordRequiredDesc: 'Please enter your password.',
        weakPassword: 'Weak Password.',
        weakPasswordDesc: 'Please use a stronger password that meets all requirements.',
        submissionError: 'Submission Error.',
        passwordMustInclude: 'Password must include:',
        atLeast12: 'At least 12 characters',
        oneUppercase: 'One uppercase letter',
        oneLowercase: 'One lowercase letter',
        oneNumber: 'One number',
        oneSpecial: 'One special character',
        notMeetRequirements: 'Password does not meet all requirements',
        strongPassword: 'Strong password!',
        satisfied: '(satisfied)',
        required: '(required)',
      },
    },
  },

  // Portuguese
  pt: {
    common: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      pleaseLogin: 'Please login',
      cancel: 'Cancel',
      submit: 'Submit',
      copy: 'Copy',
      view: 'View',
      remove: 'Remove',
      tryAgain: 'Try Again',
      browse: 'browse',
    },
    home: {
      title: 'Welcome!',
      subtitle: "It's a pleasure to have you here!",
      greeting: 'Hello Anon!',
      greetingSubtitle: 'Sit back, relax, and build something cool!',
      hero: {
        tagline: 'your onchain seal',
        letTheWorld: 'Let the world',
        verify: 'verify',
        it: 'it',
        description:
          'Authenticate your documents onchain while keeping your existing workflows intact. Anyone can then instantly verify that documents are genuine and unaltered.',
        dashboardButton: 'Your Dashboard',
        verifyButton: 'Verify',
      },
      problem: {
        title: 'The Document Fraud Epidemic...',
        description:
          'Fake documents cause billions of dollars in losses every year. From fraudulent certificates to forged contracts, document verification is broken. Web3 fixes this.',
      },
      features: {
        title: 'Discover Affix!',
        easyToVerify: 'Easy to Verify',
        easyToVerifyDesc:
          'One-click verification for anyone, anywhere. No technical knowledge required.',
        unbreakableSecurity: 'Unbreakable Security',
        unbreakableSecurityDesc: 'Blockchain-powered proof that cannot be tampered with or forged.',
        privacyFirst: 'Privacy First',
        privacyFirstDesc:
          "We don't store your documents. Only cryptographic fingerprints go onchain.",
        aiPowered: 'AI-Powered Verification',
        aiPoweredDesc:
          'AI helps you verify things. It checks if instance addresses match URLs registered onchain for enhanced security.',
        forEveryone: 'For Everyone',
        forEveryoneDesc:
          'Perfect for organizations, businesses, and individuals who need document authenticity.',
        antiFraud: 'Anti-Fraud Protection',
        antiFraudDesc:
          'Combat the billions in annual losses from fake documents with blockchain verification.',
      },
      documentTypes: {
        title: 'Works with Any Document Type',
        pdfs: 'PDFs',
        images: 'Images',
        videos: 'Videos',
        anyFile: 'Any File',
      },
      howItWorks: {
        title: 'How It Works',
        step1Title: 'Publish Digital Footprint',
        step1Desc:
          'Upload any document type and we create a unique cryptographic fingerprint that goes onchain',
        step2Title: 'Anyone Can Verify',
        step2Desc:
          'Share the document with anyone - they can instantly verify its authenticity with AI assistance',
        step3Title: 'Guaranteed Authenticity',
        step3Desc:
          'Prove a statement was made by you with immutable blockchain evidence and AI verification',
      },
      trust: {
        noStorage: "We Don't Store Your Documents",
        noStorageDesc:
          'Your files never leave your device. Only mathematical proofs are recorded onchain.',
        guaranteeAuthorship: 'Guarantee Authorship',
        guaranteeAuthorshipDesc:
          "Cryptographically prove a statement was made by you at a specific time. That's the magic of Web3.",
      },
      roadmap: {
        title: 'Roadmap',
        publicDocuments: 'Public documents',
        publicDocumentsDesc:
          'Public documents stored in a decentralized fashion for permanent accessibility, transparency, and more',
        digitalAgreements: 'Digital Agreements',
        digitalAgreementsDesc: 'DocuSign-style functionality for agreements and contract signing',
        mainnetLaunch: 'Mainnet Launch',
        mainnetLaunchDesc:
          "We're in contact with several institutions in Burkina Faso. They're ready to deploy their own instance...",
        comingSoon: 'Coming Soon',
      },
      cta: {
        title: 'Ready to Authenticate Your Documents with Affix?',
        description:
          'Join us in the fight against document fraud. Get started today or reach out to learn more.',
        contactButton: 'Contact Us',
      },
    },
    navigation: {
      settings: 'Settings',
      dashboard: 'Dashboard',
      verify: 'Verify',
      sandbox: 'Sandbox',
    },
    settings: {
      title: 'Settings',
      loginRequired: 'Please login to access your settings',
    },
    dashboard: {
      title: 'Welcome to Your Dashboard',
      subtitle: 'Manage your documents and permissions',
      loginPrompt: 'Please login',
      exploreWithout: 'Want to explore without logging in?',
      tryThe: 'Try the',
      toExplore: 'to explore the platform',
      checkingPermissions: 'Checking permissions...',
      welcome: 'Welcome',
      yourAddress: 'Your Address:',
      issueDocument: {
        title: 'Issue Document',
        issueOnBehalf: 'Issue a document on behalf of',
        contractAddress: 'Contract address',
        clickToUpload: 'Click to upload document',
        documentCID: 'Document CID',
        issueButton: 'Issue Document',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
        cidGenerated: 'CID Generated',
        cidGeneratedDesc: 'Document hash computed successfully',
        error: 'Error',
        computeError: 'Failed to compute document hash',
        noDocument: 'No document',
        noDocumentDesc: 'Please upload a document first',
        notAuthenticated: 'Not authenticated',
        notAuthenticatedDesc: 'Please login to issue documents',
        txSubmitted: 'Transaction Submitted',
        txHash: 'Hash',
        success: 'Document Issued Successfully',
        viewTxOn: 'View transaction on',
        viewTx: 'View Transaction',
        failed: 'Issuance Failed',
      },
      addAgent: {
        title: 'Add Agent',
        agentAddress: 'Agent Address',
        placeholder: 'Enter the Ethereum address of the new agent',
        addButton: 'Add as Agent',
        registryContract: 'Registry Contract',
        noAddress: 'No address provided',
        noAddressDesc: 'Please enter an address',
        invalidAddress: 'Invalid address',
        invalidAddressDesc: 'Please enter a valid Ethereum address',
        noRegistry: 'No registry found',
        noRegistryDesc: 'Cannot add agent without a registry address',
        alreadyAgent: 'Already an Agent',
        notAuthenticated: 'Not Authenticated',
        success: 'Agent Created',
        failed: 'Failed to Make Agent',
      },
    },
    verify: {
      title: 'Verify Documents',
      subtitle: 'Verify document authenticity.',
      upload: {
        dropHere: 'Drop your document here, or',
        supportsAny: 'Supports any file format',
        noDocument: 'No document provided',
        noDocumentDesc: 'Please upload a file or enter a document CID/hash',
        copied: 'Copied to clipboard',
        clickToCopy: 'Click to copy - This CID will be used for verification',
      },
      progress: {
        computing: 'Computing document hash (CID)...',
        checking: 'Checking registry...',
        aiVerifying: 'Document found! Performing AI verification...',
        complete: 'Verification complete!',
      },
      results: {
        title: 'Verification Results',
        verified: 'Document Verified!',
        notFound: 'Not Found',
        verifiedBadge: 'VERIFIED',
        unverifiedBadge: 'UNVERIFIED',
        issuedOn: 'Issued On',
        issuedBy: 'Issued By',
        entityUrl: 'Entity URL',
        metadata: 'Metadata',
        registryAddress: 'Registry Address',
        aiVerification: 'AI Verification',
        registryVerified: 'Registry address verified on entity website',
        registryNotVerified: 'Could not verify registry address on entity website',
      },
      toast: {
        verified: 'Document Verified!',
        foundIn: 'Found in',
        notFound: 'Document Not Found',
        notFoundDesc: 'This document has not been registered on the blockchain',
        failed: 'Verification Failed',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
      },
    },
    sandbox: {
      title: 'Sandbox',
      subtitle: 'Explore and experiment with the Affix platform (soon)',
    },
    errors: {
      somethingWrong: 'Something went wrong!',
      apology:
        'We apologize for the inconvenience. An error occurred while processing your request.',
      errorDetails: 'Error Details:',
      errorId: 'Error ID:',
      tryAgain: 'Try Again',
      persistProblem: 'If the problem persists, please refresh the page or',
      contactSupport: 'contact support',
    },
    notFound: {
      code: '404',
      title: 'Page Not Found',
      description: "The page you're looking for doesn't exist.",
      returnHome: 'Return Home',
    },
    components: {
      header: {
        registerTitle: 'Register New Account',
        registerDesc:
          'An Ethereum wallet will be created and securely stored on your device, protected by your biometric or PIN thanks to',
        w3pk: 'w3pk',
        username: 'Username',
        usernamePlaceholder: 'Enter your username',
        usernameValidation:
          'Username must be 3-50 characters long and contain only letters, numbers, underscores, and hyphens. It must start and end with a letter or number.',
        createAccount: 'Create Account',
        usernameRequired: 'Username Required',
        usernameRequiredDesc: 'Please enter a username to register.',
        registrationFailed: 'Registration Failed',
        registrationFailedDesc: 'Unable to complete registration. Please try again.',
      },
      passwordModal: {
        password: 'Password',
        placeholder: 'Enter your password',
        passwordRequired: 'Password Required.',
        passwordRequiredDesc: 'Please enter your password.',
        weakPassword: 'Weak Password.',
        weakPasswordDesc: 'Please use a stronger password that meets all requirements.',
        submissionError: 'Submission Error.',
        passwordMustInclude: 'Password must include:',
        atLeast12: 'At least 12 characters',
        oneUppercase: 'One uppercase letter',
        oneLowercase: 'One lowercase letter',
        oneNumber: 'One number',
        oneSpecial: 'One special character',
        notMeetRequirements: 'Password does not meet all requirements',
        strongPassword: 'Strong password!',
        satisfied: '(satisfied)',
        required: '(required)',
      },
    },
  },

  // Urdu
  ur: {
    common: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      pleaseLogin: 'Please login',
      cancel: 'Cancel',
      submit: 'Submit',
      copy: 'Copy',
      view: 'View',
      remove: 'Remove',
      tryAgain: 'Try Again',
      browse: 'browse',
    },
    home: {
      title: 'Welcome!',
      subtitle: "It's a pleasure to have you here!",
      greeting: 'Hello Anon!',
      greetingSubtitle: 'Sit back, relax, and build something cool!',
      hero: {
        tagline: 'your onchain seal',
        letTheWorld: 'Let the world',
        verify: 'verify',
        it: 'it',
        description:
          'Authenticate your documents onchain while keeping your existing workflows intact. Anyone can then instantly verify that documents are genuine and unaltered.',
        dashboardButton: 'Your Dashboard',
        verifyButton: 'Verify',
      },
      problem: {
        title: 'The Document Fraud Epidemic...',
        description:
          'Fake documents cause billions of dollars in losses every year. From fraudulent certificates to forged contracts, document verification is broken. Web3 fixes this.',
      },
      features: {
        title: 'Discover Affix!',
        easyToVerify: 'Easy to Verify',
        easyToVerifyDesc:
          'One-click verification for anyone, anywhere. No technical knowledge required.',
        unbreakableSecurity: 'Unbreakable Security',
        unbreakableSecurityDesc: 'Blockchain-powered proof that cannot be tampered with or forged.',
        privacyFirst: 'Privacy First',
        privacyFirstDesc:
          "We don't store your documents. Only cryptographic fingerprints go onchain.",
        aiPowered: 'AI-Powered Verification',
        aiPoweredDesc:
          'AI helps you verify things. It checks if instance addresses match URLs registered onchain for enhanced security.',
        forEveryone: 'For Everyone',
        forEveryoneDesc:
          'Perfect for organizations, businesses, and individuals who need document authenticity.',
        antiFraud: 'Anti-Fraud Protection',
        antiFraudDesc:
          'Combat the billions in annual losses from fake documents with blockchain verification.',
      },
      documentTypes: {
        title: 'Works with Any Document Type',
        pdfs: 'PDFs',
        images: 'Images',
        videos: 'Videos',
        anyFile: 'Any File',
      },
      howItWorks: {
        title: 'How It Works',
        step1Title: 'Publish Digital Footprint',
        step1Desc:
          'Upload any document type and we create a unique cryptographic fingerprint that goes onchain',
        step2Title: 'Anyone Can Verify',
        step2Desc:
          'Share the document with anyone - they can instantly verify its authenticity with AI assistance',
        step3Title: 'Guaranteed Authenticity',
        step3Desc:
          'Prove a statement was made by you with immutable blockchain evidence and AI verification',
      },
      trust: {
        noStorage: "We Don't Store Your Documents",
        noStorageDesc:
          'Your files never leave your device. Only mathematical proofs are recorded onchain.',
        guaranteeAuthorship: 'Guarantee Authorship',
        guaranteeAuthorshipDesc:
          "Cryptographically prove a statement was made by you at a specific time. That's the magic of Web3.",
      },
      roadmap: {
        title: 'Roadmap',
        publicDocuments: 'Public documents',
        publicDocumentsDesc:
          'Public documents stored in a decentralized fashion for permanent accessibility, transparency, and more',
        digitalAgreements: 'Digital Agreements',
        digitalAgreementsDesc: 'DocuSign-style functionality for agreements and contract signing',
        mainnetLaunch: 'Mainnet Launch',
        mainnetLaunchDesc:
          "We're in contact with several institutions in Burkina Faso. They're ready to deploy their own instance...",
        comingSoon: 'Coming Soon',
      },
      cta: {
        title: 'Ready to Authenticate Your Documents with Affix?',
        description:
          'Join us in the fight against document fraud. Get started today or reach out to learn more.',
        contactButton: 'Contact Us',
      },
    },
    navigation: {
      settings: 'Settings',
      dashboard: 'Dashboard',
      verify: 'Verify',
      sandbox: 'Sandbox',
    },
    settings: {
      title: 'Settings',
      loginRequired: 'Please login to access your settings',
    },
    dashboard: {
      title: 'Welcome to Your Dashboard',
      subtitle: 'Manage your documents and permissions',
      loginPrompt: 'Please login',
      exploreWithout: 'Want to explore without logging in?',
      tryThe: 'Try the',
      toExplore: 'to explore the platform',
      checkingPermissions: 'Checking permissions...',
      welcome: 'Welcome',
      yourAddress: 'Your Address:',
      issueDocument: {
        title: 'Issue Document',
        issueOnBehalf: 'Issue a document on behalf of',
        contractAddress: 'Contract address',
        clickToUpload: 'Click to upload document',
        documentCID: 'Document CID',
        issueButton: 'Issue Document',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
        cidGenerated: 'CID Generated',
        cidGeneratedDesc: 'Document hash computed successfully',
        error: 'Error',
        computeError: 'Failed to compute document hash',
        noDocument: 'No document',
        noDocumentDesc: 'Please upload a document first',
        notAuthenticated: 'Not authenticated',
        notAuthenticatedDesc: 'Please login to issue documents',
        txSubmitted: 'Transaction Submitted',
        txHash: 'Hash',
        success: 'Document Issued Successfully',
        viewTxOn: 'View transaction on',
        viewTx: 'View Transaction',
        failed: 'Issuance Failed',
      },
      addAgent: {
        title: 'Add Agent',
        agentAddress: 'Agent Address',
        placeholder: 'Enter the Ethereum address of the new agent',
        addButton: 'Add as Agent',
        registryContract: 'Registry Contract',
        noAddress: 'No address provided',
        noAddressDesc: 'Please enter an address',
        invalidAddress: 'Invalid address',
        invalidAddressDesc: 'Please enter a valid Ethereum address',
        noRegistry: 'No registry found',
        noRegistryDesc: 'Cannot add agent without a registry address',
        alreadyAgent: 'Already an Agent',
        notAuthenticated: 'Not Authenticated',
        success: 'Agent Created',
        failed: 'Failed to Make Agent',
      },
    },
    verify: {
      title: 'Verify Documents',
      subtitle: 'Verify document authenticity.',
      upload: {
        dropHere: 'Drop your document here, or',
        supportsAny: 'Supports any file format',
        noDocument: 'No document provided',
        noDocumentDesc: 'Please upload a file or enter a document CID/hash',
        copied: 'Copied to clipboard',
        clickToCopy: 'Click to copy - This CID will be used for verification',
      },
      progress: {
        computing: 'Computing document hash (CID)...',
        checking: 'Checking registry...',
        aiVerifying: 'Document found! Performing AI verification...',
        complete: 'Verification complete!',
      },
      results: {
        title: 'Verification Results',
        verified: 'Document Verified!',
        notFound: 'Not Found',
        verifiedBadge: 'VERIFIED',
        unverifiedBadge: 'UNVERIFIED',
        issuedOn: 'Issued On',
        issuedBy: 'Issued By',
        entityUrl: 'Entity URL',
        metadata: 'Metadata',
        registryAddress: 'Registry Address',
        aiVerification: 'AI Verification',
        registryVerified: 'Registry address verified on entity website',
        registryNotVerified: 'Could not verify registry address on entity website',
      },
      toast: {
        verified: 'Document Verified!',
        foundIn: 'Found in',
        notFound: 'Document Not Found',
        notFoundDesc: 'This document has not been registered on the blockchain',
        failed: 'Verification Failed',
        fileTooLarge: 'File too large',
        fileTooLargeDesc: 'Please select a file smaller than 10MB',
      },
    },
    sandbox: {
      title: 'Sandbox',
      subtitle: 'Explore and experiment with the Affix platform (soon)',
    },
    errors: {
      somethingWrong: 'Something went wrong!',
      apology:
        'We apologize for the inconvenience. An error occurred while processing your request.',
      errorDetails: 'Error Details:',
      errorId: 'Error ID:',
      tryAgain: 'Try Again',
      persistProblem: 'If the problem persists, please refresh the page or',
      contactSupport: 'contact support',
    },
    notFound: {
      code: '404',
      title: 'Page Not Found',
      description: "The page you're looking for doesn't exist.",
      returnHome: 'Return Home',
    },
    components: {
      header: {
        registerTitle: 'Register New Account',
        registerDesc:
          'An Ethereum wallet will be created and securely stored on your device, protected by your biometric or PIN thanks to',
        w3pk: 'w3pk',
        username: 'Username',
        usernamePlaceholder: 'Enter your username',
        usernameValidation:
          'Username must be 3-50 characters long and contain only letters, numbers, underscores, and hyphens. It must start and end with a letter or number.',
        createAccount: 'Create Account',
        usernameRequired: 'Username Required',
        usernameRequiredDesc: 'Please enter a username to register.',
        registrationFailed: 'Registration Failed',
        registrationFailedDesc: 'Unable to complete registration. Please try again.',
      },
      passwordModal: {
        password: 'Password',
        placeholder: 'Enter your password',
        passwordRequired: 'Password Required.',
        passwordRequiredDesc: 'Please enter your password.',
        weakPassword: 'Weak Password.',
        weakPasswordDesc: 'Please use a stronger password that meets all requirements.',
        submissionError: 'Submission Error.',
        passwordMustInclude: 'Password must include:',
        atLeast12: 'At least 12 characters',
        oneUppercase: 'One uppercase letter',
        oneLowercase: 'One lowercase letter',
        oneNumber: 'One number',
        oneSpecial: 'One special character',
        notMeetRequirements: 'Password does not meet all requirements',
        strongPassword: 'Strong password!',
        satisfied: '(satisfied)',
        required: '(required)',
      },
    },
  },
}

/**
 * Get translations for the current language
 * @param language Current language code
 * @returns Translation object for the specified language
 */
export function getTranslations(language: Language) {
  return translations[language]
}

/**
 * Hook to use translations in components
 * @param language Current language code
 * @returns Translation object for the specified language
 */
export function useTranslations(language: Language) {
  return translations[language]
}
