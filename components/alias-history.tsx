
"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Copy, Trash2, History, AlertCircle } from 'lucide-react';
import Link from 'next/link';

import type { Alias } from '@/types';
import { useToast } from "@/hooks/use-toast";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AliasHistory() {
  const [aliases, setAliases] = useState<Alias[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedAliases = localStorage.getItem("k9-aliases");
      if (storedAliases) {
        setAliases(JSON.parse(storedAliases));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("k9-aliases", JSON.stringify(aliases));
    } catch (error) {
      console.error("Failed to save aliases to localStorage", error);
    }
  }, [aliases]);

  const handleCopyFromHistory = (alias: string) => {
    navigator.clipboard.writeText(alias);
    toast({
      title: 'Copied to Clipboard!',
      description: `Alias ${alias} is ready to use.`,
    });
  };

  const handleDelete = (id: string) => {
    setAliases(aliases => aliases.filter(a => a.id !== id));
    toast({
      title: 'Alias Deleted',
      description: 'The alias has been removed from your history.',
    });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <main className="w-full max-w-4xl space-y-8 mt-4">
         <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Legacy Aliases</AlertTitle>
            <AlertDescription>
                This is a temporary view of aliases saved in your browser. They are not synced with your account. Please save new aliases from the 'Create Alias' page to your account.
                This page will be removed soon. You can view your account aliases on the <Link href="/aliases" className="font-bold underline">My Aliases</Link> page.
            </AlertDescription>
         </Alert>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <History /> Local Alias History
            </CardTitle>
            <CardDescription>
              Here are all your locally saved aliases. This is a temporary list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Alias</TableHead>
                    <TableHead>Usage (Your Description)</TableHead>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aliases.length > 0 ? (
                    aliases.map(alias => (
                      <TableRow key={alias.id} className="hover:bg-accent/50">
                        <TableCell className="font-medium font-mono">{alias.alias}</TableCell>
                        <TableCell>{alias.description}</TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {format(new Date(alias.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleCopyFromHistory(alias.alias)}>
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">Copy</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Copy Alias</p></TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleDelete(alias.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete Alias</p></TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No local aliases found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
