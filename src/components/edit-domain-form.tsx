
"use client";

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import type { Domain } from '@/types';

import { updateDomain } from '@/app/(app)/custom-domains/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  );
}

export default function EditDomainForm({ domain }: { domain: Domain }) {
  const [state, formAction] = useActionState(updateDomain, { error: null });
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
        toast({
            title: "Success!",
            description: "Domain has been updated.",
        });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={domain.id} />
      <div className="space-y-2">
        <Label htmlFor="domainName">Domain Name</Label>
        <Input
          id="domainName"
          name="domainName"
          placeholder="example.com"
          defaultValue={domain.domainName}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="e.g., My personal blog"
          defaultValue={domain.description || ''}
        />
      </div>
      <SubmitButton />
    </form>
  );
}
