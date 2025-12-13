'use client'

import { useTranslations } from 'next-intl'
import { useParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { logout } from '@/app/actions/auth'
import { useState } from 'react'

interface NavigationProps {
  user: any
  isAdmin?: boolean
}

export default function Navigation({ user, isAdmin = false }: NavigationProps) {
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const locale = params.locale as string
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout(locale)
  }

  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
  }

  const isActive = (path: string) => {
    return pathname.startsWith(`/${locale}${path}`)
  }

  return (
    <nav className="shadow" style={{ backgroundColor: '#28212e' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex">
            <Link href={`/${locale}`} className="flex-shrink-0 flex items-center gap-3">
              <Image
                src="/images/AC_Logo.webp"
                alt="AudioCollab"
                width={56}
                height={56}
                className="object-contain"
                unoptimized
              />
              <span className="text-xl font-bold text-white">
                AudioCollab
              </span>
            </Link>

            {user && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href={`/${locale}/projects`}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/projects')
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  {t('projects')}
                </Link>
                <Link
                  href={`/${locale}/clubs`}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/clubs')
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  {t('clubs')}
                </Link>
                <Link
                  href={`/${locale}/profile`}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/profile')
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  {t('profile')}
                </Link>
                {isAdmin && (
                  <Link
                    href={`/${locale}/admin`}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/admin')
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {/* Language Switcher */}
            <div className="flex space-x-2">
              <button
                onClick={() => switchLocale('en')}
                className={`px-2 py-1 text-sm font-medium rounded ${
                  locale === 'en'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => switchLocale('fr')}
                className={`px-2 py-1 text-sm font-medium rounded ${
                  locale === 'fr'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                FR
              </button>
            </div>

            {user ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {t('logout')}
              </button>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href={`/${locale}/auth/login`}
                  className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-accent"
                >
                  {t('login')}
                </Link>
                <Link
                  href={`/${locale}/auth/signup`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {t('signup')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          {user && (
            <div className="pt-2 pb-3 space-y-1">
              <Link
                href={`/${locale}/projects`}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/projects')
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-transparent text-muted-foreground hover:bg-accent hover:border-border'
                }`}
              >
                {t('projects')}
              </Link>
              <Link
                href={`/${locale}/clubs`}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/clubs')
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-transparent text-muted-foreground hover:bg-accent hover:border-border'
                }`}
              >
                {t('clubs')}
              </Link>
              <Link
                href={`/${locale}/profile`}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/profile')
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-transparent text-muted-foreground hover:bg-accent hover:border-border'
                }`}
              >
                {t('profile')}
              </Link>
              {isAdmin && (
                <Link
                  href={`/${locale}/admin`}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/admin')
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-transparent text-muted-foreground hover:bg-accent hover:border-border'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          )}

          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-4 space-x-2 mb-3">
              <button
                onClick={() => switchLocale('en')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  locale === 'en'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => switchLocale('fr')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  locale === 'fr'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                FR
              </button>
            </div>

            {user ? (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-base font-medium text-foreground hover:bg-accent"
              >
                {t('logout')}
              </button>
            ) : (
              <div className="space-y-1">
                <Link
                  href={`/${locale}/auth/login`}
                  className="block px-4 py-2 text-base font-medium text-foreground hover:bg-accent"
                >
                  {t('login')}
                </Link>
                <Link
                  href={`/${locale}/auth/signup`}
                  className="block px-4 py-2 text-base font-medium text-foreground hover:bg-accent"
                >
                  {t('signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
