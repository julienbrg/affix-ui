'use client'

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { type ReactNode, memo } from 'react'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'

// Define Filecoin Calibration Network
const filecoinCalibration = {
  id: 314159,
  name: 'Filecoin Calibration',
  nativeCurrency: {
    decimals: 18,
    name: 'Filecoin',
    symbol: 'tFIL',
  },
  rpcUrls: {
    default: {
      http: ['https://api.calibration.node.glif.io/rpc/v1'],
    },
    public: {
      http: ['https://api.calibration.node.glif.io/rpc/v1'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Filscan Calibration',
      url: 'https://calibration.filscan.io/en/message',
    },
  },
  testnet: true,
}

const projectId = process.env['NEXT_PUBLIC_PROJECT_ID']
if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not set')
}

const ethersAdapter = new EthersAdapter()

createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks: [filecoinCalibration],
  defaultNetwork: filecoinCalibration,
  metadata: {
    name: 'Veridocs',
    description: 'Verify document authenticity',
    url: 'https://veridocs-ui.vercel.app',
    icons: ['./favicon.ico'],
  },
  enableEIP6963: true,
  enableCoinbase: true,
})

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: '#000000',
        color: 'white',
      },
    },
  },
})

const ContextProvider = memo(function ContextProvider({ children }: { children: ReactNode }) {
  return <ChakraProvider theme={theme}>{children}</ChakraProvider>
})

export default ContextProvider
