'use client'

import { Check, Play } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface RetakeActivateButtonProps {
  isActive: boolean
  onActivate: () => void
  disabled?: boolean
}

export function RetakeActivateButton({
  isActive,
  onActivate,
  disabled = false,
}: RetakeActivateButtonProps) {
  const t = useTranslations('studio.retakes')

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onActivate()
      }}
      disabled={disabled}
      className={`
        w-6 h-6 flex items-center justify-center rounded-sm
        transition-all duration-200 ease-in-out
        outline outline-1 outline-black
        ${
          isActive
            ? 'bg-[#9363f7] text-white shadow-lg shadow-[#9363f7]/50 scale-105 hover:bg-[#7c4fd9]'
            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 hover:scale-110'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
      `}
      title={isActive ? t('deactivate') : t('activate')}
    >
      {isActive ? (
        <Check className="w-3.5 h-3.5 transition-transform duration-200" />
      ) : (
        <Play className="w-3.5 h-3.5 fill-current transition-transform duration-200" />
      )}
    </button>
  )
}
