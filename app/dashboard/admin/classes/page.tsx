import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { addClass, deleteClass } from './actions'

export default async function ClassesPage() {
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
    .select('id, full_name')
    .eq('role', 'teacher')
    .order('full_name')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, subject, schedule, room, fee_amount, fee_cycle, is_active, teacher_id, profiles:teacher_id(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to dashboard
          </a>
          <h1 className="text-2xl font-bold mt-2">Manage Classes</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-4">Create New Class</h2>
          <form action={addClass} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
              <input name="name" required placeholder="e.g. Grade 10 - Batch A"
                className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input name="subject" placeholder="e.g. Mathematics"
                className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
              <select name="teacherId" className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="">— No teacher yet —</option>
                {teachers?.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <input name="room" placeholder="e.g. Room 3"
                className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
              <input name="schedule" placeholder="e.g. Mon/Wed/Fri 4:00-5:30 PM"
                className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount</label>
                <input name="feeAmount" type="number" step="0.01" placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Cycle</label>
                <select name="feeCycle" className="w-full rounded-lg border border-gray-300 px-3 py-2">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one_time">One-time</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="bg-blue-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-blue-700">
                Create Class
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-4">All Classes ({classes?.length || 0})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Subject</th>
                  <th className="py-2 pr-4">Teacher</th>
                  <th className="py-2 pr-4">Schedule</th>
                  <th className="py-2 pr-4">Fee</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {classes?.map((c: any) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{c.name}</td>
                    <td className="py-2 pr-4">{c.subject || '—'}</td>
                    <td className="py-2 pr-4">{c.profiles?.full_name || '— Unassigned —'}</td>
                    <td className="py-2 pr-4">{c.schedule || '—'}</td>
                    <td className="py-2 pr-4">₹{c.fee_amount} / {c.fee_cycle}</td>
                    <td className="py-2 pr-4">
                      <form action={async () => {
                        'use server'
                        await deleteClass(c.id)
                      }}>
                        <button type="submit" className="text-red-600 hover:underline text-xs">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {(!classes || classes.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-400">
                      No classes yet. Create one above.
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