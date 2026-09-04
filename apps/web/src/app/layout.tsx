import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NavBar } from '@/components/nav-bar';
import { DisclaimerModal } from '@/components/disclaimer-modal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Financial Health Copilot',
  description:
    "Know what's safe to spend, what to set aside for tax, and how close you are to GST registration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="app-shell min-h-screen flex flex-col pb-16 md:pb-0">
          <NavBar />
          <main className="page-enter flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <DisclaimerModal />
        </div>
      </body>
    </html>
  );
}
