'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertTeacherOwnsClass(classId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const { data: cls } = await supabase
    .from('classes')
    .select('teacher_id')
    .eq('id', classId)
    .single()

  if (!cls || cls.teacher_id !== user.id) {
    throw new Error('Not authorized for this class')
  }

  return { supabase, teacherId: user.id }
}

export async function addHomework(formData: FormData) {
  const classId = formData.get('classId') as string
  const { supabase, teacherId } = await assertTeacherOwnsClass(classId)

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const dueDate = formData.get('dueDate') as string

  const { error } = await supabase.from('homework').insert({
    class_id: classId,
    title,
    description: description || null,
    due_date: dueDate || null,
    assigned_by: teacherId,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/teacher/homework/${classId}`)
}

export async function deleteHomework(homeworkId: string, classId: string) {
  await assertTeacherOwnsClass(classId)
  const supabase = await createClient()
  await supabase.from('homework').delete().eq('id', homeworkId)
  revalidatePath(`/dashboard/teacher/homework/${classId}`)
}