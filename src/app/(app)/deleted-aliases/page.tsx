
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getDeletedAliasesForUser } from '../aliases/actions';
import DeletedAliasTable from './deleted-alias-table';
import DeletedAliasesActions from './actions-client';
import { DeletedAlias } from '@/types';

import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DeletedAliasesPage() {
  const [aliases, setAliases] = useState<DeletedAlias[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getDeletedAliasesForUser();
    if (error) {
      setError(error);
    } else {
      setAliases(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectionChange = (ids: string[]) => {
    setSelectedRowIds(ids);
  };

  const handleActionComplete = () => {
    setSelectedRowIds([]);
    // Re-fetch data to update the table
    fetchData();
  };

  if (loading) {
     return (
       <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
         <div className="flex items-center justify-between space-y-2">
            <Skeleton className="h-10 w-64" />
            <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
            </div>
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
    )
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Trash2 /> Deleted Aliases</h2>
          <p className="text-muted-foreground">
            A history of your deleted aliases. Select aliases to restore or permanently delete them.
          </p>
        </div>
        <DeletedAliasesActions 
          selectedIds={selectedRowIds} 
          hasAliases={aliases.length > 0}
          onActionComplete={handleActionComplete}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <DeletedAliasTable 
            aliases={aliases || []} 
            selectedRowIds={selectedRowIds}
            onSelectionChange={handleSelectionChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
