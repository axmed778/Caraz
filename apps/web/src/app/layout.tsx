import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    default: 'CarAZ — Avtomobil Bazarı',
    template: '%s | CarAZ',
  },
  description: 'Azərbaycanda ən böyük avtomobil alqı-satqı platforması',
  keywords: ['avtomobil', 'maşın', 'araba', 'car', 'azerbaijan', 'baku'],
  openGraph: {
    siteName: 'CarAZ',
    type: 'website',
    locale: 'az_AZ',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az">
      <body>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
