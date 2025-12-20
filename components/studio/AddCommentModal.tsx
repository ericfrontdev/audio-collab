'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import Image from 'next/image';

interface AddCommentModalProps {
  isOpen: boolean;
  position: { x: number; y: number };
  timestamp: number;
  userAvatar?: string | null;
  onSubmit: (text: string, timestamp: number) => void;
  onClose: () => void;
}

export function AddCommentModal({
  isOpen,
  position,
  timestamp,
  userAvatar,
  onSubmit,
  onClose,
}: AddCommentModalProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await onSubmit(comment.trim(), timestamp);
    setComment('');
    setIsSubmitting(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-3 w-96"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -100%)',
          marginTop: '-8px',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt="Your avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                ?
              </div>
            )}
          </div>

          {/* Input */}
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            className="flex-1 bg-zinc-800 text-white text-sm px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            autoFocus
            maxLength={1000}
          />

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!comment.trim() || isSubmitting}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary hover:bg-primary/90 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </>
  );
}
