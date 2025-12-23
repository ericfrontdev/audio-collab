import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/routing'
import {
  Music,
  Users,
  Guitar,
  Mic2,
  Piano,
  Disc3,
  Radio,
  Headphones,
  Heart,
  Drum,
  Music2,
  Volume2,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import type { ClubWithStats } from '@/types/club'
import { AppLayout } from '@/components/layouts/AppLayout'

// Genre-specific icons
const genreIcons: Record<string, LucideIcon> = {
  'Lo-fi': Headphones,
  'Hip-Hop': Mic2,
  Jazz: Piano,
  Rock: Guitar,
  Electronic: Disc3,
  Pop: Heart,
  'R&B': Music2,
  Indie: Radio,
  Metal: Volume2,
  Country: Guitar,
  Classical: Music,
  Ambient: Waves,
}

export default async function ClubsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get all clubs
  const { data: clubs } = await supabase.from('clubs').select('*').order('name')

  // Get user's club memberships if authenticated
  let userClubIds: string[] = []
  if (user) {
    const { data: memberships } = await supabase
      .from('club_members')
      .select('club_id')
      .eq('user_id', user.id)

    userClubIds = memberships?.map((m) => m.club_id) || []
  }

  // Get member counts for all clubs in a single query
  const clubIds = clubs?.map((c) => c.id) || []
  const { data: memberCounts } = await supabase
    .from('club_members')
    .select('club_id')
    .in('club_id', clubIds)

  // Count members per club
  const countsMap = new Map<string, number>()
  memberCounts?.forEach((m) => {
    countsMap.set(m.club_id, (countsMap.get(m.club_id) || 0) + 1)
  })

  // Enhance clubs with stats
  const clubsWithStats: ClubWithStats[] = (clubs || []).map((club) => ({
    ...club,
    member_count: countsMap.get(club.id) || 0,
    is_member: userClubIds.includes(club.id),
  }))

  return (
    <AppLayout>
      <div className="min-h-screen bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-3 text-white">
              Musical Clubs
            </h1>
            <p className="text-gray-400 text-lg">
              Join genre-based communities, share projects, and collaborate with
              musicians
            </p>
          </div>

          {/* Clubs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {clubsWithStats.map((club) => {
              const Icon = genreIcons[club.genre] || Music

              return (
                <Link
                  key={club.id}
                  href={`/clubs/${club.slug}`}
                >
                  <div className="group relative aspect-square rounded-2xl bg-black border-2 border-transparent shadow-[0_0_60px_-12px_rgba(168,85,247,0.4)] hover:border-primary hover:shadow-[0_0_80px_-8px_rgba(168,85,247,0.8)] transition-all duration-300 hover:scale-[1.02]">
                    {/* Inner card content */}
                    <div className="relative w-full h-full rounded-xl p-5 flex flex-col justify-between">
                      {/* Icon */}
                      <div className="mb-3">
                        <Icon className="w-8 h-8 text-white/90 group-hover:text-primary transition-colors duration-300" />
                      </div>

                      {/* Content */}
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-primary mb-2 transition-colors duration-300">
                          {club.name}
                        </h3>
                        <p className="text-gray-400 group-hover:text-primary/70 text-xs leading-relaxed line-clamp-2 mb-3 transition-colors duration-300">
                          {club.description ||
                            'A community for music lovers and creators'}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-gray-500 group-hover:text-primary/80 text-xs transition-colors duration-300">
                            <Users className="w-3.5 h-3.5" />
                            <span>{club.member_count}</span>
                          </div>
                          {club.is_member && (
                            <div className="px-1.5 py-0.5 rounded bg-white/10 group-hover:bg-primary/20 text-white group-hover:text-primary text-[10px] font-medium transition-colors duration-300">
                              Joined
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Empty State */}
          {clubsWithStats.length === 0 && (
            <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-16 text-center">
              <Music className="w-20 h-20 mx-auto mb-6 text-zinc-700" />
              <h3 className="text-2xl font-semibold mb-3 text-white">
                No clubs yet
              </h3>
              <p className="text-gray-400 text-lg">
                Clubs will appear here once they are created
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
