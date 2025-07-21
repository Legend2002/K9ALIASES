
"use client";

import { useState } from 'react';
import { Trash2, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import { deactivateAllActiveAliases, deleteAllActiveAliases } from '../aliases/actions';

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

type ActiveAliasesActionsProps = {
  selectedIds: string[];
  hasAliases: boolean;
  onActionComplete: () => void;
};

export default function ActiveAliasesActions({ 
  selectedIds, 
  hasAliases, 
  onActionComplete 
}: ActiveAliasesActionsProps) {
  const { toast } = useToast();
  const [isDeactivatePending, setIsDeactivatePending] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);
  
  const hasSelection = selectedIds.length > 0;
  const actionNoun = hasSelection ? `selected alias${selectedIds.length > 1 ? 'es' : ''}` : 'all active aliases';

  const handleDeactivate = async () => {
    setIsDeactivatePending(true);
    const result = await deactivateAllActiveAliases(hasSelection ? selectedIds : undefined);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Deactivation Failed',
        description: result.error,
      });
    } else {
      toast({
        title: 'Aliases Deactivated',
        description: result.message,
      });
      onActionComplete();
    }
    setIsDeactivatePending(false);
  };

  const handleDelete = async () => {
    setIsDeletePending(true);
    const result = await deleteAllActiveAliases(hasSelection ? selectedIds : undefined);
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: result.error,
      });
    } else {
      toast({
        title: 'Active Aliases Deleted',
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
          <Button variant="outline" disabled={!hasAliases || isDeactivatePending || (hasSelection && selectedIds.length === 0)}>
            <XCircle className="mr-2 h-4 w-4" />
            {isDeactivatePending ? "Deactivating..." : `Deactivate ${hasSelection ? `Selected (${selectedIds.length})` : 'All'}`}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {actionNoun}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make {actionNoun.toLowerCase()} inactive. You can reactivate them later. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate}>
              Deactivate
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
              This action will move {actionNoun.toLowerCase()} to the deleted history. You can restore them later. This cannot be undone.
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
