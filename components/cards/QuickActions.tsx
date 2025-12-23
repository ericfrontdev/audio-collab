'use client';

import { Link, useRouter } from '@/i18n/routing';
import { Music2, FolderOpen, PlusCircle, Settings } from 'lucide-react';
import { toast } from 'react-toastify';

interface QuickActionsProps {
  clubId?: string;
  isMember?: boolean;
}

export function QuickActions({ clubId, isMember }: QuickActionsProps = {}) {
  const router = useRouter();

  const handleNewProject = (e: React.MouseEvent) => {
    e.preventDefault();

    // If no club context, redirect to clubs page
    if (!clubId) {
      toast.warning('Please select a club to create your project in');
      router.push('/clubs');
      return;
    }

    // If in a club but not a member, show toast
    if (!isMember) {
      toast.warning('You must join the club to create a project');
      return;
    }

    // If member, go to project creation
    router.push(`/projects/new?club=${clubId}`);
  };

  const actions = [
    {
      name: 'New Project',
      href: '#',
      icon: PlusCircle,
      onClick: handleNewProject,
    },
    {
      name: 'My Studios',
      href: '/my-projects',
      icon: FolderOpen,
    },
    {
      name: 'Request Club',
      href: '/clubs/request',
      icon: Music2,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];
  return (
    <div>
      <h3 className="text-sm font-semibold text-white mb-3 px-1">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const content = (
            <div className="group relative aspect-square rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-primary/50 transition-all duration-300 p-4 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors text-center">
                {action.name}
              </span>
            </div>
          );

          if ('onClick' in action) {
            return (
              <button
                key={action.name}
                type="button"
                onClick={action.onClick}
                className="text-left"
                aria-label={action.name}
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={action.name} href={action.href} aria-label={action.name}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
