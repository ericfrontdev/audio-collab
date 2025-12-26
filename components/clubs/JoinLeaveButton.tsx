'use client'

import { joinClub, leaveClub } from '@/app/actions/clubs'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function JoinLeaveButton({
  clubId,
  isMember,
  locale
}: {
  clubId: string
  isMember: boolean
  locale: string
}) {
  const t = useTranslations('clubs')
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    console.log('🔵 Join/Leave button clicked')
    setLoading(true)
    try {
      console.log('🔵 Calling action:', isMember ? 'leaveClub' : 'joinClub')
      const result = isMember
        ? await leaveClub(clubId, locale)
        : await joinClub(clubId, locale)

      console.log('🔵 Action result:', result)

      if (result?.error) {
        console.error('Error:', result.error)
        alert(result.error)
        setLoading(false)
        return
      }

      window.location.reload()
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-6 py-2 rounded-md font-medium text-sm ${
        isMember
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          : 'bg-primary text-white hover:bg-primary/90'
      } disabled:opacity-50`}
    >
      {loading ? '...' : isMember ? t('leaveClub') : t('joinClub')}
    </button>
  )
}
