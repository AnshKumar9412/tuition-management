'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdminOrTeacher() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'teacher') {
    throw new Error('Not authorized')
  }

  return { supabase, userId: user.id }
}

export async function createNotice(formData: FormData) {
  const { supabase, userId } = await assertAdminOrTeacher()

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const audience = formData.get('audience') as string
  const classId = formData.get('classId') as string

  const { error } = await supabase.from('notices').insert({
    title,
    content,
    audience,
    class_id: audience === 'class' ? classId : null,
    created_by: userId,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/notices')
}

export async function deleteNotice(noticeId: string) {
  await assertAdminOrTeacher()
  const supabase = await createClient()
  await supabase.from('notices').delete().eq('id', noticeId)
  revalidatePath('/dashboard/notices')
}