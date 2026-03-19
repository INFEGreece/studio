
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full bg-card border rounded-[2rem] p-8 md:p-12 text-center space-y-6 shadow-2xl">
        <div className="bg-destructive/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-headline font-bold">Something went wrong</h1>
        <p className="text-muted-foreground leading-relaxed">
          The application encountered an unexpected error. This might be due to a temporary connection issue or browser restriction.
        </p>
        <div className="space-y-3 pt-4">
          <Button onClick={() => reset()} className="w-full h-14 rounded-xl text-lg font-bold flex items-center justify-center gap-2">
            <RefreshCcw className="h-5 w-5" /> Try Again
          </Button>
          <Button variant="ghost" onClick={() => window.location.href = '/'} className="w-full h-12 rounded-xl text-muted-foreground">
            Return to Home
          </Button>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground/50 pt-4 break-all opacity-50">
          {error.digest && `Error ID: ${error.digest}`}
        </p>
      </div>
    </div>
  );
}
