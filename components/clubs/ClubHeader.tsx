'use client';

import Image from 'next/image';
import { Music, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { joinClub, leaveClub } from '@/app/actions/clubs';
import type { Club } from '@/types/club';

interface ClubHeaderProps {
  club: Club;
  memberCount: number;
  isMember: boolean;
  userId?: string;
}

export function ClubHeader({ club, memberCount, isMember, userId }: ClubHeaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentIsMember, setCurrentIsMember] = useState(isMember);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'en';

  const handleJoinLeave = async () => {
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    setIsLoading(true);

    try {
      if (currentIsMember) {
        // Leave club
        const result = await leaveClub(club.id, locale);
        if (result?.error) {
          console.error('Error leaving club:', result.error);
          alert(result.error);
        } else {
          setCurrentIsMember(false);
        }
      } else {
        // Join club
        const result = await joinClub(club.id, locale);
        if (result?.error) {
          console.error('Error joining club:', result.error);
          alert(result.error);
        } else {
          setCurrentIsMember(true);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An error occurred');
    }

    setIsLoading(false);
  };

  return (
    <div className="border-b border-zinc-800">
      {/* Banner with overlayed info */}
      <div className="relative h-64 bg-gradient-to-r from-primary/20 to-purple-600/20">
        {club.banner_url ? (
          <Image
            src={club.banner_url}
            alt={club.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="w-20 h-20 text-white/10" />
          </div>
        )}

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Club Info Overlayed */}
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-6">
          <div className="flex items-end justify-between">
            {/* Left: Avatar + Info */}
            <div className="flex items-end gap-4">
              {/* Avatar */}
              {club.avatar_url ? (
                <Image
                  src={club.avatar_url}
                  alt={club.name}
                  width={120}
                  height={120}
                  className="rounded-xl border-4 border-black object-cover"
                />
              ) : (
                <div className="w-30 h-30 rounded-xl border-4 border-black bg-zinc-800 flex items-center justify-center">
                  <Music className="w-12 h-12 text-zinc-600" />
                </div>
              )}

              {/* Club Info */}
              <div className="pb-2">
                <h1 className="text-3xl font-bold text-white mb-1">{club.name}</h1>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <Users className="w-4 h-4" />
                    <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                  </div>
                  <span className="text-gray-500">•</span>
                  <div className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-medium">
                    {club.genre}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Action Button */}
            {userId && (
              <div className="pb-2">
                <Button
                  onClick={handleJoinLeave}
                  disabled={isLoading}
                  variant={currentIsMember ? 'outline' : 'default'}
                  className="min-w-[120px]"
                >
                  {isLoading ? '...' : currentIsMember ? 'Leave Club' : 'Join Club'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
