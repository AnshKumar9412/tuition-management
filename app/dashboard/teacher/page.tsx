import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'teacher') redirect('/dashboard')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, subject, schedule')
    .eq('teacher_id', user.id)
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to dashboard
          </a>
          <h1 className="text-2xl font-bold mt-2">My Classes</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes?.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl shadow-md p-5">
              <h2 className="font-semibold text-lg">{c.name}</h2>
              <p className="text-gray-500 text-sm mb-4">{c.subject} · {c.schedule || 'No schedule set'}</p>
              <div className="flex gap-3">
                <a href={`/dashboard/teacher/attendance/${c.id}`}
                  className="text-sm bg-blue-50 text-blue-700 rounded-lg px-3 py-1.5 hover:bg-blue-100">
                  Mark Attendance
                </a>
                <a href={`/dashboard/teacher/marks/${c.id}`}
                  className="text-sm bg-green-50 text-green-700 rounded-lg px-3 py-1.5 hover:bg-green-100">
                  Enter Marks
                </a>
<a href={`/dashboard/teacher/homework/${c.id}`}
  className="text-sm bg-amber-50 text-amber-700 rounded-lg px-3 py-1.5 hover:bg-amber-100">
  Homework
</a>
              </div>
            </div>
          ))}
          {(!classes || classes.length === 0) && (
            <p className="text-gray-400 text-sm col-span-2">
              No classes assigned to you yet. Ask your admin to assign you to a class.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}