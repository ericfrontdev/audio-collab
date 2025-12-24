'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Music,
  CheckCircle2,
  Link as LinkIcon,
  Instagram,
  Youtube,
  LogOut,
} from 'lucide-react'
import type { Profile } from '@/types/profile'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface UserProfileCardProps {
  profile: Profile
}

export function UserProfileCard({ profile }: UserProfileCardProps) {
  // Mock stats for now - these would come from the database later
  const followingCount = 482
  const followersCount = 12500
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/profile/${profile.username}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="group rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
    >
      {/* Banner */}
      <div className="relative h-24 bg-gradient-to-r from-primary/20 to-purple-600/20">
        {profile.banner_url ? (
          <Image
            src={profile.banner_url}
            alt="Banner"
            fill
            className="object-cover"
          />
        ) : null}
      </div>

      {/* Content */}
      <div className="relative p-4">
        {/* Avatar and Edit Button Row */}
        <div className="flex items-end justify-between -mt-14 mb-3">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              width={80}
              height={80}
              className="rounded-xl border-4 border-zinc-900 object-cover relative z-10"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl border-4 border-zinc-900 bg-zinc-800 flex items-center justify-center relative z-10">
              <Music className="w-8 h-8 text-zinc-600" />
            </div>
          )}

          <Link
            href="/profile/edit"
            className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 text-xs text-white hover:bg-zinc-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Edit Profile
          </Link>
          <Link
            href="/profile/edit"
            onClick={(e) => e.stopPropagation()}
          >
            <LogOut
              color="violet"
              size="18"
            />
          </Link>
        </div>

        {/* User Info */}
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
              {profile.display_name || profile.username}
            </h3>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">@{profile.username}</p>

          {profile.bio && (
            <p className="text-sm text-gray-400 mt-3 line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div>
              <span className="font-semibold text-white">{followingCount}</span>
              <span className="text-gray-500 ml-1">Following</span>
            </div>
            <div>
              <span className="font-semibold text-white">{followersCount}</span>
              <span className="text-gray-500 ml-1">Followers</span>
            </div>
          </div>

          {/* Social Links */}
          {(profile.soundcloud_url ||
            profile.instagram_url ||
            profile.twitter_url ||
            profile.youtube_url ||
            profile.website_url) && (
            <TooltipProvider>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800">
                {profile.soundcloud_url && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={profile.soundcloud_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/icon w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Music className="w-4 h-4 text-gray-400 group-hover/icon:text-primary transition-colors" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>SoundCloud</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {profile.instagram_url && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={profile.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/icon w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Instagram className="w-4 h-4 text-gray-400 group-hover/icon:text-primary transition-colors" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Instagram</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {profile.twitter_url && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={profile.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/icon w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors text-gray-400 hover:text-primary text-xs font-bold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        𝕏
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Twitter / X</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {profile.youtube_url && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={profile.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/icon w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Youtube className="w-4 h-4 text-gray-400 group-hover/icon:text-primary transition-colors" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>YouTube</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {profile.website_url && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/icon w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <LinkIcon className="w-4 h-4 text-gray-400 group-hover/icon:text-primary transition-colors" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Website</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  )
}
