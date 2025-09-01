import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | Affix Official',
  description: 'Affix Official website and onchain registry information',

  openGraph: {
    title: 'About | Affix Official',
    description: 'Affix Official website and onchain registry information',
    url: 'https://affix-ui.vercel.app/about',
    siteName: 'Affix Official',
    images: [
      {
        url: '/huangshan.png',
        width: 1200,
        height: 630,
        alt: 'Affix Official - About',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'About | Affix Official',
    description: 'Affix Official website and onchain registry information',
    images: ['/huangshan.png'],
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
