
"use client";

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';

import { addUsername } from '@/app/(app)/usernames/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Adding..." : "Add Username"}
    </Button>
  );
}

export default function AddUsernameForm() {
  const [state, formAction] = useActionState(addUsername, { error: null });
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
            description: "Username has been added.",
        });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username (Email)</Label>
        <Input
          id="username"
          name="username"
          type="email"
          placeholder="another@example.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="e.g., For work emails"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
