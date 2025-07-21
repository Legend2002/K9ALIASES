
import { LifeBuoy, Mail, MessageSquare, BookOpen } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SupportForm from '@/components/support-form';

const faqs = [
  {
    question: "What is an email alias?",
    answer: "An email alias is a forwarding email address. Any email sent to an alias is automatically forwarded to your primary inbox. This allows you to give out unique email addresses for different services without revealing your real one, protecting you from spam and data breaches.",
  },
  {
    question: "How do I create a new alias?",
    answer: "Navigate to the 'Create Alias' page from the dashboard. You can either generate a standard alias based on a description or create a fully custom alias using your own username and one of your verified custom domains.",
  },
  {
    question: "What is the difference between an active and inactive alias?",
    answer: "Active aliases will forward emails to your inbox. Inactive aliases will not forward emails. You can toggle the status of any alias at any time from the 'My Aliases' page. This is useful if an alias starts receiving spam.",
  },
  {
    question: "Can I reply from an alias address?",
    answer: "Replying from an alias address is a premium feature that is not yet implemented. Currently, all replies will come from your primary email address.",
  },
  {
    question: "What happens when I delete an alias?",
    answer: "When you delete an alias, it is moved to your 'Deleted History' for 30 days. During this period, you can restore it. After 30 days, or if you permanently delete it from the history, it is gone forever and cannot be recovered.",
  },
];

export default function SupportPage() {
  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <LifeBuoy className="h-8 w-8" /> Support & Help Center
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          Have questions? We're here to help. Find answers to common questions below or get in touch with our support team.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen /> Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                   <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare /> Contact Us
              </CardTitle>
              <CardDescription>
                Can't find the answer you're looking for? Fill out the form to send a message to our team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupportForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
