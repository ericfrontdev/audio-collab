import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // First, handle i18n routing
  const intlResponse = intlMiddleware(request);

  // Then, update Supabase session
  // We need to pass the request with the locale already set
  const supabaseResponse = await updateSession(request);

  // Merge the responses: use intl's response but preserve Supabase cookies
  if (intlResponse) {
    // Copy Supabase cookies to the intl response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return intlResponse;
  }

  return supabaseResponse;
}

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - _next (Next.js internals)
  // - Static files (images, etc.)
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
