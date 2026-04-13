import type {Metadata} from 'next';
import { Newsreader, Inter } from 'next/font/google';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Mistika - Curso Online',
  description: 'A nova identidade feminina - Dia 01',
  icons: {
    icon: 'https://curtai.online/favicon_curtai.png',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-br" className={`${newsreader.variable} ${inter.variable}`}>
      <head />
      <body className="bg-white text-slate-900 min-h-screen font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
