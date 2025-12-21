import { getFeedPosts } from '@/app/actions/feed'
import { CreatePostCard } from '@/components/feed/CreatePostCard'
import { FeedPost } from '@/components/feed/FeedPost'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    .select('username, avatar_url, display_name')
    .eq('id', user.id)
    .single()

  // Get feed posts
  const { posts } = await getFeedPosts(20, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Home</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
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
            posts.map((post) => <FeedPost key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  )
}
