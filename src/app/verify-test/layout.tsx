import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Documents | Veridocs',
  description: 'Verify the authenticity of documents using blockchain technology',

  openGraph: {
    title: 'Verify Documents | Veridocs',
    description: 'Verify the authenticity of documents using blockchain technology',
    url: 'https://veridocs-ui.vercel.app/verify',
    siteName: 'Veridocs',
    images: [
      {
        url: '/huangshan.png',
        width: 1200,
        height: 630,
        alt: 'Veridocs Verify - Document Authentication Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Verify Documents | Veridocs',
    description: 'Verify the authenticity of documents using blockchain technology',
    images: ['/huangshan.png'],
  },
}

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
