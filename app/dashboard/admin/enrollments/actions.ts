'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Not authorized')

  return supabase
}

export async function enrollStudent(formData: FormData) {
  const supabase = await assertAdmin()

  const studentId = formData.get('studentId') as string
  const classId = formData.get('classId') as string

  const { error } = await supabase.from('enrollments').insert({
    student_id: studentId,
    class_id: classId,
  })

  if (error) {
    // Likely a duplicate enrollment (unique constraint) — surface a clean message
    if (error.code === '23505') {
      throw new Error('This student is already enrolled in this class.')
    }
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/admin/enrollments')
}

export async function removeEnrollment(enrollmentId: string) {
  const supabase = await assertAdmin()
  await supabase.from('enrollments').delete().eq('id', enrollmentId)
  revalidatePath('/dashboard/admin/enrollments')
}