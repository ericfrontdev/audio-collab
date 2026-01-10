'use client'

import { X } from 'lucide-react'
import { CompedSection } from '@/lib/types/studio'
import { useTranslations } from 'next-intl'

interface CompedSectionOverlayProps {
  sections: CompedSection[]
  duration: number
  trackColor: string
  onDelete?: (sectionId: string) => void
  readOnly?: boolean
}

export function CompedSectionOverlay({
  sections,
  duration,
  trackColor,
  onDelete,
  readOnly = false,
}: CompedSectionOverlayProps) {
  const t = useTranslations('studio.comping')

  if (!sections || sections.length === 0 || duration === 0) {
    return null
  }

  return (
    <>
      {sections.map((section) => {
        const leftPercent = (section.start_time / duration) * 100
        const widthPercent = ((section.end_time - section.start_time) / duration) * 100

        return (
          <div
            key={section.id}
            className="absolute top-0 bottom-0 group transition-all duration-200 hover:brightness-110 hover:scale-[1.02] origin-center"
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              backgroundColor: `${trackColor}40`, // 25% opacity
              borderLeft: `3px solid ${trackColor}`,
              borderRight: `3px solid ${trackColor}`,
              borderTop: `1px solid ${trackColor}60`,
              borderBottom: `1px solid ${trackColor}60`,
              pointerEvents: 'auto',
              boxShadow: `0 0 8px ${trackColor}30`,
            }}
          >
            {/* Delete button (show on hover) */}
            {!readOnly && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(section.id)
                }}
                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-sm bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-700 hover:scale-110 shadow-lg z-30 !cursor-pointer"
                title={t('deleteSection')}
              >
                <X className="w-3.5 h-3.5 pointer-events-none" />
              </button>
            )}

            {/* Visual glow effect on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-200"
              style={{
                boxShadow: `inset 0 0 30px ${trackColor}`,
              }}
            />

            {/* Subtle pulse animation */}
            <div
              className="absolute inset-0 opacity-10 animate-pulse"
              style={{
                background: `linear-gradient(90deg, transparent, ${trackColor}40, transparent)`,
              }}
            />
          </div>
        )
      })}
    </>
  )
}
