import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">
          No profile found. Please contact your administrator.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-2xl font-bold mb-1">
            Welcome, {profile.full_name} 👋
          </h1>
          <p className="text-gray-500 mb-6">
            Role: <span className="font-medium capitalize">{profile.role}</span>
          </p>

         {profile.role === 'admin' && (
  <div>
    <h2 className="text-lg font-semibold mb-4">Admin Dashboard</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <a href="/dashboard/admin/students" className="bg-blue-50 hover:bg-blue-100 rounded-xl p-4 text-center transition">
        <p className="font-medium text-blue-700">Students</p>
      </a>
      <a href="/dashboard/admin/teachers" className="bg-green-50 hover:bg-green-100 rounded-xl p-4 text-center transition">
        <p className="font-medium text-green-700">Teachers</p>
      </a>
      <a href="/dashboard/admin/classes" className="bg-purple-50 hover:bg-purple-100 rounded-xl p-4 text-center transition">
        <p className="font-medium text-purple-700">Classes</p>
      </a>
      <a href="/dashboard/admin/enrollments" className="bg-amber-50 hover:bg-amber-100 rounded-xl p-4 text-center transition">
        <p className="font-medium text-amber-700">Enrollments</p>
      </a>
    </div>
  </div>
)}
          {profile.role === 'teacher' && (
  <div>
    <h2 className="text-lg font-semibold mb-4">Teacher Dashboard</h2>
    <a href="/dashboard/teacher" className="bg-blue-50 hover:bg-blue-100 rounded-xl p-4 inline-block transition">
      <p className="font-medium text-blue-700">Go to My Classes →</p>
    </a>
  </div>
)}
          {profile.role === 'student' && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Student Dashboard</h2>
              <p className="text-gray-600">
                View your attendance, marks, fees, and homework here.
              </p>
            </div>
          )}

          <form action="/auth/signout" method="post" className="mt-8">
            <button
              type="submit"
              className="text-sm text-red-600 hover:underline"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}