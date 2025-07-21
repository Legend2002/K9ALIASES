
"use client";

import { format } from 'date-fns';
import { Trash2, Undo2 } from 'lucide-react';

import { DeletedAlias } from '@/types';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export default function NonInteractiveDeletedAliasTable({ aliases = [] }: { aliases: DeletedAlias[] }) {
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Alias</TableHead>
            <TableHead>Usage (Description)</TableHead>
            <TableHead className="text-center">Date Deleted</TableHead>
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
                   {format(new Date(alias.deletedAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                    <TooltipProvider>
                      <div className="flex justify-end gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" disabled>
                                    <Undo2 className="h-4 w-4" />
                                    <span className="sr-only">Restore</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Restore Alias</p></TooltipContent>
                        </Tooltip>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete Permanently</span>
                        </Button>
                      </div>
                    </TooltipProvider>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No deleted aliases found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
