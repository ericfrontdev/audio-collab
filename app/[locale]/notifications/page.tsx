'use client';

import { Bell, MessageSquare, UserPlus, Heart, Music } from 'lucide-react';
import { Sidebar } from '@/components/navigation/Sidebar';
import { useTranslations } from 'next-intl';

export default function NotificationsPage() {
  const t = useTranslations('notifications');

  const upcomingFeatures = [
    {
      icon: MessageSquare,
      key: 'projectUpdates',
    },
    {
      icon: UserPlus,
      key: 'newFollowers',
    },
    {
      icon: Heart,
      key: 'likesReactions',
    },
    {
      icon: Music,
      key: 'collaborationRequests',
    },
  ];

  return (
    <>
      <Sidebar />
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Bell className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-400">
              {t('comingSoon')}
            </p>
          </div>

          {/* Description */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8">
            <p className="text-gray-300 text-center">
              {t('description')}
            </p>
          </div>

          {/* Upcoming Features */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white mb-6">{t('upcomingFeatures')}</h2>
            {upcomingFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.key}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {t(`features.${feature.key}.title`)}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {t(`features.${feature.key}.description`)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              {t('feedback')}
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
