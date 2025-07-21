
"use client";

import Link from "next/link";
import { AtSign, CheckCircle, AppWindow, Globe, Users, XCircle, Trash2, Send, Ban, Reply, ArrowRight, MailPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  total?: string;
  icon: LucideIcon;
  actionText?: string;
  href?: string;
  highlight?: boolean;
};

function StatCard({ title, value, total, icon: Icon, actionText, href, highlight = false }: StatCardProps) {
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
          <div className="h-12">
            <p className="text-sm text-muted-foreground whitespace-normal">{title}</p>
            <p className="text-xl md:text-2xl font-bold">
              {value}
              {total && <span className="text-sm font-normal text-muted-foreground"> / {total}</span>}
            </p>
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

  if (href && !actionText) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}

export default function AliasPage() {
  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Custom Domains" value="0" total="10" icon={AtSign} actionText="View all" href="/custom-domains" />
        <StatCard title="Applications" value="1" total="1" icon={AppWindow} actionText="View all" href="#" />
        <StatCard title="Usernames" value="1" total="1" icon={Users} actionText="View all" href="#" />
        <StatCard title="Domains Supported" value="0" icon={Globe} actionText="View all" href="#" />
        <StatCard title="Create Aliases" value="&nbsp;" icon={MailPlus} actionText="Create new" href="/create-alias" highlight />
      </div>

      <div className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Aliases Created</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Progress value={5} aria-label="Aliases created" />
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0</span>
                    <span>30</span>
                </div>
            </CardContent>
        </Card>

        <div>
          <h3 className="text-xl font-bold tracking-tight mb-4">Aliases</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Aliases" value="0" icon={AtSign} actionText="View All" href="#" />
            <StatCard title="Active" value="0" icon={CheckCircle} actionText="View Active" href="#" />
            <StatCard title="Inactive" value="0" icon={XCircle} actionText="View Inactive" href="#" />
            <StatCard title="Deleted" value="0" icon={Trash2} actionText="View Deleted" href="#" />
          </div>
        </div>
      </div>
    </div>
  );
}
