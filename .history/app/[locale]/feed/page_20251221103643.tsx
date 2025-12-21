import { getFeedPosts } from '@/app/actions/feed'
import { CreatePostCard } from '@/components/feed/CreatePostCard'
import { FeedPost } from '@/components/feed/FeedPost'
import { AppLayout } from '@/components/layouts/AppLayout'
import { UserProfileCard } from '@/components/cards/UserProfileCard'
import { QuickActions } from '@/components/cards/QuickActions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Heart } from 'lucide-react'

export default async function FeedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get feed posts
  const { posts } = await getFeedPosts(20, 0)

  // Get suggested clubs (user is not a member of)
  const { data: userClubs } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', user.id)

  const userClubIds = userClubs?.map((c) => c.club_id) || []

  const { data: suggestedClubs } = await supabase
    .from('clubs')
    .select('id, name, slug, image_url, genre')
    .not('id', 'in', `(${userClubIds.join(',') || 'null'})`)
    .limit(3)

  return (
    <AppLayout>
      <div className="min-h-screen bg-black">
        {/* 3 Column Layout */}
        <div className="flex">
          {/* Main Content - Center */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
              <div className="px-4 md:px-6 py-4">
                <h1 className="text-2xl font-bold text-white">Feed</h1>
              </div>
            </div>

            {/* Feed content */}
            <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 space-y-4">
              {/* Create post card */}
              <CreatePostCard
                userAvatar={profile?.avatar_url}
                username={profile?.username || undefined}
              />

              {/* Feed */}
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">
                      No posts yet. Be the first to share something!
                    </p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <FeedPost
                      key={post.id}
                      post={post}
                      currentUserId={user.id}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden xl:block w-96 border-l border-zinc-800 p-6 space-y-6">
            {/* User Profile Card */}
            {profile && <UserProfileCard profile={profile} />}

            {/* Quick Actions */}
            <QuickActions />

            {/* Suggested Clubs */}
            {suggestedClubs && suggestedClubs.length > 0 && (
              <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Discover Clubs
                </h3>
                <div className="space-y-3">
                  {suggestedClubs.map((club) => (
                    <a
                      key={club.id}
                      href={`/clubs/${club.slug}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                    >
                      {club.image_url ? (
                        <img
                          src={club.image_url}
                          alt={club.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-semibold text-sm">
                            {club.name[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {club.name}
                        </p>
                        <p className="text-xs text-gray-500">{club.genre}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                What's happening
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Share your latest tracks, collaborate with other musicians, and
                discover new music from the community.
              </p>
            </div>
            <div className="flex flex-rows">
              <p className="text-xs text-gray-400 leading-relaxed">
                made with
                <span>
                  <Heart
                    color="red"
                    size="16"
                  />
                </span>
                for indie musicians
              </p>
            </div>
            <p className="ext-xs text-gray-400 leading-relaxed">
              &copy;2026 AudioCollab
            </p>
          </aside>
        </div>
      </div>
    </AppLayout>
  )
}
