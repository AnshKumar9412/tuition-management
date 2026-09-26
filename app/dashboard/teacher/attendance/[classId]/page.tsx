import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { saveAttendance } from './actions'

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>
  searchParams: Promise<{ date?: string }>
}) {
  const { classId } = await params
  const { date } = await searchParams
  const selectedDate = date || new Date().toISOString().split('T')[0]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, teacher_id')
    .eq('id', classId)
    .single()

  if (!cls || cls.teacher_id !== user.id) redirect('/dashboard/teacher')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, students:student_id(id, full_name)')
    .eq('class_id', classId)
    .eq('is_active', true)

  const { data: existingAttendance } = await supabase
    .from('attendance')
    .select('student_id, status')
    .eq('class_id', classId)
    .eq('date', selectedDate)

  const attendanceMap = new Map(
    existingAttendance?.map((a) => [a.student_id, a.status]) || []
  )

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <a href="/dashboard/teacher" className="text-sm text-blue-600 hover:underline">
            ← Back to My Classes
          </a>
          <h1 className="text-2xl font-bold mt-2">Attendance — {cls.name}</h1>
        </div>

        <form method="get" className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Date:</label>
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button type="submit" className="text-sm bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-1.5">
            Load
          </button>
        </form>

        <form action={saveAttendance} className="bg-white rounded-2xl shadow-md p-6 space-y-3">
          <input type="hidden" name="classId" value={classId} />
          <input type="hidden" name="date" value={selectedDate} />

          {enrollments?.map((e: any) => {
            const student = e.students
            const currentStatus = attendanceMap.get(student.id) || 'present'
            return (
              <div key={student.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                <input type="hidden" name="studentId" value={student.id} />
                <span className="font-medium">{student.full_name}</span>
                <select
                  name={`status-${student.id}`}
                  defaultValue={currentStatus}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>
            )
          })}

          {(!enrollments || enrollments.length === 0) && (
            <p className="text-gray-400 text-sm text-center py-4">
              No students enrolled in this class yet.
            </p>
          )}

          {enrollments && enrollments.length > 0 && (
            <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 mt-4">
              Save Attendance
            </button>
          )}
        </form>
      </div>
    </div>
  )
}