/**
 * Upload Progress Bar
 *
 * Displays upload progress with percentage and animated bar.
 */

export interface UploadProgressBarProps {
  progress: number
  uploadingLabel: string
}

export function UploadProgressBar({ progress, uploadingLabel }: UploadProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{uploadingLabel}</span>
        <span className="text-white">{progress}%</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
