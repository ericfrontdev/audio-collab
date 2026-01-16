'use client'

interface FXToggleProps {
  label: string
  enabled: boolean
  onChange: (enabled: boolean) => void
  color?: string
}

export function FXToggle({
  label,
  enabled,
  onChange,
  color = 'purple'
}: FXToggleProps) {
  const colorClasses = {
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    cyan: 'bg-cyan-500',
    green: 'bg-green-500'
  }

  const bgColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.purple

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => onChange(!enabled)}
        className={`
          relative w-14 h-8 rounded-full border border-gray-600
          transition-colors duration-200
          ${enabled ? bgColor : 'bg-gray-700'}
        `}
      >
        <div
          className={`
            absolute top-1 w-6 h-6 rounded-full bg-gray-900 border border-gray-600
            transition-all duration-200
            ${enabled ? 'left-7' : 'left-1'}
          `}
        />
      </button>
      <div className="text-xs text-gray-400 uppercase tracking-wider text-center">
        {label}
      </div>
    </div>
  )
}
