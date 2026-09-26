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

export async function addClass(formData: FormData) {
  const supabase = await assertAdmin()

  const name = formData.get('name') as string
  const subject = formData.get('subject') as string
  const teacherId = formData.get('teacherId') as string
  const schedule = formData.get('schedule') as string
  const room = formData.get('room') as string
  const feeAmount = formData.get('feeAmount') as string
  const feeCycle = formData.get('feeCycle') as string

  const { error } = await supabase.from('classes').insert({
    name,
    subject: subject || null,
    teacher_id: teacherId || null,
    schedule: schedule || null,
    room: room || null,
    fee_amount: feeAmount ? parseFloat(feeAmount) : 0,
    fee_cycle: feeCycle || 'monthly',
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/admin/classes')
}

export async function deleteClass(classId: string) {
  const supabase = await assertAdmin()
  await supabase.from('classes').delete().eq('id', classId)
  revalidatePath('/dashboard/admin/classes')
}