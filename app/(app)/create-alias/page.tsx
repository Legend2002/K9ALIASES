
"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { MailPlus, Loader, Copy, Check, Inbox, AlertCircle, Lightbulb, User, Globe } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { addAlias, getAliasesCountForUser } from "@/app/(app)/aliases/actions";
import { Domain, Username } from "@/types";
import { generateAlias } from "@/lib/utils";
import { getSettingsData } from "@/app/(app)/settings/actions";
import { getAliasFormData } from "@/app/actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


function SubmitButton({ disabled, children }: { disabled?: boolean, children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} className="w-full">
      {pending ? <Loader className="animate-spin" /> : children}
    </Button>
  );
}

function AliasResultCard({ aliases, description, onCopyAndSave, onSaveStatus }: { aliases: string[], description: string, onCopyAndSave: (alias: string) => void, onSaveStatus: Record<string, string> }) {

  const getButtonState = (alias: string) => {
    const status = onSaveStatus[alias];
    if (status === 'saving') return { text: <Loader className="animate-spin" />, disabled: true };
    if (status === 'saved') return { text: <Check className="h-4 w-4" />, disabled: true };
    return { text: <Copy className="h-4 w-4" />, disabled: false };
  }

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle>Generated Aliases</CardTitle>
        <CardDescription>
          Click to copy and save your new alias.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col min-h-0">
        {aliases.length > 0 ? (
          <ScrollArea className="flex-grow pr-4">
            <ul className="space-y-4">
              {aliases.map((alias, index) => {
                 const { text, disabled } = getButtonState(alias);
                 return (
                  <li key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-muted rounded-md">
                    <span className="font-mono text-sm break-all">{alias}</span>
                    <div className="flex gap-2 self-end sm:self-center">
                      <Button variant="outline" size="icon" onClick={() => onCopyAndSave(alias)} disabled={disabled}>
                         {text}
                        <span className="sr-only">Copy and Save</span>
                      </Button>
                    </div>
                  </li>
                 );
              })}
            </ul>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
            <Inbox className="h-16 w-16 mb-4" />
            <p className="font-semibold">Your aliases are waiting.</p>
            <p className="text-sm">Fill out the form and generate them!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type AliasFormData = {
  domains: Domain[];
  usernames: Username[];
  preferences: {
    defaultCount: number;
    defaultAliasLength: number;
  };
}

type AliasGenerationRules = {
  separator: string;
  case: 'mixed' | 'lowercase' | 'uppercase';
};

export default function CreateAliasPage() {
  const [formData, setFormData] = useState<AliasFormData | null>(null);
  const [generationRules, setGenerationRules] = useState<AliasGenerationRules>({ separator: '-', case: 'mixed'});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [generatedAliases, setGeneratedAliases] = useState<string[]>([]);
  const [currentDescription, setCurrentDescription] = useState("");
  const [saveStatus, setSaveStatus] = useState<Record<string, string>>({});
  const [aliasCounts, setAliasCounts] = useState<{ active: number; limit: number } | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [formDataResult, countsData, settingsData] = await Promise.all([
        getAliasFormData(),
        getAliasesCountForUser(),
        getSettingsData()
      ]);
      setFormData(formDataResult);
      if (countsData.data) {
        setAliasCounts({ active: countsData.data.active, limit: countsData.data.limit });
      }
      if (settingsData) {
        setGenerationRules({
            separator: settingsData.aliasSeparator,
            case: settingsData.aliasCase
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleCopyAndSave = async (alias: string) => {
    navigator.clipboard.writeText(alias);
    setSaveStatus(prev => ({ ...prev, [alias]: 'saving' }));
    toast({
      title: "Copied to Clipboard!",
      description: "Saving alias to your account...",
    });
    
    const result = await addAlias({ alias, description: currentDescription });

    if (result.error) {
      if (result.error.includes('already been saved')) {
        toast({
            title: "Already Saved!",
            description: "This alias is already in your account.",
        });
        setSaveStatus(prev => ({ ...prev, [alias]: 'saved' }));
      } else {
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: result.error,
        });
        setSaveStatus(prev => ({ ...prev, [alias]: 'error' }));
      }
    } else {
      toast({
        title: "Alias Saved!",
        description: "The new alias is now saved to your account.",
      });
       setSaveStatus(prev => ({ ...prev, [alias]: 'saved' }));
       const countsData = await getAliasesCountForUser();
       if (countsData.data) {
         setAliasCounts({ active: countsData.data.active, limit: countsData.data.limit });
       }
    }
  };
  
  const limitReached = aliasCounts ? aliasCounts.active >= aliasCounts.limit : false;
  const availableSlots = aliasCounts ? aliasCounts.limit - aliasCounts.active : 0;
  const maxToGenerate = Math.min(5, availableSlots);

  const [selectedEmail, setSelectedEmail] = useState<string | undefined>(formData?.usernames.find(u => u.isDefault)?.username);

  useEffect(() => {
    if (formData && !selectedEmail) {
      setSelectedEmail(formData.usernames.find(u => u.isDefault)?.username);
    }
  }, [formData, selectedEmail]);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const aliasType = formData.get('aliasType') as 'standard' | 'custom';
    
    let description = '';
    let newAliases: string[] = [];

    if (aliasType === 'standard') {
      const primaryEmail = formData.get('primaryEmail') as string;
      description = formData.get('description') as string;
      const count = Number(formData.get('count'));
      const length = Number(formData.get('length')) as 12 | 16;
      
      for (let i = 0; i < count; i++) {
        newAliases.push(generateAlias({
            primaryEmail, 
            description, 
            length, 
            separator: generationRules.separator, 
            caseStyle: generationRules.case
        }));
      }
    } else {
        const customUsername = formData.get('customUsername') as string;
        const domain = formData.get('domain') as string;
        description = formData.get('description-custom') as string;
        newAliases.push(`${customUsername}@${domain}`);
    }

    setGeneratedAliases(prev => [...newAliases, ...prev]);
    setCurrentDescription(description);
  };


  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <main className="w-full max-w-7xl mt-4 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="lg:col-span-1 min-h-[550px]">
            <Card className="shadow-lg h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <MailPlus /> Create New Alias
                </CardTitle>
                <CardDescription>
                  Generate unique email aliases to protect your primary inbox. Your preferences from the settings page are pre-selected.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col min-h-0">
                {limitReached ? (
                   <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Active Alias Limit Reached</AlertTitle>
                      <AlertDescription>
                          You have reached your limit of {aliasCounts?.limit} active aliases. To create more, please 
                          <Link href="/aliases" className="font-bold underline"> deactivate or delete</Link> an existing alias.
                      </AlertDescription>
                   </Alert>
                ) : (
                    <Tabs defaultValue="standard" className="h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="standard">Standard Alias</TabsTrigger>
                            <TabsTrigger value="custom">Custom Alias</TabsTrigger>
                        </TabsList>

                        {/* Standard Alias Tab */}
                        <TabsContent value="standard" className="flex-grow">
                            <form onSubmit={handleFormSubmit} className="h-full flex flex-col space-y-4 pt-4">
                                <input type="hidden" name="aliasType" value="standard" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                      <Label htmlFor="primaryEmail">Your Email Address</Label>
                                      {loading ? (
                                          <Skeleton className="h-10 w-full" />
                                      ) : (
                                          <Select name="primaryEmail" value={selectedEmail} onValueChange={setSelectedEmail}>
                                          <SelectTrigger id="primaryEmail">
                                              <SelectValue placeholder="Select an email" />
                                          </SelectTrigger>
                                          <SelectContent>
                                              {formData?.usernames.map(user => (
                                              <SelectItem key={user.id} value={user.username}>
                                                  {user.username}
                                              </SelectItem>
                                              ))}
                                          </SelectContent>
                                          </Select>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Usage Description</Label>
                                        <Input
                                        id="description"
                                        name="description"
                                        placeholder="e.g., 'Social Media Site'"
                                        required
                                        disabled={limitReached || loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="count">Number of Aliases</Label>
                                      {loading ? (
                                        <Skeleton className="h-10 w-full" />
                                      ) : (
                                        <Select name="count" defaultValue={String(formData?.preferences.defaultCount || 1)} disabled={limitReached || loading}>
                                          <SelectTrigger id="count">
                                            <SelectValue placeholder="Select number" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {Array.from({ length: maxToGenerate }, (_, i) => i + 1).map(num => (
                                              <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="length">Random String Length</Label>
                                      {loading ? (
                                          <Skeleton className="h-10 w-full" />
                                      ) : (
                                        <Select name="length" defaultValue={String(formData?.preferences.defaultAliasLength || 12)} disabled={limitReached || loading}>
                                          <SelectTrigger id="length">
                                            <SelectValue placeholder="Select length" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="12">12 characters</SelectItem>
                                            <SelectItem value="16">16 characters</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </div>
                                </div>
                                
                                <div className="mt-auto pt-4">
                                    <SubmitButton disabled={limitReached || loading}>Generate Alias</SubmitButton>
                                </div>
                            </form>
                        </TabsContent>

                        {/* Custom Alias Tab */}
                        <TabsContent value="custom" className="flex-grow">
                             <form onSubmit={handleFormSubmit} className="h-full flex flex-col space-y-4 pt-4">
                                <input type="hidden" name="aliasType" value="custom" />
                                <div className="space-y-2">
                                    <Label htmlFor="customUsername">Username</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <Input name="customUsername" id="customUsername" placeholder="e.g. info, support, newsletter" className="pl-10" required />
                                    </div>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="domain">Domain</Label>
                                     {loading ? (
                                        <Skeleton className="h-10 w-full" />
                                    ) : (
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                            <Select name="domain" required>
                                                <SelectTrigger id="domain" className="pl-10">
                                                    <SelectValue placeholder="Select a domain" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {formData?.domains && formData.domains.length > 0 ? (
                                                        formData.domains.map(domain => (
                                                            <SelectItem key={domain.id} value={domain.domainName}>
                                                                {domain.domainName}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="no-domain" disabled>No custom domains found</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description-custom">Usage Description</Label>
                                    <Input id="description-custom" name="description" placeholder="e.g., 'Company Main Contact'" required />
                                </div>
                                <div className="mt-auto pt-4">
                                    <SubmitButton disabled={limitReached || loading || !formData?.domains || formData.domains.length === 0}>Create Custom Alias</SubmitButton>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1 min-h-[550px]">
            <AliasResultCard 
              aliases={generatedAliases} 
              description={currentDescription}
              onCopyAndSave={handleCopyAndSave}
              onSaveStatus={saveStatus}
            />
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                  <Lightbulb /> Pro Tips
              </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <h4 className="font-semibold text-foreground mb-1">What's an Alias?</h4>
                      <p>An email alias is a unique address that forwards to your main inbox. Use a different alias for every website to keep your primary email safe from spam and data breaches.</p>
                  </div>
                  <div>
                      <h4 className="font-semibold text-foreground mb-1">Security Benefits</h4>
                      <p>If an alias is ever compromised or starts receiving spam, you can simply deactivate or delete it without affecting your primary email or other services. This helps you trace the source of data leaks and keep your main inbox secure.</p>
                  </div>
              </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
