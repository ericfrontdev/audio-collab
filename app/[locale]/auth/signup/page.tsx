'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useActionState } from 'react';
import { signup } from '@/app/actions/auth';

export default function SignupPage() {
  const t = useTranslations('auth.signup');
  const params = useParams();
  const locale = params.locale as string;
  const [state, formAction] = useActionState(signup, null);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">{t('title')}</h2>
        </div>

        <form action={formAction} className="mt-8 space-y-6">
          <input type="hidden" name="locale" value={locale} />

          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium">
                {t('displayName')}
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('displayNameHint')}
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                {t('email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                {t('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              {t('submit')}
            </button>
          </div>

          <div className="text-center text-sm">
            {t('hasAccount')}{' '}
            <Link href="../login" className="font-medium text-primary hover:underline">
              {t('loginLink')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
