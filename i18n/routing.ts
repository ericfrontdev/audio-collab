import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en'],
  defaultLocale: 'en',
  localePrefix: 'never' // Never show locale prefix
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
