
import { Plus, Info, ShieldX } from 'lucide-react';

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

import { getCustomDomainsForUser } from './actions';
import AddDomainForm from '@/components/add-domain-form';
import DomainsTable from '@/components/domains-table';

const DOMAIN_LIMIT = 10;

export default async function CustomDomainsPage() {
  const { data: domains } = await getCustomDomainsForUser();
  const domainCount = domains?.length || 0;
  const limitReached = domainCount >= DOMAIN_LIMIT;

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Domains</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <p>
              A list of all the domains in your account. ({domainCount}/{DOMAIN_LIMIT})
            </p>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="h-4 w-4 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Add your custom domains to create aliases with them.</p>
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
                  <Button style={{backgroundColor: '#17C9C3', color: 'white'}}>
                    <Plus className="mr-2 h-4 w-4" /> Add Domain
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a Custom Domain</DialogTitle>
                    <DialogDescription>
                      Enter the domain you want to add. You will need to configure DNS records to verify ownership.
                    </DialogDescription>
                  </DialogHeader>
                  <AddDomainForm />
                </DialogContent>
              </Dialog>
            )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <DomainsTable domains={domains || []} />
        </CardContent>
      </Card>
    </div>
  );
}
