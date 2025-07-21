
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Undo2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import { permanentlyDeleteAllAliases, restoreAllDeletedAliases } from '../aliases/actions';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type DeletedAliasesActionsProps = {
  selectedIds: string[];
  hasAliases: boolean;
  onActionComplete: () => void;
};

export default function DeletedAliasesActions({ selectedIds, hasAliases, onActionComplete }: DeletedAliasesActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isRestorePending, setIsRestorePending] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);
  
  const hasSelection = selectedIds.length > 0;
  const actionNoun = hasSelection ? `selected alias${selectedIds.length > 1 ? 'es' : ''}` : 'all aliases';

  const handleRestore = async () => {
    setIsRestorePending(true);
    const result = await restoreAllDeletedAliases(hasSelection ? selectedIds : undefined);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Restore Failed',
        description: result.error,
      });
    } else {
      toast({
        title: 'Aliases Restored',
        description: result.message,
      });
      onActionComplete();
      router.refresh(); // Keep this to ensure other parts of the app, like dashboard stats, update
    }
    setIsRestorePending(false);
  };

  const handleDelete = async () => {
    setIsDeletePending(true);
    const result = await permanentlyDeleteAllAliases(hasSelection ? selectedIds : undefined);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: result.error,
      });
    } else {
      toast({
        title: `Aliases Deleted`,
        description: result.message,
      });
      onActionComplete();
      router.refresh(); // Keep this to ensure other parts of the app update
    }
    setIsDeletePending(false);
  };

  return (
    <div className="flex items-center space-x-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={!hasAliases || isRestorePending}>
            <Undo2 className="mr-2 h-4 w-4" />
            {isRestorePending ? "Restoring..." : `Restore ${hasSelection ? `Selected (${selectedIds.length})` : 'All'}`}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore {actionNoun}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore {actionNoun.toLowerCase()}? They will be restored as inactive to avoid exceeding your active alias limit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={!hasAliases || isDeletePending}>
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeletePending ? "Deleting..." : `Delete ${hasSelection ? `Selected (${selectedIds.length})` : 'All'}`}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete {actionNoun}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible and cannot be undone. Are you sure you want to permanently remove {actionNoun.toLowerCase()}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
