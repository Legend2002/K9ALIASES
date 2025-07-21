
import { Check, CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'For individuals starting out with email aliases.',
    features: [
      '30 Active Aliases',
      '2 Custom Usernames',
      '10 Custom Domains',
      'Standard Support',
    ],
    buttonText: 'Your Current Plan',
    buttonVariant: 'outline',
    isCurrent: true,
  },
  {
    name: 'Pro',
    price: '$10',
    description: 'For power users who need more aliases and features.',
    features: [
      '100 Active Aliases',
      '5 Custom Usernames',
      '25 Custom Domains',
      'Priority Support',
      'Use K9-ALI@SES domains',
      'Daily Data Backups',
    ],
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'default',
    isCurrent: false,
    highlight: true,
  },
  {
    name: 'Business',
    price: 'Contact Us',
    description: 'For teams and businesses that need advanced capabilities.',
    features: [
      'Unlimited Active Aliases',
      'Unlimited Usernames & Domains',
      'Team Management',
      'API Access',
      'Dedicated Support',
      'Advanced Forwarding Rules',
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'outline',
    isCurrent: false,
  },
];

export default function BillingPage() {
  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-8 w-8" /> Billing & Plans
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          Choose the plan that's right for you. Unlock more features and increase your limits by upgrading your account.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={cn(
            "flex flex-col transition-all",
            plan.highlight ? "border-primary shadow-lg scale-105" : "shadow-sm"
          )}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.price.startsWith('$') && <span className="text-muted-foreground">/ month</span>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.buttonVariant as any}
                disabled={plan.isCurrent}
              >
                {plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
