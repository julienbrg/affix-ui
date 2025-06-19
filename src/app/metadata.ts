import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Veridocs',
  description: 'Verify document authenticity',

  keywords: ['Web3', 'Next.js', 'Ethereum', 'DApp', 'Blockchain', 'Wallet'],
  authors: [{ name: 'Julien Béranger', url: 'https://github.com/julienbrg' }],

  openGraph: {
    title: 'Veridocs',
    description: 'Verify document authenticity',
    url: 'https://veridocs-ui.vercel.app',
    siteName: 'Veridocs',
    images: [
      {
        url: '/huangshan.png',
        width: 1200,
        height: 630,
        alt: 'Veridocs',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Veridocs',
    description: 'Verify document authenticity',
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
