import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { enrollStudent, removeEnrollment } from './actions'

export default async function EnrollmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')
    .order('full_name')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .order('name')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, enrolled_on, is_active, students:student_id(full_name), classes:class_id(name)')
    .order('enrolled_on', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to dashboard
          </a>
          <h1 className="text-2xl font-bold mt-2">Manage Enrollments</h1>
          <p className="text-gray-500 text-sm mt-1">
            Assign students to classes.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-4">Enroll a Student</h2>
          <form action={enrollStudent} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select name="studentId" required className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="">— Select student —</option>
                {students?.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select name="classId" required className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="">— Select class —</option>
                {classes?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <button type="submit" className="bg-blue-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-blue-700 w-full">
                Enroll
              </button>
            </div>
          </form>
          {(!students || students.length === 0) && (
            <p className="text-sm text-amber-600 mt-3">No students yet — add one first.</p>
          )}
          {(!classes || classes.length === 0) && (
            <p className="text-sm text-amber-600 mt-1">No classes yet — create one first.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-4">All Enrollments ({enrollments?.length || 0})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Class</th>
                  <th className="py-2 pr-4">Enrolled On</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {enrollments?.map((e: any) => (
                  <tr key={e.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{e.students?.full_name}</td>
                    <td className="py-2 pr-4">{e.classes?.name}</td>
                    <td className="py-2 pr-4">{e.enrolled_on}</td>
                    <td className="py-2 pr-4">
                      <form action={async () => {
                        'use server'
                        await removeEnrollment(e.id)
                      }}>
                        <button type="submit" className="text-red-600 hover:underline text-xs">
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {(!enrollments || enrollments.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      No enrollments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}