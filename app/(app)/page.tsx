
import { getCustomDomainsForUser } from './custom-domains/actions';
import { getAliasesCountForUser, getAliasesForUser } from './aliases/actions';
import { getUsernamesForUser } from './usernames/actions';
import DashboardClient from '@/components/dashboard-client';

export default async function AliasPage() {
  const domainsData = await getCustomDomainsForUser();
  const aliasCountsData = await getAliasesCountForUser();
  const allAliasesData = await getAliasesForUser();
  const usernamesData = await getUsernamesForUser();

  const domainCount = domainsData.data?.length || 0;
  const aliasCounts = aliasCountsData.data;
  const allAliases = allAliasesData.data || [];
  const applicationCount = new Set(allAliases.map(a => a.description)).size;
  // The total count includes the primary email (1) plus any custom usernames.
  const usernameCount = 1 + (usernamesData.data?.length || 0);

  return (
    <DashboardClient
      domainCount={domainCount}
      aliasCounts={aliasCounts}
      applicationCount={applicationCount}
      usernameCount={usernameCount}
      allAliases={allAliases}
    />
  );
}
