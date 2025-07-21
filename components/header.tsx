
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ExternalLink, LifeBuoy, LogOut, Settings, User, CreditCard } from 'lucide-react';

import { logout } from '@/app/(auth)/actions';
import { usePrimaryEmail } from '@/context/app-context';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SearchBar from './search-bar';

export default function Header() {
  const { primaryEmail } = usePrimaryEmail();
  const displayName = primaryEmail.displayName || 'My Account';
  const email = primaryEmail.email || 'No email set';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/k9-logo.png"
            alt="K9-ALI@SES Logo"
            width={40}
            height={40}
            data-ai-hint="paw heart"
          />
          <span className="hidden sm:inline-block text-2xl font-bold uppercase text-primary tracking-wider font-heading">K9-ALI@SES</span>
        </Link>

        <div className="flex-1 flex justify-start mx-4 sm:mx-6">
          <SearchBar />
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" asChild size="icon">
                  <Link href="/aliases" className="flex items-center gap-2">
                    <Image src="/saved-mails-icon.png" alt="My Aliases" width={24} height={24} />
                    <span className="sr-only">My Aliases</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>My Aliases</p>
              </TooltipContent>
            </Tooltip>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex items-center gap-2">
                   <Image src="/user-avatar.png" alt="Profile" width={24} height={24} />
                   <span className="sr-only">Profile</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/billing">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Billing</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                     <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                  <Link href="/support">
                    <LifeBuoy className="mr-2 h-4 w-4" />
                    <span>Support</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem disabled>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>API</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={logout}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
