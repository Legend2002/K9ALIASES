
import { getAliasesForUser } from '../aliases/actions';
import { Alias } from '@/types';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppWindow } from 'lucide-react';
import { format } from 'date-fns';

type GroupedAliases = {
  [key: string]: Alias[];
};

export default async function ApplicationsPage() {
  const { data: aliases, error } = await getAliasesForUser();

  if (error) {
    return (
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const groupedAliases = (aliases || []).reduce((acc, alias) => {
    const key = alias.description || 'Uncategorized';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(alias);
    return acc;
  }, {} as GroupedAliases);

  const applications = Object.keys(groupedAliases).sort();

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AppWindow /> Applications
          </h2>
          <p className="text-muted-foreground">
            A list of all applications you've created aliases for.
          </p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4">
          {applications.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {applications.map(appName => (
                <AccordionItem value={appName} key={appName}>
                  <AccordionTrigger className="text-lg hover:no-underline">
                    <div className="flex items-center gap-4">
                      {appName}
                      <Badge variant="secondary">{groupedAliases[appName].length} alias(es)</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="border rounded-lg overflow-hidden">
                       <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Alias</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Date Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedAliases[appName].map(alias => (
                            <TableRow key={alias.id}>
                              <TableCell className="font-mono">{alias.alias}</TableCell>
                              <TableCell className="text-center">
                                 <Badge variant={alias.isActive ? "secondary" : "outline"} className={alias.isActive ? "border-green-600 bg-green-50 text-green-700" : "border-gray-600 bg-gray-50 text-gray-700"}>
                                    {alias.isActive ? 'Active' : 'Inactive'}
                                 </Badge>
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground">
                                {format(new Date(alias.createdAt), 'MMM d, yyyy')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>You haven't created any aliases yet.</p>
              <p>Once you create aliases with descriptions, they will appear here as applications.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
