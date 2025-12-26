'use client'

import { joinProject } from '@/app/actions/projects'
import { useState } from 'react'

export function JoinProjectButton({
  projectId,
  locale
}: {
  projectId: string
  locale: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const result = await joinProject(projectId, locale)

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
      className="w-full px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {loading ? 'Joining...' : 'Join Project'}
    </button>
  )
}
