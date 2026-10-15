import { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://affix.w3hc.org'),

  title: 'Affix',
  description: 'Affix your onchain seal and let the world verify it',

  keywords: ['Affix', 'Genji', 'w3pk', 'WebAuthn', 'Next.js', 'Web3', 'Ethereum'],
  authors: [{ name: 'W3HC', url: 'https://github.com/w3hc' }],

  openGraph: {
    title: 'Affix',
    description: 'Affix your onchain seal and let the world verify it',
    siteName: 'Affix',
    images: [
      {
        url: '/huangshan.png',
        width: 1200,
        height: 630,
        alt: 'Affix your onchain seal and let the world verify it',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Affix',
    description: 'Affix your onchain seal and let the world verify it',
    images: ['/huangshan.png'],
    creator: '@julienbrg',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  verification: {
    google: 'your-google-site-verification',
  },
}
