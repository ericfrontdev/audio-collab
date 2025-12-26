'use client'

import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { ProjectChat } from './ProjectChat'
import { StudioView } from '../studio/StudioView'

interface ProjectWorkspaceProps {
  projectId: string
  currentUserId?: string
}

export function ProjectWorkspace({ projectId, currentUserId }: ProjectWorkspaceProps) {
  const [isChatOpen, setIsChatOpen] = useState(true)

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Main studio area */}
      <div className="flex-1 overflow-hidden">
        <StudioView projectId={projectId} />
      </div>

      {/* Chat sidebar */}
      {isChatOpen ? (
        <div className="w-96 flex-shrink-0 border-l border-zinc-800 flex flex-col">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-white">Chat du projet</h2>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded hover:bg-zinc-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat content */}
          <div className="flex-1 overflow-hidden">
            <ProjectChat projectId={projectId} currentUserId={currentUserId} />
          </div>
        </div>
      ) : (
        /* Collapsed chat button */
        <div className="flex-shrink-0 border-l border-zinc-800">
          <button
            onClick={() => setIsChatOpen(true)}
            className="p-4 hover:bg-zinc-900 text-gray-400 hover:text-white transition-colors h-full"
            title="Ouvrir le chat"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  )
}
