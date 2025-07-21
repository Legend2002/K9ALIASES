
"use client";

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Settings as SettingsIcon, ShieldCheck, Fingerprint, Smartphone, Laptop, Monitor, Bell, Download, Database, Shuffle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { getSettingsData, updateAppPreferences, updateNotificationPreferences, getSessions, logoutFromAllOtherDevices, type SettingsData, updateAliasGenerationRules, exportAliasesToPdf } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

function SubmitButton({ children, variant, disabled }: { children: React.ReactNode, variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined, disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} variant={variant}>
      {pending ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}

function AppPreferencesForm({ settingsData }: { settingsData: SettingsData }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(updateAppPreferences, { success: false });

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="defaultAliasCount">Default Alias Count</Label>
                    <Select name="defaultAliasCount" defaultValue={String(settingsData.defaultAliasCount)}>
                        <SelectTrigger id="defaultAliasCount">
                            <SelectValue placeholder="Select a number" />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5].map(num => (
                                <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="defaultAliasLength">Default Alias Length</Label>
                    <Select name="defaultAliasLength" defaultValue={String(settingsData.defaultAliasLength)}>
                        <SelectTrigger id="defaultAliasLength">
                            <SelectValue placeholder="Select a length" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="12">12 characters</SelectItem>
                            <SelectItem value="16">16 characters</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <SubmitButton>Save Preferences</SubmitButton>
        </form>
    );
}

function AliasGenerationForm({ settingsData }: { settingsData: SettingsData }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(updateAliasGenerationRules, { success: false });

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
        <form action={formAction} className="space-y-6">
            <div className="space-y-2">
                <Label>Alias Separator</Label>
                <p className="text-sm text-muted-foreground">Character between the description and random string, e.g., `AppName<span className="font-bold text-primary">{settingsData.aliasSeparator}</span>randomstring`.</p>
                <RadioGroup name="aliasSeparator" defaultValue={settingsData.aliasSeparator} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['-', '_', '.'].map(sep => (
                        <div key={sep}>
                            <RadioGroupItem value={sep} id={`sep-${sep}`} className="peer sr-only" />
                            <Label htmlFor={`sep-${sep}`} className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <span className="font-mono text-lg">{sep}</span>
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>
            <div className="space-y-2">
                <Label>Random String Case</Label>
                 <p className="text-sm text-muted-foreground">Case for the random string part of the alias.</p>
                <Select name="aliasCase" defaultValue={settingsData.aliasCase}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a case style" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="mixed">Mixed Case (e.g., aB1cD2)</SelectItem>
                        <SelectItem value="lowercase">Lowercase (e.g., ab1cd2)</SelectItem>
                        <SelectItem value="uppercase">Uppercase (e.g., AB1CD2)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <SubmitButton>Save Generation Rules</SubmitButton>
        </form>
    );
}

function NotificationPreferencesForm({ settingsData }: { settingsData: SettingsData }) {
    const { toast } = useToast();
    const [state, formAction] = useActionState(updateNotificationPreferences, { success: false });

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
        <form action={formAction} className="space-y-6">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">New Alias Creation</Label>
                    <p className="text-sm text-muted-foreground">
                        Receive an email when a new alias is created via the app.
                    </p>
                </div>
                <Switch
                    name="notifyOnAliasCreation"
                    defaultChecked={settingsData.notifyOnAliasCreation}
                />
            </div>
             <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                       Receive an email for important security events, like a new device login.
                    </p>
                </div>
                <Switch
                    name="notifyOnSecurityEvent"
                    defaultChecked={settingsData.notifyOnSecurityEvent}
                />
            </div>
             <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Weekly Summary</Label>
                    <p className="text-sm text-muted-foreground">
                        Get a weekly summary of your alias activity.
                    </p>
                </div>
                <Switch
                    name="sendWeeklySummary"
                    defaultChecked={settingsData.sendWeeklySummary}
                />
            </div>
            <SubmitButton>Save Notifications</SubmitButton>
        </form>
    );
}

function DataSyncSection() {
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

    const handleExport = async () => {
        setIsExporting(true);
        const result = await exportAliasesToPdf();
        if (result.success && result.data) {
            const byteCharacters = atob(result.data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `k9-aliases-export-${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: "Export Successful", description: "Your alias data has been downloaded as a PDF." });
        } else {
            toast({ variant: 'destructive', title: "Export Failed", description: result.error || "An unknown error occurred." });
        }
        setIsExporting(false);
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Download /> Export Your Data</CardTitle>
                <CardDescription>Download a PDF file of all your active and inactive aliases for backup or migration purposes.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleExport} disabled={isExporting}>
                    {isExporting ? <Loader2 className="animate-spin mr-2" /> : null}
                    Export All Aliases to PDF
                </Button>
            </CardContent>
        </Card>
    );
}

function SessionManagement() {
    const [sessions, setSessions] = useState<{ currentSession: Session | null, otherSessions: Session[] }>({ currentSession: null, otherSessions: [] });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchSessions = () => {
        setLoading(true);
        getSessions().then(data => {
            setSessions(data);
            setLoading(false);
        });
    }

    useEffect(() => {
        fetchSessions();
    }, []);

    const [state, formAction] = useActionState(logoutFromAllOtherDevices, { success: false });

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? 'Success!' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
             if (state.success) {
                fetchSessions();
            }
        }
        if (state.error) {
             toast({
                variant: "destructive",
                title: 'Error',
                description: state.error,
            });
        }
    }, [state, toast]);

    const getDeviceIcon = (userAgent: string) => {
        if (!userAgent) return <Monitor />;
        const ua = userAgent.toLowerCase();
        if (ua.includes('iphone') || ua.includes('android')) return <Smartphone />;
        if (ua.includes('mac') || ua.includes('ipad')) return <Laptop />;
        return <Monitor />;
    };
    
    const parseUserAgent = (userAgent: string) => {
        if (!userAgent) return "Unknown Device";
        const ua = userAgent.toLowerCase();
        let browser = "Unknown Browser";
        let os = "Unknown OS";

        // OS detection
        if (ua.includes('windows')) os = "Windows";
        else if (ua.includes('mac os')) os = "macOS";
        else if (ua.includes('android')) os = "Android";
        else if (ua.includes('iphone')) os = "iPhone";
        else if (ua.includes('linux')) os = "Linux";

        // Browser detection - more specific checks first
        if (ua.includes('firefox')) browser = "Firefox";
        else if (ua.includes('opr/')) browser = "Opera";
        else if (ua.includes('edg/')) browser = "Edge";
        else if (ua.includes('chrome')) browser = "Chrome";
        else if (ua.includes('safari')) browser = "Safari";
        
        return `${browser} on ${os}`;
    }

    const { currentSession, otherSessions } = sessions;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Session Management</CardTitle>
                <CardDescription>Review and manage where your account is currently signed in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : (
                    <>
                        {currentSession && (
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                                <div className="flex items-center gap-4">
                                    <div className="text-muted-foreground">{getDeviceIcon(currentSession.userAgent)}</div>
                                    <div>
                                        <p className="font-medium">{parseUserAgent(currentSession.userAgent)}</p>
                                        <p className="text-sm text-muted-foreground">Logged in {formatDistanceToNow(new Date(currentSession.createdAt), { addSuffix: true })}</p>
                                    </div>
                                </div>
                                <Button variant="outline" disabled>Current Session</Button>
                            </div>
                        )}

                        {otherSessions.map(session => (
                             <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                               <div className="flex items-center gap-4">
                                   <div className="text-muted-foreground">{getDeviceIcon(session.userAgent)}</div>
                                   <div>
                                        <p className="font-medium">{parseUserAgent(session.userAgent)}</p>
                                        <p className="text-sm text-muted-foreground">Logged in {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}</p>
                                   </div>
                               </div>
                            </div>
                        ))}
                        
                        {otherSessions.length > 0 && (
                            <>
                                <Separator />
                                <form action={formAction} className="flex items-center justify-end">
                                    <SubmitButton variant="destructive">Log Out From All Other Devices</SubmitButton>
                                </form>
                            </>
                        )}
                        
                        {otherSessions.length === 0 && !currentSession && (
                             <Alert>
                                <AlertTitle>No Active Sessions Found</AlertTitle>
                                <AlertDescription>
                                    Something went wrong and we could not find any active sessions. Please try logging out and back in.
                                </AlertDescription>
                             </Alert>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function SettingsPageContent({ initialSettingsData }: { initialSettingsData: SettingsData | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'preferences';

  if (!initialSettingsData) {
      return (
        <div className="flex items-center justify-center h-full">
            <p className="text-destructive">Could not load settings data.</p>
        </div>
      )
  }

  const handleTabChange = (value: string) => {
    router.push(`/settings?tab=${value}`, { scroll: false });
  };

  return (
       <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList>
                <TabsTrigger value="preferences">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Preferences
                </TabsTrigger>
                <TabsTrigger value="security">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Privacy & Security
                </TabsTrigger>
                <TabsTrigger value="data">
                    <Database className="mr-2 h-4 w-4" />
                    Data & Sync
                </TabsTrigger>
            </TabsList>
            <TabsContent value="preferences" className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Application Preferences</CardTitle>
                        <CardDescription>Set default values for generating new aliases.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AppPreferencesForm settingsData={initialSettingsData} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shuffle /> Custom Alias Generation</CardTitle>
                        <CardDescription>Customize how standard aliases are generated.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AliasGenerationForm settingsData={initialSettingsData} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bell /> Notification Preferences</CardTitle>
                        <CardDescription>Manage how you receive notifications from us.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <NotificationPreferencesForm settingsData={initialSettingsData} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="security" className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Fingerprint/> Two-Factor Authentication</CardTitle>
                        <CardDescription>Add an extra layer of security to your account by requiring a second verification step at login.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                            <div>
                                <p className="font-medium">2FA is not enabled</p>
                                <p className="text-sm text-muted-foreground">Protect your account from unauthorized access.</p>
                            </div>
                            <Button disabled>Enable 2FA</Button>
                        </div>
                    </CardContent>
                </Card>

                <SessionManagement />
            </TabsContent>
            <TabsContent value="data" className="space-y-6">
                <DataSyncSection />
            </TabsContent>
       </Tabs>
  );
}

function SettingsPageSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-64" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </CardContent>
            </Card>
        </div>
    )
}

export default function SettingsPage() {
    const [settingsData, setSettingsData] = useState<SettingsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSettingsData().then(data => {
            setSettingsData(data);
            setLoading(false);
        });
    }, []);

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
       <div className="space-y-1.5">
         <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
         <p className="text-muted-foreground">Manage your account settings and application preferences.</p>
       </div>
       {loading ? <SettingsPageSkeleton /> : <SettingsPageContent initialSettingsData={settingsData} />}
    </div>
  );
}

    