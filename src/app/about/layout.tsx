import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | Ministry of Sound',
  description: 'Ministry of Sound official website and onchain registry information',

  openGraph: {
    title: 'About | Ministry of Sound',
    description: 'Ministry of Sound official website and onchain registry information',
    url: 'https://veridocs-ui.vercel.app/about',
    siteName: 'Ministry of Sound',
    images: [
      {
        url: '/huangshan.png',
        width: 1200,
        height: 630,
        alt: 'Ministry of Sound - About',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'About | Ministry of Sound',
    description: 'Ministry of Sound official website and onchain registry information',
    images: ['/huangshan.png'],
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}