'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
}

export async function addStudent(formData: FormData) {
  await assertAdmin()

  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const phone = formData.get('phone') as string

  const admin = createAdminClient()

  // Create the login account
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email confirmation since admin is adding them
    user_metadata: {
      full_name: fullName,
      role: 'student',
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  // Update phone number on the profile (created automatically by the trigger)
  if (data.user && phone) {
    await admin
      .from('profiles')
      .update({ phone })
      .eq('id', data.user.id)
  }

  revalidatePath('/dashboard/admin/students')
}

export async function deleteStudent(studentId: string) {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.auth.admin.deleteUser(studentId)
  revalidatePath('/dashboard/admin/students')
}