'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { MessageCircle, Music, Users as UsersIcon, Info, CheckCircle2, PlusCircle, Folder } from 'lucide-react';
import type { Club } from '@/types/club';
import type { Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { ClubFeed } from './ClubFeed';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { useTranslations } from 'next-intl';

const tabsConfig = [
  { id: 'feed', labelKey: 'feed', icon: MessageCircle },
  { id: 'projects', labelKey: 'projects', icon: Music },
  { id: 'members', labelKey: 'members', icon: UsersIcon },
  { id: 'about', labelKey: 'about', icon: Info },
];

interface Member {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  joined_at: string;
}

interface ProjectWithDetails extends Project {
  owner_id: string;
  member_count: number;
  owner_profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ClubTabsProps {
  clubId: string;
  clubSlug: string;
  isMember: boolean;
  club: Club;
  members: Member[];
  projects: ProjectWithDetails[];
  currentUserId?: string;
  currentUsername?: string;
  locale: string;
}

export function ClubTabs({ clubId, clubSlug, isMember, club, members, projects, currentUserId, currentUsername, locale }: ClubTabsProps) {
  const [activeTab, setActiveTab] = useState('feed');
  const tTabs = useTranslations('clubs.tabs');
  const tProjects = useTranslations('clubs.projectsTab');
  const tMembers = useTranslations('clubs.membersTab');
  const tAbout = useTranslations('clubs.aboutTab');
  const tDescriptions = useTranslations('clubs.descriptions');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      {/* Tabs Navigation */}
      <div className="border-b border-zinc-800 px-8">
        <div className="flex gap-6">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tTabs(tab.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {activeTab === 'feed' && (
          <ClubFeed
            club={{ id: clubId, name: club.name, slug: clubSlug }}
            isMember={isMember}
            userId={currentUserId}
            username={currentUsername}
          />
        )}

        {activeTab === 'projects' && (
          <div>
            {/* Header with New Project button */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {tProjects('title')} ({projects.length})
              </h2>
              {isMember && (
                <Link href={`/projects/new?club=${clubId}`}>
                  <Button className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    {tProjects('newProject')}
                  </Button>
                </Link>
              )}
            </div>

            {/* Projects Grid */}
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={{
                      ...project,
                      owner: project.owner_profile
                    }}
                    currentUserId={currentUserId}
                    locale={locale}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Folder className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{tProjects('noProjects')}</p>
                {isMember && (
                  <Link href={`/projects/new?club=${clubId}`}>
                    <Button className="flex items-center gap-2 mx-auto">
                      <PlusCircle className="w-4 h-4" />
                      {tProjects('createFirstProject')}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-6">
              {tMembers('title')} ({members.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <Link key={member.id} href={`/profile/${member.username}`}>
                  <div className="group flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-primary/50 transition-colors">
                    {member.avatar_url ? (
                      <Image
                        src={member.avatar_url}
                        alt={member.username}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                        <UsersIcon className="w-6 h-6 text-zinc-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
                          {member.display_name || member.username}
                        </h3>
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      </div>
                      <p className="text-xs text-gray-500">@{member.username}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {members.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>{tMembers('noMembers')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-white mb-6">{tAbout('title')} {club.name}</h2>

            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">{tAbout('description')}</h3>
                <p className="text-white">
                  {tDescriptions(club.genre as any) || club.description || tAbout('noDescription')}
                </p>
              </div>

              {/* Genre */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">{tAbout('genre')}</h3>
                <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                  {club.genre}
                </div>
              </div>

              {/* Rules */}
              {club.rules && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">{tAbout('rules')}</h3>
                  <p className="text-white whitespace-pre-wrap">
                    {club.rules}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">{tAbout('stats')}</h3>
                <div className="flex gap-6">
                  <div>
                    <div className="text-2xl font-bold text-white">{members.length}</div>
                    <div className="text-sm text-gray-500">{tMembers('title')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{projects.length}</div>
                    <div className="text-sm text-gray-500">{tProjects('title')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
