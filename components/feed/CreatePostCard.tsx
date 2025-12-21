'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Image, Music, Sparkles } from 'lucide-react'
import { createPost } from '@/app/actions/feed'
import { toast } from 'react-toastify'

interface CreatePostCardProps {
  userAvatar?: string | null
  username?: string
}

export function CreatePostCard({ userAvatar, username }: CreatePostCardProps) {
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  const handlePost = async () => {
    if (!content.trim()) {
      toast.error('Post cannot be empty')
      return
    }

    setIsPosting(true)
    try {
      const result = await createPost(content)

      if (result.success) {
        toast.success('Posted successfully!')
        setContent('')
      } else {
        toast.error(result.error || 'Failed to create post')
      }
    } catch (error) {
      toast.error('Failed to create post')
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <Card className="p-4 bg-zinc-900 border-zinc-800">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={username || 'User'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening in your music world?"
            className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none min-h-[80px] text-lg"
            maxLength={500}
            disabled={isPosting}
          />

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
            <div className="flex gap-2">
              <button
                type="button"
                className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
                title="Add image"
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
                title="Add audio"
              >
                <Music className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors"
                title="AI enhance"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-sm ${
                  content.length > 450
                    ? 'text-red-500'
                    : content.length > 400
                    ? 'text-yellow-500'
                    : 'text-gray-500'
                }`}
              >
                {content.length}/500
              </span>
              <Button
                onClick={handlePost}
                disabled={!content.trim() || isPosting}
                className="px-6"
              >
                {isPosting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
