
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAliasesForUser, getDeletedAliasesForUser } from './actions';
import AliasTable from './alias-table';
import NonInteractiveDeletedAliasTable from '../deleted-aliases/non-interactive-deleted-alias-table';
import ActiveAliasesActions from './active-actions-client';
import InactiveAliasesActions from './inactive-actions-client';
import { Alias, DeletedAlias } from '@/types';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, History, CheckCircle, XCircle } from 'lucide-react';

export default function MyAliasesPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') as 'active' | 'inactive' | null;

  const [allAliases, setAllAliases] = useState<Alias[]>([]);
  const [deletedAliases, setDeletedAliases] = useState<DeletedAlias[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [aliasesResult, deletedResult] = await Promise.all([
      getAliasesForUser(),
      getDeletedAliasesForUser()
    ]);
    
    if (aliasesResult.error || deletedResult.error) {
      setError(aliasesResult.error || deletedResult.error || 'An unknown error occurred');
    } else {
      setAllAliases(aliasesResult.data || []);
      setDeletedAliases(deletedResult.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAliases = useMemo(() => {
    let aliases = allAliases;
    
    if (filter === 'active') {
      aliases = aliases.filter(a => a.isActive);
    } else if (filter === 'inactive') {
      aliases = aliases.filter(a => !a.isActive);
    }
    
    return aliases;
  }, [allAliases, filter]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedRowIds([]);
  }, [filter]);

  const handleSelectionChange = (ids: string[]) => {
    setSelectedRowIds(ids);
  };
  
  const handleActionComplete = () => {
    setSelectedRowIds([]);
    fetchData(); // Re-fetch data to update the table
  };

  const pageConfig = useMemo(() => {
    if (filter === 'active') {
      return {
        title: "Active Aliases",
        description: "All your currently active aliases.",
        Icon: CheckCircle,
        showActions: true,
      };
    }
    if (filter === 'inactive') {
      return {
        title: "Inactive Aliases",
        description: "Aliases that are currently disabled.",
        Icon: XCircle,
        showActions: true,
      };
    }
    return {
      title: "Total Aliases",
      description: "A complete history of all your aliases.",
      Icon: Mail,
      showActions: false,
    };
  }, [filter]);

  const showDeletedSection = !filter && !loading;

  if (loading) {
    return (
       <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
         <div className="flex items-center justify-between space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-48" />
         </div>
         <Card>
            <CardContent className="p-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </CardContent>
         </Card>
       </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <pageConfig.Icon /> {pageConfig.title}
          </h2>
          <p className="text-muted-foreground">
            {pageConfig.description}
          </p>
        </div>
        {pageConfig.showActions && filter === 'active' && (
          <ActiveAliasesActions 
            selectedIds={selectedRowIds} 
            hasAliases={filteredAliases.length > 0} 
            onActionComplete={handleActionComplete} 
          />
        )}
        {pageConfig.showActions && filter === 'inactive' && (
          <InactiveAliasesActions 
            selectedIds={selectedRowIds} 
            hasAliases={filteredAliases.length > 0}
            onActionComplete={handleActionComplete} 
          />
        )}
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Aliases</CardTitle>
            <CardDescription>
              {filter ? `A list of your ${filter} aliases.` : 'A list of all your active and inactive aliases.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <AliasTable 
               aliases={filteredAliases} 
               filter={filter}
               selectedRowIds={selectedRowIds}
               onSelectionChange={handleSelectionChange}
               onActionComplete={handleActionComplete}
             />
          </CardContent>
        </Card>
        
        {showDeletedSection && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Deleted History</CardTitle>
              <CardDescription>A record of aliases you have previously deleted. Manage them on the <a href="/deleted-aliases" className="underline">Deleted Aliases page</a>.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
               <NonInteractiveDeletedAliasTable aliases={deletedAliases || []} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
