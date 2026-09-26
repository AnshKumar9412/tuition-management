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

export async function saveAttendance(formData: FormData) {
  const classId = formData.get('classId') as string
  const date = formData.get('date') as string

  const { supabase, teacherId } = await assertTeacherOwnsClass(classId)

  const studentIds = formData.getAll('studentId') as string[]

  for (const studentId of studentIds) {
    const status = formData.get(`status-${studentId}`) as string

    await supabase.from('attendance').upsert(
      {
        student_id: studentId,
        class_id: classId,
        date,
        status,
        marked_by: teacherId,
      },
      { onConflict: 'student_id,class_id,date' }
    )
  }

  revalidatePath(`/dashboard/teacher/attendance/${classId}`)
}