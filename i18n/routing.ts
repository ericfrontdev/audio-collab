import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'fr'],
  defaultLocale: 'en',
  localePrefix: 'as-needed' // Remove /en prefix for default locale
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
