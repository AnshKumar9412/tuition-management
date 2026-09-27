import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createNotice, deleteNotice } from './actions'

export default async function NoticesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const canPost = profile?.role === 'admin' || profile?.role === 'teacher'

  let classes: any[] = []
  if (canPost) {
    const { data } = await supabase.from('classes').select('id, name').order('name')
    classes = data || []
  }

  const { data: notices } = await supabase
    .from('notices')
    .select('id, title, content, audience, created_at, classes:class_id(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to dashboard
          </a>
          <h1 className="text-2xl font-bold mt-2">Notices</h1>
        </div>

        {canPost && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="font-semibold mb-4">Post New Notice</h2>
            <form action={createNotice} className="space-y-3">
              <input name="title" required placeholder="Title"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <textarea name="content" required placeholder="Notice content" rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700">Audience:</label>
                <select name="audience" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
                  <option value="all">Everyone</option>
                  <option value="students">Students only</option>
                  <option value="teachers">Teachers only</option>
                  <option value="class">Specific class</option>
                </select>
                <select name="classId" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
                  <option value="">— Select class (if applicable) —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-700">
                Post Notice
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-4">All Notices ({notices?.length || 0})</h2>
          <div className="space-y-3">
            {notices?.map((n: any) => (
              <div key={n.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{n.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {n.audience === 'class' ? n.classes?.name : n.audience} · {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {canPost && (
                    <form action={async () => {
                      'use server'
                      await deleteNotice(n.id)
                    }}>
                      <button type="submit" className="text-red-600 hover:underline text-xs">
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
            {(!notices || notices.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">No notices yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}