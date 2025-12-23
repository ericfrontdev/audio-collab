import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'fr'],
  defaultLocale: 'en',
  localePrefix: 'always' // Always show locale prefix in URLs
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
