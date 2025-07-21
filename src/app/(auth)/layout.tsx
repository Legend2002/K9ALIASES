import type { Metadata } from 'next';
import './auth.css';

export const metadata: Metadata = {
  title: 'Authentication - K9-ALI@SES',
  description: 'Login or create an account to get started.',
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
