
import Header from '@/components/header';
import { AppProvider } from '@/context/app-context';
import { getProfileData } from './profile/actions';
import { ThemeProvider } from '@/components/theme-provider';

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profileData = await getProfileData();

  const initialEmailContext = {
    email: profileData?.email || '',
    displayName: profileData?.displayName || '',
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={profileData?.theme || 'system'}
      enableSystem
      disableTransitionOnChange
    >
      <AppProvider initialEmail={initialEmailContext}>
        <div className="min-h-screen bg-background">
            <Header />
            <main>{children}</main>
        </div>
      </AppProvider>
    </ThemeProvider>
  );
}
