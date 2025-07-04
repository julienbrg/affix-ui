import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Documents | Affix',
  description: 'Verify the authenticity of documents using blockchain technology',

  openGraph: {
    title: 'Verify Documents | Affix',
    description: 'Verify the authenticity of documents using blockchain technology',
    url: 'https://affix-ui.vercel.app/verify',
    siteName: 'Affix',
    images: [
      {
        url: '/huangshan.png',
        width: 1200,
        height: 630,
        alt: 'Affix Verify - Document Authentication Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Verify Documents | Affix',
    description: 'Verify the authenticity of documents using blockchain technology',
    images: ['/huangshan.png'],
  },
}

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
