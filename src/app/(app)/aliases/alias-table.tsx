
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Copy, Trash2, Check, X } from 'lucide-react';

import type { Alias } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { updateAliasStatus, deleteAlias } from './actions';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

type AliasTableProps = {
  aliases: Alias[];
  filter: 'active' | 'inactive' | null;
  selectedRowIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onActionComplete: () => void;
};

export default function AliasTable({ 
  aliases: initialAliases, 
  filter, 
  selectedRowIds, 
  onSelectionChange,
  onActionComplete
}: AliasTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [aliases, setAliases] = useState(initialAliases);

  useEffect(() => {
    setAliases(initialAliases);
  }, [initialAliases]);

  const showCheckboxes = filter === 'active' || filter === 'inactive';

  const handleCopy = (alias: string) => {
    navigator.clipboard.writeText(alias);
    toast({
      title: "Copied to Clipboard!",
      description: `Alias ${alias} is ready to use.`,
    });
  };

  const handleStatusChange = async (id: string, currentStatus: boolean) => {
    const originalAliases = [...aliases];
    
    // Optimistic UI update
    const updatedAliases = aliases.map(a => 
      a.id === id ? { ...a, isActive: !currentStatus } : a
    );
    setAliases(updatedAliases);

    const result = await updateAliasStatus({ id, isActive: !currentStatus });

    if (result.error) {
      // Revert on error
      setAliases(originalAliases);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
    } else {
      toast({
        title: 'Status Updated!',
        description: `Alias has been ${!currentStatus ? 'activated' : 'deactivated'}.`,
      });
      // No router.refresh() needed, which allows the animation to complete.
      // We can optionally re-fetch data in the parent component if needed.
      onActionComplete();
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteAlias({ id });
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: result.error,
      });
    } else {
      toast({
        title: 'Alias Deleted',
        description: 'The alias has been moved to your deleted history.',
      });
      onActionComplete();
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
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {showCheckboxes && (
                <TableHead className="w-[50px] px-4">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                    data-state={isIndeterminate ? 'indeterminate' : isAllSelected ? 'checked' : 'unchecked'}
                  />
                </TableHead>
              )}
              <TableHead className="w-1/3">Alias</TableHead>
              <TableHead>Usage (Description)</TableHead>
              <TableHead className="text-center">Date Created</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aliases.length > 0 ? (
              aliases.map(alias => (
                <TableRow key={alias.id} className="hover:bg-accent/50" data-state={selectedRowIds.includes(alias.id) ? 'selected' : 'unselected'}>
                  {showCheckboxes && (
                     <TableCell className="px-4">
                       <Checkbox
                         checked={selectedRowIds.includes(alias.id)}
                         onCheckedChange={(checked) => handleRowSelect(alias.id, !!checked)}
                         aria-label={`Select row ${alias.alias}`}
                       />
                     </TableCell>
                  )}
                  <TableCell className="font-medium font-mono">{alias.alias}</TableCell>
                  <TableCell>{alias.description}</TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {format(new Date(alias.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                          <Switch
                              checked={alias.isActive}
                              onCheckedChange={() => handleStatusChange(alias.id, alias.isActive)}
                              aria-label="Toggle alias status"
                          />
                          <Badge variant={alias.isActive ? "secondary" : "outline"} className={alias.isActive ? "border-green-600 bg-green-50 text-green-700" : "border-gray-600 bg-gray-50 text-gray-700"}>
                              {alias.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                      </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <div className="flex justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(alias.alias)}>
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">Copy</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Copy Alias</p></TooltipContent>
                        </Tooltip>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will move the alias to your deleted history. You can restore it from there later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(alias.id)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Yes, Delete
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
                <TableCell colSpan={showCheckboxes ? 6 : 5} className="h-24 text-center">
                  No aliases match your current filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
