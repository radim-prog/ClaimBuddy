'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service (Sentry, etc.)
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Něco se pokazilo</CardTitle>
          <CardDescription>
            Omlouváme se, ale došlo k neočekávané chybě.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Zkuste to prosím znovu. Pokud problém přetrvává, kontaktujte nás.
          </p>
          <Button onClick={reset} className="w-full">
            Zkusit znovu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
