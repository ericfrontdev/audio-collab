'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const locale = (formData.get('locale') as string) || 'en'

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(`/feed`)
}

export async function signup(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const locale = (formData.get('locale') as string) || 'en'

  const email = formData.get('email') as string
  const displayName = formData.get('display_name') as string

  const data = {
    email,
    password: formData.get('password') as string,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
      },
    },
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(`/onboarding`)
}

export async function logout(locale: string = 'en') {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error.message)
    // Still redirect even on error
  }

  revalidatePath('/', 'layout')
  redirect(`/${locale}`)
}

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
