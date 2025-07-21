
"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, Info, Trash2 } from 'lucide-react';
import type { Domain } from '@/types';
import { updateDomainStatus, deleteDomain } from '@/app/(app)/custom-domains/actions';

import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import EditDomainForm from './edit-domain-form';


export default function DomainsTable({ domains: initialDomains }: { domains: Domain[] }) {
  const [domains, setDomains] = useState(initialDomains);
  const { toast } = useToast();

  useEffect(() => {
    setDomains(initialDomains);
  }, [initialDomains]);

  const handleStatusChange = async (domainId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    // Optimistic UI update
    const originalDomains = [...domains];
    setDomains(domains.map(d => d.id === domainId ? { ...d, isActive: newStatus } : d));

    // Call server action
    const result = await updateDomainStatus({ id: domainId, isActive: newStatus });

    // Handle server response
    if (result?.error) {
      // Revert UI change on error
      setDomains(originalDomains);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
    } else {
      // Confirm success with a toast
      toast({
        title: 'Success!',
        description: `K9 Reached the Data Center with your Changes`,
      });
    }
  };

  const handleDelete = async (domainId: string) => {
    const originalDomains = [...domains];
    // Optimistic UI update
    setDomains(domains.filter(d => d.id !== domainId));

    const result = await deleteDomain({ id: domainId });

    if (result?.error) {
      setDomains(originalDomains);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: result.error,
      });
    } else {
      toast({
        title: 'Domain Deleted',
        description: 'The domain has been successfully removed.',
      });
    }
  };


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px] hidden sm:table-cell">
            <div className="flex items-center gap-1">
              Created <ChevronDown className="h-4 w-4" />
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-1">
              Domain <ChevronDown className="h-4 w-4" />
            </div>
          </TableHead>
          <TableHead className="hidden md:table-cell">
            <div className="flex items-center gap-1">
              Description <ChevronDown className="h-4 w-4" />
            </div>
          </TableHead>
          <TableHead>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    Active <Info className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Activate or deactivate this domain.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {domains.length > 0 ? (
          domains.map(domain => (
            <TableRow key={domain.id} className="hover:bg-accent/50">
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {formatDistanceToNow(new Date(domain.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell className="font-medium">
                {domain.domainName}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {domain.description || '-'}
              </TableCell>
              <TableCell>
                 <Switch
                    checked={domain.isActive}
                    onCheckedChange={() => handleStatusChange(domain.id, domain.isActive)}
                    aria-label="Toggle domain status"
                 />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link" className="p-0 h-auto" style={{color: '#17C9C3'}}>
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Domain</DialogTitle>
                        <DialogDescription>
                          Update the details for your custom domain.
                        </DialogDescription>
                      </DialogHeader>
                      <EditDomainForm domain={domain} />
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your domain
                          and all associated aliases.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(domain.id)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              No custom domains added yet. Click "Add Domain" to get started.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
