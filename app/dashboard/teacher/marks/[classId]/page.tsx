import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createExam, saveMarks } from './actions'

export default async function MarksPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>
  searchParams: Promise<{ exam?: string }>
}) {
  const { classId } = await params
  const { exam: selectedExamId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, teacher_id')
    .eq('id', classId)
    .single()

  if (!cls || cls.teacher_id !== user.id) redirect('/dashboard/teacher')

  const { data: exams } = await supabase
    .from('exams')
    .select('id, title, subject, exam_date, max_marks')
    .eq('class_id', classId)
    .order('exam_date', { ascending: false })

  const activeExamId = selectedExamId || exams?.[0]?.id

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, students:student_id(id, full_name)')
    .eq('class_id', classId)
    .eq('is_active', true)

  let existingMarks: any[] = []
  if (activeExamId) {
    const { data } = await supabase
      .from('marks')
      .select('student_id, marks_obtained, grade')
      .eq('exam_id', activeExamId)
    existingMarks = data || []
  }

  const marksMap = new Map(
    existingMarks.map((m) => [m.student_id, m])
  )

  const activeExam = exams?.find((e) => e.id === activeExamId)

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <a href="/dashboard/teacher" className="text-sm text-blue-600 hover:underline">
            ← Back to My Classes
          </a>
          <h1 className="text-2xl font-bold mt-2">Marks — {cls.name}</h1>
        </div>

        {/* Create new exam */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-4">Create New Exam / Test</h2>
          <form action={createExam} className="grid grid-cols-2 gap-3">
            <input type="hidden" name="classId" value={classId} />
            <input name="title" required placeholder="Exam title (e.g. Unit Test 1)"
              className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input name="subject" placeholder="Subject"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input name="examDate" type="date"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input name="maxMarks" type="number" placeholder="Max marks (default 100)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <button type="submit" className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">
              Create Exam
            </button>
          </form>
        </div>

        {/* Select exam */}
        {exams && exams.length > 0 && (
          <form method="get" className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Exam:</label>
            <select name="exam" defaultValue={activeExamId} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm flex-1">
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} {e.exam_date ? `(${e.exam_date})` : ''}
                </option>
              ))}
            </select>
            <button type="submit" className="text-sm bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-1.5">
              Load
            </button>
          </form>
        )}

        {/* Marks entry */}
        {activeExam && (
          <form action={saveMarks} className="bg-white rounded-2xl shadow-md p-6 space-y-3">
            <input type="hidden" name="classId" value={classId} />
            <input type="hidden" name="examId" value={activeExam.id} />
            <p className="text-sm text-gray-500 mb-2">Max marks: {activeExam.max_marks}</p>

            {enrollments?.map((e: any) => {
              const student = e.students
              const existing = marksMap.get(student.id)
              return (
                <div key={student.id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <input type="hidden" name="studentId" value={student.id} />
                  <span className="font-medium flex-1">{student.full_name}</span>
                  <input
                    type="number"
                    name={`marks-${student.id}`}
                    defaultValue={existing?.marks_obtained ?? ''}
                    placeholder="Marks"
                    step="0.01"
                    className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    name={`grade-${student.id}`}
                    defaultValue={existing?.grade ?? ''}
                    placeholder="Grade"
                    className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
              )
            })}

            {(!enrollments || enrollments.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">No students enrolled yet.</p>
            )}

            {enrollments && enrollments.length > 0 && (
              <button type="submit" className="w-full bg-green-600 text-white rounded-lg py-2 font-medium hover:bg-green-700 mt-4">
                Save Marks
              </button>
            )}
          </form>
        )}

        {(!exams || exams.length === 0) && (
          <p className="text-gray-400 text-sm text-center">
            No exams created yet. Create one above.
          </p>
        )}
      </div>
    </div>
  )
}