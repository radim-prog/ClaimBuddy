'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUp, signInWithGoogle } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { registerSchema } from '@/lib/validations';

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
      gdprConsent: false,
      healthDataConsent: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);

    const { user, error: signUpError } = await signUp(data.email, data.password, {
      name: data.name,
      phone: data.phone,
    });

    if (signUpError) {
      setError(
        signUpError.includes('email-already-in-use')
          ? 'Tento email je již zaregistrován.'
          : 'Nepodařilo se vytvořit účet. Zkuste to prosím znovu.'
      );
      setLoading(false);
      return;
    }

    if (user) {
      router.push('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    const { user, error: signInError } = await signInWithGoogle();

    if (signInError) {
      setError('Nepodařilo se přihlásit pomocí Google. Zkuste to prosím znovu.');
      setLoading(false);
      return;
    }

    if (user) {
      router.push('/dashboard');
    }
  };

  return (
    <>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Vytvoření účtu</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Již máte účet?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Přihlaste se
          </Link>
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jméno a příjmení</FormLabel>
                  <FormControl>
                    <Input placeholder="Jan Novák" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input placeholder="+420123456789" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heslo</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" disabled={loading} {...field} />
                  </FormControl>
                  <FormDescription>Minimálně 8 znaků, včetně čísla a velkého písmena</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potvrzení hesla</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gdprConsent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Souhlasím se{' '}
                      <Link href="/legal/privacy" className="text-primary hover:underline" target="_blank">
                        zpracováním osobních údajů
                      </Link>{' '}
                      a{' '}
                      <Link href="/legal/terms" className="text-primary hover:underline" target="_blank">
                        obchodními podmínkami
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="healthDataConsent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-amber-200 bg-amber-50 p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-semibold">
                      Souhlasím se zpracováním citlivých osobních údajů (čl. 9 GDPR)
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Pro zpracování pojistných událostí potřebujeme Váš výslovný souhlas se zpracováním
                      zdravotních údajů a fotografií zranění. Bez tohoto souhlasu nemůžeme získávat lékařské
                      zprávy ani komunikovat s pojišťovnou o zdravotních aspektech případu.{' '}
                      <Link
                        href="/legal/gdpr-consent"
                        className="text-primary hover:underline font-medium"
                        target="_blank"
                      >
                        Přečíst plný souhlas
                      </Link>
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Vytvářím účet...' : 'Vytvořit účet'}
            </Button>
          </form>
        </Form>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">nebo</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="mt-6 w-full"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Pokračovat s Google
        </Button>
      </div>
    </>
  );
}
