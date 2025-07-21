
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

const supportedDomains = [
  {
    name: 'Gmail',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg',
    hint: 'gmail logo',
  },
  {
    name: 'Proton Mail',
    logoUrl: 'https://imagizer.imageshack.com/img922/4082/FiJIvU.png',
    hint: 'protonmail logo',
  },
  {
    name: 'Yahoo Mail',
    logoUrl: 'https://imagizer.imageshack.com/img922/5241/PgVZAm.png',
    hint: 'yahoo logo',
  },
  {
    name: 'Outlook',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg',
    hint: 'outlook logo',
  },
];

export default function SupportedDomainsPage() {
  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe /> Supported Domains
          </h2>
          <p className="text-muted-foreground">
            We currently support creating aliases for users with the following email providers.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {supportedDomains.map((domain) => (
          <Card key={domain.name} className="shadow-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
              <div className="relative h-20 w-20">
                 <Image
                    src={domain.logoUrl}
                    alt={`${domain.name} logo`}
                    fill
                    sizes="80px"
                    className="object-contain"
                    data-ai-hint={domain.hint}
                 />
              </div>
              <p className="text-lg font-semibold">{domain.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
