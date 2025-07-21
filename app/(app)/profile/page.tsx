
"use client";

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { User, Loader2, Palette, Sun, Moon, Laptop, KeyRound, AlertTriangle } from 'lucide-react';
import { useTheme } from 'next-themes';

import { updateProfile, getProfileData, updateTheme, type ProfileData, changePassword, deleteAccount } from './actions';
import { usePrimaryEmail } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

function SubmitButton({ children, variant }: { children: React.ReactNode, variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant}>
      {pending ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}

function PersonalInfoForm({ profileData }: { profileData: ProfileData }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(updateProfile, { success: false });
     const { setPrimaryEmail } = usePrimaryEmail();

    React.useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? 'Success!' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
        }
        if (state.error) {
            toast({
                variant: "destructive",
                title: 'Error',
                description: state.error,
            });
        }
        if (state.success) {
            // Update context on successful save
            const form = document.getElementById('personal-info-form') as HTMLFormElement;
            if (form) {
                const formData = new FormData(form);
                const newDisplayName = formData.get('displayName') as string;
                setPrimaryEmail({
                    email: profileData.email,
                    displayName: newDisplayName || '',
                });
            }
        }
    }, [state, toast, profileData.email, setPrimaryEmail]);

    return (
        <form id="personal-info-form" action={formAction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" name="displayName" defaultValue={profileData.displayName || ''} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" value={profileData.email} disabled />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" defaultValue={profileData.firstName || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" defaultValue={profileData.lastName || ''} />
                </div>
            </div>
            <SubmitButton>Save Changes</SubmitButton>
        </form>
    );
}

function ThemeForm({ currentTheme }: { currentTheme: 'light' | 'dark' | 'system' }) {
    const { setTheme } = useTheme();
    const { toast } = useToast();

    const handleThemeChange = async (value: 'light' | 'dark' | 'system') => {
        setTheme(value);
        const result = await updateTheme(value);
        if (result.success) {
            toast({
                title: "Theme updated!",
                description: result.message
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error updating theme',
                description: result.error
            });
        }
    };

    return (
        <RadioGroup
            defaultValue={currentTheme}
            className="grid grid-cols-3 gap-4"
            onValueChange={handleThemeChange}
        >
            <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label htmlFor="light" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <Sun className="mb-3 h-6 w-6" />
                    Light
                </Label>
            </div>
            <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <Moon className="mb-3 h-6 w-6" />
                    Dark
                </Label>
            </div>
            <div>
                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                <Label htmlFor="system" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                    <Laptop className="mb-3 h-6 w-6" />
                    System
                </Label>
            </div>
        </RadioGroup>
    );
}

function ChangePasswordForm() {
    const { toast } = useToast();
    const [state, formAction] = useActionState(changePassword, { success: false });

    React.useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? 'Success!' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
        }
        if (state.error) {
             toast({
                variant: "destructive",
                title: 'Error',
                description: state.error,
            });
        }
    }, [state, toast]);


    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            <SubmitButton>Update Password</SubmitButton>
        </form>
    )
}

function DangerZone() {
    const [state, formAction] = useActionState(deleteAccount, { success: false });
    const { toast } = useToast();

    useEffect(() => {
        if (state.error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: state.error,
            });
        }
        // Success case is handled by redirection, so no toast is needed
    }, [state, toast]);
    
    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle/> Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription>
                    These actions are permanent and cannot be undone. Proceed with caution.
                </CardDescription>
            </CardContent>
            <CardContent>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <form action={formAction}>
                                <AlertDialogAction asChild>
                                    <SubmitButton variant="destructive">Yes, delete my account</SubmitButton>
                                </AlertDialogAction>
                            </form>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    )
}

function ProfilePageContent({ initialProfileData }: { initialProfileData: ProfileData | null }) {
  if (!initialProfileData) {
      return (
        <div className="flex items-center justify-center h-full">
            <p className="text-destructive">Could not load profile data.</p>
        </div>
      )
  }

  return (
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User /> Personal Information</CardTitle>
                        <CardDescription>Update your personal details. The display name will be shown in the header.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PersonalInfoForm profileData={initialProfileData} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Palette /> Theme</CardTitle>
                        <CardDescription>Select a theme for your dashboard experience.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ThemeForm currentTheme={initialProfileData.theme} />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><KeyRound /> Security</CardTitle>
                        <CardDescription>Update your password for better security.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChangePasswordForm />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-8">
                 <DangerZone />
            </div>
       </div>
  );
}

function ProfilePageSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                   <div className="grid grid-cols-3 gap-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                   </div>
                </CardContent>
            </Card>
             <Card>
                 <CardHeader>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        </div>
    )
}

export default function ProfilePage() {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProfileData().then(data => {
            setProfileData(data);
            setLoading(false);
        });
    }, []);

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
       <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
       {loading ? <ProfilePageSkeleton /> : <ProfilePageContent initialProfileData={profileData} />}
    </div>
  );
}
