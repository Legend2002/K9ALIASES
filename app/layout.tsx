
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { Josefin_Sans, Rubik } from 'next/font/google';

const josefinSans = Josefin_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-josefin-sans',
});

const rubik = Rubik({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-rubik',
});

export const metadata: Metadata = {
  title: 'K9-ALI@SES - Secure Email Aliases',
  description: 'Generate unique and secure email aliases to protect your main inbox. Track where you use them and stay in control of your digital identity.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-sans antialiased", josefinSans.variable, rubik.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
