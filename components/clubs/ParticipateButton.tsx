'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { participateInChallenge } from '@/app/actions/clubs'

export default function ParticipateButton({
  challengeId,
  clubId,
  clubSlug,
  hasParticipated,
  userEntryId,
  locale
}: {
  challengeId: string
  clubId: string
  clubSlug: string
  hasParticipated: boolean
  userEntryId?: string
  locale: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleParticipate() {
    setLoading(true)
    const result = await participateInChallenge(challengeId, clubId, locale)
    if (result.projectId) {
      router.push(`/${locale}/projects/${result.projectId}`)
    }
    setLoading(false)
  }

  if (hasParticipated && userEntryId) {
    return (
      <button
        onClick={() => router.push(`/${locale}/projects/${userEntryId}`)}
        className="px-6 py-3 border border-primary text-primary rounded-md font-medium hover:bg-primary/10"
      >
        View My Entry
      </button>
    )
  }

  return (
    <button
      onClick={handleParticipate}
      disabled={loading}
      className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center space-x-2"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span>{loading ? 'Creating...' : 'Participate'}</span>
    </button>
  )
}
