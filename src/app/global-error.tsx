
'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-background text-foreground font-sans">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="text-4xl font-bold">Critical Error</h1>
            <p className="text-muted-foreground">A critical error occurred while loading the application.</p>
            <Button onClick={() => reset()} size="lg" className="w-full rounded-xl">
              Reload Application
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
