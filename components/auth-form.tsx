
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AtSign, Lock } from 'lucide-react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Josefin_Sans, Rubik } from 'next/font/google';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { signup, login } from '@/app/(auth)/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

type AuthFormMode = 'login' | 'signup';

const content = {
  login: {
    titlePrefix: 'Sign In to',
    titleSuffix: 'K9-ALI@SES',
    description: "Welcome back! Sign in to manage your aliases.",
    buttonText: 'Sign In',
    footerText: "Don't have an account?",
    footerLinkText: "Sign up",
    footerLinkHref: '/signup',
    action: login,
  },
  signup: {
    titlePrefix: 'Sign Up to',
    titleSuffix: 'K9-ALI@SES',
    description: "Start your journey to a more secure inbox.",
    buttonText: 'Sign Up',
    footerText: 'Already have an account?',
    footerLinkText: 'Sign in',
    footerLinkHref: '/login',
    action: signup,
  },
};

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full text-lg bg-blue-600 hover:bg-blue-700" disabled={pending}>
      {pending ? "Please wait..." : text}
    </Button>
  );
}

export default function AuthForm({ mode }: { mode: AuthFormMode }) {
  const { titlePrefix, titleSuffix, description, buttonText, footerText, footerLinkText, footerLinkHref, action } = content[mode];
  const [state, formAction] = useActionState(action, { message: '', success: false, error: undefined });
  
  return (
    <div className={cn("font-sans antialiased", josefinSans.variable, rubik.variable)}>
      <div className="flex min-h-screen w-full bg-gray-50">
        <div className="flex w-full flex-col justify-between p-8 md:w-1/2">
          <div className="flex items-center space-x-2 self-start">
            <Image
              src="/k9-logo.png"
              alt="K9-ALI@SES Logo"
              width={32}
              height={32}
              data-ai-hint="paw heart"
            />
            <span style={{color: '#4285F4'}} className="text-xl font-bold uppercase tracking-wider font-heading">K9-ALI@SES</span>
          </div>

          <div className="w-full max-w-xs self-center py-8">
            <div className="mb-6 text-left">
              <p className="text-sm text-gray-500">{description}</p>
              <h1 className="text-3xl font-bold text-gray-900">
                {titlePrefix}{' '}
                <span style={{ color: '#4285F4' }} className="font-heading uppercase tracking-wider whitespace-nowrap">{titleSuffix}</span>
              </h1>
            </div>

            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <AtSign className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input id="email" name="email" type="email" placeholder="example@email.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input id="password" name="password" type="password" placeholder="••••••••" required />
                </div>
              </div>
              <SubmitButton text={buttonText} />
            </form>
            
            {(state.message || state.error) && (
                <Alert variant={state.success ? 'default' : 'destructive'} className="mt-4">
                    <AlertDescription>
                        {state.message || state.error}
                    </AlertDescription>
                </Alert>
            )}

          </div>

          <div className="text-center text-sm self-start">
            <p className="text-gray-600">
              {footerText}{' '}
              <Link href={footerLinkHref} className="font-medium text-blue-600 hover:underline">
                {footerLinkText}
              </Link>
            </p>
          </div>
        </div>

        <div className="relative hidden w-1/2 items-center justify-center md:flex">
          <Image
            src="/auth-image.png"
            alt="Promotional banner"
            fill
            className="object-cover"
            data-ai-hint="futuristic security"
          />
        </div>
      </div>
    </div>
  );
}
