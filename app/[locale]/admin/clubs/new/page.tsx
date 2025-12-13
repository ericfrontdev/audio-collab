'use client'

import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { createClub } from '@/app/actions/clubs'

export default function NewClubPage() {
  const t = useTranslations('admin.clubs')
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as string
  const [state, formAction] = useActionState(createClub, null)

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create New Club</h1>
          <p className="mt-2 text-muted-foreground">Add a new musical genre club</p>
        </div>

        <form action={formAction} className="bg-card shadow rounded-lg p-6 space-y-6">
          <input type="hidden" name="locale" value={locale} />

          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Club Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g., Blues, Jazz, Rock"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The name of the musical genre or style
            </p>
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-foreground">
              Slug *
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              placeholder="e.g., blues, jazz, rock"
              pattern="[a-z0-9-]+"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              URL-friendly identifier (lowercase, no spaces, use hyphens)
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Describe this musical genre..."
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
            />
          </div>

          <div>
            <label htmlFor="cover_url" className="block text-sm font-medium text-foreground">
              Cover Image URL
            </label>
            <input
              id="cover_url"
              name="cover_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Optional image to represent this genre
            </p>
          </div>

          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-foreground">
              Visibility *
            </label>
            <select
              id="visibility"
              name="visibility"
              required
              defaultValue="public"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Public clubs are visible to everyone
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-input rounded-md text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
            >
              Create Club
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
