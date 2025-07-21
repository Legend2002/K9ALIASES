
"use client";

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Trash2, Undo2 } from 'lucide-react';

import { DeletedAlias } from '@/types';
import { permanentlyDeleteAlias, restoreAlias } from '../aliases/actions';
import { useToast } from "@/hooks/use-toast";

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

type DeletedAliasTableProps = {
  aliases: DeletedAlias[];
  selectedRowIds: string[];
  onSelectionChange: (ids: string[]) => void;
};

export default function DeletedAliasTable({ aliases = [], selectedRowIds, onSelectionChange }: DeletedAliasTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  const handleRestore = async (id: string) => {
    const result = await restoreAlias({ id });
    if (result.error) {
        toast({
            variant: 'destructive',
            title: 'Restore Failed',
            description: result.error,
        });
    } else {
        toast({
            title: 'Alias Restored!',
            description: result.message,
        });
        onSelectionChange([]); // Clear selection on action
        router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    const result = await permanentlyDeleteAlias({ id });
    if (result.error) {
        toast({
            variant: 'destructive',
            title: 'Delete Failed',
            description: result.error,
        });
    } else {
        toast({
            title: 'Alias Permanently Deleted',
            description: 'The alias has been permanently removed from your account.',
        });
        onSelectionChange([]); // Clear selection on action
        router.refresh();
    }
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    onSelectionChange(checked ? aliases.map(a => a.id) : []);
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    const newSelection = checked 
      ? [...selectedRowIds, id]
      : selectedRowIds.filter(rowId => rowId !== id);
    onSelectionChange(newSelection);
  };

  const isAllSelected = aliases.length > 0 && selectedRowIds.length === aliases.length;
  const isIndeterminate = selectedRowIds.length > 0 && !isAllSelected;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] px-4">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all rows"
                data-state={isIndeterminate ? 'indeterminate' : isAllSelected ? 'checked' : 'unchecked'}
              />
            </TableHead>
            <TableHead className="w-1/3">Alias</TableHead>
            <TableHead>Usage (Description)</TableHead>
            <TableHead className="text-center">Date Deleted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aliases.length > 0 ? (
            aliases.map(alias => (
              <TableRow key={alias.id} className="hover:bg-accent/50" data-state={selectedRowIds.includes(alias.id) ? 'selected' : 'unselected'}>
                <TableCell className="px-4">
                  <Checkbox
                    checked={selectedRowIds.includes(alias.id)}
                    onCheckedChange={(checked) => handleRowSelect(alias.id, !!checked)}
                    aria-label={`Select row ${alias.alias}`}
                  />
                </TableCell>
                <TableCell className="font-medium font-mono">{alias.alias}</TableCell>
                <TableCell>{alias.description}</TableCell>
                <TableCell className="text-center text-muted-foreground">
                   {format(new Date(alias.deletedAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                    <TooltipProvider>
                      <div className="flex justify-end gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleRestore(alias.id)}>
                                    <Undo2 className="h-4 w-4" />
                                    <span className="sr-only">Restore</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Restore Alias</p></TooltipContent>
                        </Tooltip>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete Permanently</span>
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the alias from your history. This action is irreversible and cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(alias.id)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Delete Permanently
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TooltipProvider>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No deleted aliases found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
