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

export async function createExam(formData: FormData) {
  const classId = formData.get('classId') as string
  const { supabase, teacherId } = await assertTeacherOwnsClass(classId)

  const title = formData.get('title') as string
  const subject = formData.get('subject') as string
  const examDate = formData.get('examDate') as string
  const maxMarks = formData.get('maxMarks') as string

  await supabase.from('exams').insert({
    class_id: classId,
    title,
    subject: subject || null,
    exam_date: examDate || null,
    max_marks: maxMarks ? parseFloat(maxMarks) : 100,
    created_by: teacherId,
  })

  revalidatePath(`/dashboard/teacher/marks/${classId}`)
}

export async function saveMarks(formData: FormData) {
  const classId = formData.get('classId') as string
  const examId = formData.get('examId') as string
  const { supabase, teacherId } = await assertTeacherOwnsClass(classId)

  const studentIds = formData.getAll('studentId') as string[]

  for (const studentId of studentIds) {
    const marksObtained = formData.get(`marks-${studentId}`) as string
    const grade = formData.get(`grade-${studentId}`) as string

    await supabase.from('marks').upsert(
      {
        exam_id: examId,
        student_id: studentId,
        marks_obtained: marksObtained ? parseFloat(marksObtained) : 0,
        grade: grade || null,
        entered_by: teacherId,
      },
      { onConflict: 'exam_id,student_id' }
    )
  }

  revalidatePath(`/dashboard/teacher/marks/${classId}`)
}