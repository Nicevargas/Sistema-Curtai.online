import type {Metadata} from 'next';
import './globals.css';
import SubscriptionGuard from '@/components/SubscriptionGuard';

export const metadata: Metadata = {
  title: 'Curtai - Curso Online',
  description: 'A nova identidade feminina - Dia 01',
  icons: {
    icon: 'https://curtai.online/favicon_curtai.png',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-br">
      <head />
      <body className="bg-white text-slate-900 min-h-screen font-sans" suppressHydrationWarning>
        <SubscriptionGuard>
          {children}
        </SubscriptionGuard>
      </body>
    </html>
  );
}
