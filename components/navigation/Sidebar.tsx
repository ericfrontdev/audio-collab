'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Home, Compass, Bell, MessageCircle, Music, Users, User, Settings, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface SidebarProps {
  username?: string;
  unreadMessagesCount?: number;
}

export function Sidebar({ username, unreadMessagesCount = 0 }: SidebarProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  const navigation = [
    { nameKey: 'feed', href: '/feed', icon: Home },
    { nameKey: 'explore', href: '/explore', icon: Compass },
    { nameKey: 'notifications', href: '/notifications', icon: Bell },
    { nameKey: 'messages', href: '/messages', icon: MessageCircle },
    { nameKey: 'clubs', href: '/clubs', icon: Users },
    { nameKey: 'profile', href: username ? `/profile/${username}` : '/profile', icon: User },
    { nameKey: 'settings', href: '/settings', icon: Settings },
  ];

  const projectsSubMenu = [
    { nameKey: 'myProjects', href: '/my-projects' },
    { nameKey: 'clubProjects', href: '/projects' },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-md bg-zinc-900 text-white"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-[#0a0a0a] border-r border-zinc-800 transition-transform duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-3 mb-8 px-2">
            <Image
              src="/images/AC_Logo.webp"
              alt="AudioCollab"
              width={40}
              height={40}
              className="object-contain"
              unoptimized
            />
            <span className="text-xl font-bold text-white">AudioCollab</span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navigation.slice(0, 4).map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.nameKey}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-400 hover:bg-zinc-900 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{t(item.nameKey)}</span>
                  {item.nameKey === 'messages' && unreadMessagesCount > 0 && (
                    <span className="ml-auto bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Projects Dropdown */}
            <div>
              <button
                onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors w-full',
                  pathname?.startsWith('/projects') || pathname?.startsWith('/my-projects')
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-400 hover:bg-zinc-900 hover:text-white'
                )}
              >
                <Music className="w-5 h-5" />
                <span className="text-sm font-medium">{t('projects')}</span>
                {isProjectsOpen ? (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>

              {isProjectsOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  {projectsSubMenu.map((subItem) => {
                    const isActive = pathname === subItem.href;
                    return (
                      <Link
                        key={subItem.nameKey}
                        href={subItem.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'block px-3 py-2 rounded-lg text-sm transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-gray-400 hover:bg-zinc-900 hover:text-white'
                        )}
                      >
                        {t(subItem.nameKey)}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rest of navigation */}
            {navigation.slice(4).map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.nameKey}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-400 hover:bg-zinc-900 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{t(item.nameKey)}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
