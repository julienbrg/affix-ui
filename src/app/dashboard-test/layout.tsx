import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | Affix',
  description: 'Manage your document verification dashboard',

  openGraph: {
    title: 'Dashboard | Affix',
    description: 'Manage your document verification dashboard',
    url: 'https://affix-ui.vercel.app/dashboard',
    siteName: 'Affix',
    images: [
      {
        url: '/huangshan.png',
        width: 1200,
        height: 630,
        alt: 'Affix Dashboard - Document Verification Management',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard | Affix',
    description: 'Manage your document verification dashboard',
    images: ['/huangshan.png'],
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
