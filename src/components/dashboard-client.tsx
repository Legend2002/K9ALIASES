
"use client";

import Link from "next/link";
import { AtSign, CheckCircle, AppWindow, Globe, Users, XCircle, Trash2, MailPlus, Info, Copy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format, formatDistanceToNow } from 'date-fns';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import AliasUsageChart from "@/components/alias-usage-chart";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alias } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";


type StatCardProps = {
  title: string;
  value: string;
  total?: string;
  icon: LucideIcon;
  actionText?: string;
  href?: string;
  highlight?: boolean;
  tooltip?: string;
};

function StatCard({ title, value, total, icon: Icon, actionText, href, highlight = false, tooltip }: StatCardProps) {
  const cardContent = (
    <Card className="shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <CardContent className="p-4 flex items-start gap-4 flex-grow">
        <div className={cn(
          "p-3 rounded-lg flex-shrink-0",
          "bg-primary"
        )}>
          <Icon className={cn(
             "text-primary-foreground h-6 w-6"
          )} />
        </div>
        <div className="flex-grow min-w-0 flex flex-col justify-between">
          <div className="h-12 flex items-center">
             <div>
                <p className="text-sm text-muted-foreground whitespace-normal">{title}</p>
                <p className="text-xl md:text-2xl font-bold">
                  {value}
                  {total && <span className="text-sm font-normal text-muted-foreground"> / {total}</span>}
                </p>
             </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className={cn("pt-0 mt-auto px-4 pb-3", !highlight && "border-t bg-muted")}>
          {actionText ? (
             highlight ? (
              <Button asChild size="sm" className="relative h-auto mt-3 text-sm group px-3 py-1 overflow-hidden">
                <Link href={href || "#"}>
                   <span className="transition-opacity duration-200 group-hover:opacity-0">{actionText}</span>
                   <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100">+</span>
                </Link>
              </Button>
            ) : (
              <Button asChild variant="link" className="text-primary p-0 h-auto mt-3 text-sm hover:no-underline">
                <Link href={href || "#"}>{actionText}</Link>
              </Button>
            )
          ) : (
            <div className="h-auto mt-3 text-sm p-0">&nbsp;</div>
          )}
        </CardFooter>
    </Card>
  );

  const finalCard = (
     <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                {href && !actionText ? <Link href={href}>{cardContent}</Link> : cardContent}
            </TooltipTrigger>
            {tooltip && (
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            )}
        </Tooltip>
     </TooltipProvider>
  );

  return finalCard;
}

type DashboardClientProps = {
    domainCount: number;
    aliasCounts: {
        total: number;
        active: number;
        inactive: number;
        deleted: number;
        limit: number;
    } | null;
    applicationCount: number;
    usernameCount: number;
    allAliases: Alias[];
};

// The limit is 1 primary + 2 custom usernames.
const USERNAME_LIMIT = 3;

export default function DashboardClient({ domainCount, aliasCounts, applicationCount, usernameCount, allAliases }: DashboardClientProps) {
  const { toast } = useToast();
  const totalAliases = aliasCounts?.total || 0;
  const activeAliases = aliasCounts?.active || 0;
  const inactiveAliases = aliasCounts?.inactive || 0;
  const deletedAliases = aliasCounts?.deleted || 0;
  const aliasLimit = aliasCounts?.limit || 30;

  const aliasProgress = (activeAliases / aliasLimit) * 100;
  const recentAliases = [...allAliases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const handleCopy = (alias: string) => {
    navigator.clipboard.writeText(alias);
    toast({
      title: "Copied to Clipboard!",
      description: `Alias ${alias} is ready to use.`,
    });
  };

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Custom Domains" value={String(domainCount)} total="10" icon={AtSign} actionText="View all" href="/custom-domains" />
        <StatCard title="Applications" value={String(applicationCount)} icon={AppWindow} actionText="View all" href="/applications" />
        <StatCard title="Usernames" value={String(usernameCount)} total={String(USERNAME_LIMIT)} icon={Users} actionText="View all" href="/usernames" />
        <StatCard title="Domains Supported" value="4" icon={Globe} actionText="View all" href="/supported-domains" />
        <StatCard title="Create Aliases" value="&nbsp;" icon={MailPlus} actionText="Create new" href="/create-alias" highlight />
      </div>

      <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Active Aliases</CardTitle>
                <CardDescription>You can have up to {aliasLimit} active aliases.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Progress value={aliasProgress} aria-label={`${activeAliases} of ${aliasLimit} aliases created`} />
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{activeAliases} of {aliasLimit} used</span>
                </div>
            </CardContent>
        </Card>

        <div>
          <h3 className="text-xl font-bold tracking-tight mb-4">Aliases</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Aliases" value={String(totalAliases)} icon={AtSign} actionText="View All" href="/aliases" />
            <StatCard title="Active" value={String(activeAliases)} icon={CheckCircle} actionText="View Active" href="/aliases?filter=active" />
            <StatCard title="Inactive" value={String(inactiveAliases)} icon={XCircle} actionText="View Inactive" href="/aliases?filter=inactive" />
            <StatCard title="Deleted" value={String(deletedAliases)} icon={Trash2} actionText="View Deleted" href="/deleted-aliases" />
          </div>
        </div>

        <div>
            <h3 className="text-xl font-bold tracking-tight mb-4">Alias Creation Last 7 Days</h3>
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardContent className="pt-6">
                        <AliasUsageChart aliases={allAliases} />
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Aliases</CardTitle>
                        <CardDescription>Your 5 most recently created aliases.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {recentAliases.length > 0 ? (
                        <div className="space-y-4">
                            {recentAliases.map(alias => (
                                <div key={alias.id} className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" title={alias.alias}>{alias.alias}</p>
                                        <p className="text-sm text-muted-foreground truncate" title={alias.description}>{alias.description}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(alias.createdAt), { addSuffix: true })}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={alias.isActive ? "secondary" : "outline"} className={cn(alias.isActive ? "border-green-600 bg-green-50 text-green-700" : "border-gray-600 bg-gray-50 text-gray-700", "hidden sm:inline-flex")}>
                                            {alias.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Button variant="ghost" size="icon" onClick={() => handleCopy(alias.alias)}>
                                            <Copy className="h-4 w-4" />
                                            <span className="sr-only">Copy</span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                       ) : (
                         <div className="flex items-center justify-center h-full text-muted-foreground text-center p-8">
                            <p>You haven&apos;t created any aliases yet. <br/> <Link href="/create-alias" className="underline font-medium text-primary">Create one now!</Link></p>
                         </div>
                       )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
