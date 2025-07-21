
"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, Info, Trash2 } from 'lucide-react';

import type { Username } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { updateUsernameStatus, deleteUsername } from '@/app/(app)/usernames/actions';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import EditUsernameForm from './edit-username-form';

export default function UsernamesTable({ usernames: initialUsernames }: { usernames: Username[] }) {
  const [usernames, setUsernames] = useState(initialUsernames);
  const { toast } = useToast();

  useEffect(() => {
    setUsernames(initialUsernames);
  }, [initialUsernames]);

  const handleStatusChange = async (usernameId: string, currentStatus: boolean) => {
    if (usernameId === 'primary') return;

    const originalUsernames = [...usernames];
    setUsernames(usernames.map(u => u.id === usernameId ? { ...u, isActive: !currentStatus } : u));

    const result = await updateUsernameStatus({ id: usernameId, isActive: !currentStatus });

    if (result?.error) {
      setUsernames(originalUsernames);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
    } else {
      toast({
        title: 'Success!',
        description: 'Username status has been updated.',
      });
    }
  };

  const handleDelete = async (usernameId: string) => {
    if (usernameId === 'primary') return;

    const originalUsernames = [...usernames];
    setUsernames(usernames.filter(u => u.id !== usernameId));

    const result = await deleteUsername({ id: usernameId });

    if (result?.error) {
      setUsernames(originalUsernames);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: result.error,
      });
    } else {
      toast({
        title: 'Username Deleted',
        description: 'The username has been successfully removed.',
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
              Username <ChevronDown className="h-4 w-4" />
            </div>
          </TableHead>
          <TableHead className="hidden md:table-cell">
            <div className="flex items-center gap-1">
              Description <ChevronDown className="h-4 w-4" />
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-1">
              Active <Info className="h-4 w-4" />
            </div>
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {usernames.length > 0 ? (
          usernames.map(user => (
            <TableRow key={user.id} className="hover:bg-accent/50">
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span className="truncate">{user.username}</span>
                  {user.isDefault && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                      Primary
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{user.description || '-'}</TableCell>
              <TableCell>
                <Switch
                  checked={user.isActive}
                  onCheckedChange={() => handleStatusChange(user.id, user.isActive)}
                  disabled={user.isDefault}
                  aria-label="Toggle username status"
                />
              </TableCell>
              <TableCell className="text-right">
                {user.isDefault ? (
                  <span className="text-sm text-muted-foreground italic">No actions</span>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-primary">Edit</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Username</DialogTitle>
                          <DialogDescription>
                            Update the description for your custom username.
                          </DialogDescription>
                        </DialogHeader>
                        <EditUsernameForm username={user} />
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
                            This action cannot be undone. This will permanently delete this username.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(user.id)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              No usernames found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
