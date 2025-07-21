
"use client";

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';

import { addDomain } from '@/app/(app)/custom-domains/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Adding..." : "Add Domain"}
    </Button>
  );
}

export default function AddDomainForm() {
  const [state, formAction] = useActionState(addDomain, { error: null });
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.error,
      });
    }
    if (state.data === null && !state.error) {
        // This indicates a successful submission with no data returned
        toast({
            title: "Success!",
            description: "Domain has been added.",
        });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="domainName">Domain Name</Label>
        <Input
          id="domainName"
          name="domainName"
          placeholder="example.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="e.g., My personal blog"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
