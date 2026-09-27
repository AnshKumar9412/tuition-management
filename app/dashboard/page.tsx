import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardAnimatedContent } from './DashboardAnimated'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">
          No profile found. Please contact your administrator.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <DashboardAnimatedContent profile={profile} />
      </div>
    </div>
  )
}