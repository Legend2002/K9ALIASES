
"use client";

import { useState, useEffect, useTransition, useRef } from 'react';
import Link from 'next/link';
import { Search, Loader2, AppWindow } from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce';
import { searchAliases } from '@/app/(app)/aliases/actions';
import { Alias } from '@/types';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from './ui/input';

function SearchResults({ query, onLinkClick }: { query: string; onLinkClick: () => void }) {
  const [results, setResults] = useState<Alias[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (query.length >= 3) {
      startTransition(async () => {
        const { data } = await searchAliases(query);
        setResults(data || []);
      });
    } else {
      setResults([]);
    }
  }, [query]);

  if (query.length < 3) {
    return null;
  }

  return (
    <div className="p-2">
      {isPending && (
         <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
         </div>
      )}
      {!isPending && results.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">No results found.</p>
      )}
      {!isPending && results.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">ALIASES</p>
          {results.map(alias => (
             <Link href="/applications" key={alias.id} onClick={onLinkClick}>
                <div className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent">
                    <div className="p-2 bg-muted rounded-md">
                       <AppWindow className="h-4 w-4" />
                    </div>
                    <div>
                       <p className="font-medium">{alias.description}</p>
                       <p className="text-xs text-muted-foreground">{alias.alias}</p>
                    </div>
                </div>
             </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLinkClick = () => {
    setQuery('');
    setIsOpen(false);
  };
  
  return (
    <div ref={triggerRef} className="relative w-full max-w-sm">
        <Popover open={isOpen && debouncedQuery.length >= 3} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search aliases by app or name..."
                        className="w-full pl-10"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setIsOpen(e.target.value.length >= 3);
                        }}
                        onFocus={() => {
                            if (query.length >= 3) setIsOpen(true);
                        }}
                    />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <SearchResults query={debouncedQuery} onLinkClick={handleLinkClick} />
            </PopoverContent>
        </Popover>
    </div>
  );
}
