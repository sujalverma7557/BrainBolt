import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AppNav } from '@/components/AppNav';

export const metadata: Metadata = {
  title: 'BrainBolt – Adaptive Infinite Quiz',
  description: 'One question at a time. Difficulty adapts to you.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppNav />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
