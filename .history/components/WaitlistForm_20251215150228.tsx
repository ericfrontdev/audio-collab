'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function WaitlistForm({ locale }: { locale: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic email validation
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    const supabase = createClient()

    const { error } = await supabase.from('waitlist').insert({
      email: email.trim().toLowerCase(),
      locale,
      metadata: {
        user_agent:
          typeof window !== 'undefined' ? window.navigator.userAgent : null,
        timestamp: new Date().toISOString(),
      },
    })

    if (error) {
      // Handle duplicate email error
      if (error.code === '23505') {
        setErrorMessage("You're already on the waitlist!")
        setStatus('error')
      } else {
        setErrorMessage('Something went wrong. Please try again.')
        setStatus('error')
      }
      console.error('Waitlist signup error:', error)
    } else {
      setStatus('success')
      setEmail('')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <CheckCircle2 className="h-5 w-5 text-primary" />
        <p className="text-sm font-medium text-foreground">
          Thanks! You&apos;re on the list. Check your email soon.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-3"
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
          className="flex-1"
          required
        />
        <Button
          type="submit"
          disabled={status === 'loading'}
          size="lg"
          className="whitespace-nowrap"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            'Join Waitlist'
          )}
        </Button>
      </div>

      {status === 'error' && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
    </form>
  )
}
