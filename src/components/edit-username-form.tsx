
"use client";

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import type { Username } from '@/types';

import { updateUsername } from '@/app/(app)/usernames/actions';
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

export default function EditUsernameForm({ username }: { username: Username }) {
  const [state, formAction] = useActionState(updateUsername, { error: null });
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
            description: "Username has been updated.",
        });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={username.id} />
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          defaultValue={username.username}
          disabled // Username itself cannot be changed
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="e.g., For work emails"
          defaultValue={username.description || ''}
        />
      </div>
      <SubmitButton />
    </form>
  );
}
