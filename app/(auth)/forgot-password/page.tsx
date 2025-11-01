'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPassword } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { forgotPasswordSchema } from '@/lib/validations';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error: resetError } = await resetPassword(data.email);

    if (resetError) {
      setError('Nepodařilo se odeslat email pro obnovení hesla. Zkuste to prosím znovu.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <>
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Email odeslán</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Zkontrolujte svou emailovou schránku. Poslali jsme vám odkaz pro obnovení hesla.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">
            Neobdrželi jste email? Zkontrolujte složku se spamem nebo{' '}
            <button
              onClick={() => setSuccess(false)}
              className="font-medium text-primary hover:underline"
            >
              zkuste to znovu
            </button>
            .
          </p>

          <Link href="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zpět na přihlášení
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Zapomenuté heslo</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Zadejte svůj email a my vám pošleme odkaz pro obnovení hesla.
        </p>
      </div>

      <div className="mt-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="vas@email.cz"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Odesílám...' : 'Odeslat odkaz'}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center text-sm text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zpět na přihlášení
          </Link>
        </div>
      </div>
    </>
  );
}
