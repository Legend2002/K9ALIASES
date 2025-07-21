
import { Plus, Info, ShieldX } from 'lucide-react';
import { getLoggedInUserEmail } from '@/app/(auth)/actions';
import { getUsernamesForUser } from './actions';
import type { Username } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UsernamesTable from '@/components/usernames-table';
import AddUsernameForm from '@/components/add-username-form';

const USERNAME_LIMIT = 2; // Limit for *custom* usernames

export default async function UsernamesPage() {
  const primaryEmail = await getLoggedInUserEmail();
  const { data: customUsernames } = await getUsernamesForUser();

  const allUsernames: Username[] = [];
  if (primaryEmail) {
    allUsernames.push({
      id: 'primary',
      username: primaryEmail,
      isDefault: true,
      description: 'Primary Account Email',
      isActive: true,
      createdAt: new Date().toISOString(), // This is not stored, so we fake it
    });
  }
  if (customUsernames) {
    allUsernames.push(...customUsernames);
  }

  const limitReached = (customUsernames?.length || 0) >= USERNAME_LIMIT;
  const usernameCount = customUsernames?.length || 0;

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usernames</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <p>
              A list of all the usernames in your account. You can add up to {USERNAME_LIMIT} custom usernames. ({usernameCount}/{USERNAME_LIMIT})
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Usernames are email addresses you can use to generate aliases.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {limitReached ? (
            <Button disabled>
              <ShieldX className="mr-2 h-4 w-4" />
              Limit Reached
            </Button>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Username
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a Custom Username</DialogTitle>
                  <DialogDescription>
                    Enter the email address you want to add as a username.
                  </DialogDescription>
                </DialogHeader>
                <AddUsernameForm />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <UsernamesTable usernames={allUsernames} />
        </CardContent>
      </Card>
    </div>
  );
}
