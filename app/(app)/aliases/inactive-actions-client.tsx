
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import { activateAllInactiveAliases, deleteAllInactiveAliases } from '../aliases/actions';

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

type InactiveAliasesActionsProps = {
  selectedIds: string[];
  hasAliases: boolean;
  onActionComplete: () => void;
};

export default function InactiveAliasesActions({ 
  selectedIds, 
  hasAliases, 
  onActionComplete 
}: InactiveAliasesActionsProps) {
  const { toast } = useToast();
  const [isActivatePending, setIsActivatePending] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);
  
  const hasSelection = selectedIds.length > 0;
  const actionNoun = hasSelection ? `selected alias${selectedIds.length > 1 ? 'es' : ''}` : 'all inactive aliases';

  const handleActivateAll = async () => {
    setIsActivatePending(true);
    const result = await activateAllInactiveAliases(hasSelection ? selectedIds : undefined);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Activation Failed',
        description: result.error,
      });
    } else {
      toast({
        title: 'Aliases Activated',
        description: result.message,
      });
      onActionComplete();
    }
    setIsActivatePending(false);
  };

  const handleDeleteAll = async () => {
    setIsDeletePending(true);
    const result = await deleteAllInactiveAliases(hasSelection ? selectedIds : undefined);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: result.error,
      });
    } else {
      toast({
        title: 'Inactive Aliases Deleted',
        description: result.message,
      });
      onActionComplete();
    }
    setIsDeletePending(false);
  };

  return (
    <div className="flex items-center space-x-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={!hasAliases || isActivatePending || (hasSelection && selectedIds.length === 0)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {isActivatePending ? "Activating..." : `Activate ${hasSelection ? `Selected (${selectedIds.length})` : 'All'}`}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate {actionNoun}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will activate as many aliases as your active limit allows. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivateAll}>
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={!hasAliases || isDeletePending || (hasSelection && selectedIds.length === 0)}>
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeletePending ? "Deleting..." : `Delete ${hasSelection ? `Selected (${selectedIds.length})` : 'All'}`}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {actionNoun}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will move {actionNoun.toLowerCase()} to the deleted history. You can restore them later. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
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
