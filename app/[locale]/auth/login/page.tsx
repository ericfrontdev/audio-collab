'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useActionState } from 'react';
import Image from 'next/image';
import { login } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const params = useParams();
  const locale = params.locale as string;
  const [state, formAction] = useActionState(login, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo + Brand */}
        <div className="flex flex-col items-center gap-4">
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <Image
              src="/images/AC_Logo.webp"
              alt="AudioCollab"
              width={48}
              height={48}
              className="object-contain"
              unoptimized
            />
            <span className="text-2xl font-bold text-foreground">AudioCollab</span>
          </Link>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {t('title')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="locale" value={locale} />

              {state?.error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                  {state.error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                {t('submit')}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {t('noAccount')}{' '}
                <Link
                  href={`/${locale}/auth/signup`}
                  className="font-medium text-primary hover:underline"
                >
                  {t('signupLink')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
