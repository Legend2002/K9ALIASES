
"use client";

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

export default function SupportForm() {

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;
    
    // In a real application, you would send this data to a backend service.
    // For this prototype, we'll use a mailto link.
    window.location.href = `mailto:support@k9-aliases.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" placeholder="e.g., Issue with custom domain" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Please describe your issue in detail..."
          required
          rows={5}
        />
      </div>
      <Button type="submit" className="w-full">Send Message</Button>
    </form>
  );
}
