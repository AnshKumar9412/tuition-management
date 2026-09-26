import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { addTeacher, deleteTeacher } from './actions'

export default async function TeachersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: teachers } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_active, created_at')
    .eq('role', 'teacher')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to dashboard
          </a>
          <h1 className="text-2xl font-bold mt-2">Manage Teachers</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-4">Add New Teacher</h2>
          <form action={addTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="fullName" required className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" required className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" required minLength={6} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="bg-blue-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-blue-700">
                Add Teacher
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-4">All Teachers ({teachers?.length || 0})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {teachers?.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{t.full_name}</td>
                    <td className="py-2 pr-4">{t.email}</td>
                    <td className="py-2 pr-4">{t.phone || '—'}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <form action={async () => {
                        'use server'
                        await deleteTeacher(t.id)
                      }}>
                        <button type="submit" className="text-red-600 hover:underline text-xs">
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {(!teachers || teachers.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400">
                      No teachers yet. Add one above.
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