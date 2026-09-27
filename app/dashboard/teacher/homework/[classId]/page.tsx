import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { addHomework, deleteHomework } from './actions'

export default async function HomeworkPage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const { classId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, teacher_id')
    .eq('id', classId)
    .single()

  if (!cls || cls.teacher_id !== user.id) redirect('/dashboard/teacher')

  const { data: homeworkList } = await supabase
    .from('homework')
    .select('id, title, description, due_date, attachment_url, created_at')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <a href="/dashboard/teacher" className="text-sm text-blue-600 hover:underline">
            ← Back to My Classes
          </a>
          <h1 className="text-2xl font-bold mt-2">Homework — {cls.name}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-4">Assign New Homework</h2>
          <form action={addHomework} className="space-y-3">
            <input type="hidden" name="classId" value={classId} />
            <input name="title" required placeholder="Title (e.g. Chapter 5 exercises)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <textarea name="description" placeholder="Description / instructions (optional)" rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700">Due date:</label>
              <input name="dueDate" type="date" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
               <label classname="block text-sm text-grey-700 mb-1">Attach file (PDF, image, etc. - optional)</label>
               <input name="file" type="file" accept=".pdf,.doc,.docx,.png,.jpeg"
                 class name="w-full text-sm border border-grey-300 rounded-lg px-3 py-2" />
            </div>
            <button type="submit" className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-700">
              Assign Homework
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-4">All Homework ({homeworkList?.length || 0})</h2>
          <div className="space-y-3">
            {homeworkList?.map((h) => (
              <div key={h.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{h.title}</p>
                    {h.description && <p className="text-sm text-gray-600 mt-1">{h.description}</p>}
                    {h.due_date && <p className="text-xs text-gray-400 mt-2">Due: {h.due_date}</p>}
                    {h.attachment_url && (
                     <a href={h.attachment_url} target="_blank" rel="noopener noreferrer"
                     className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                   📎 View Attachment
  </a>
)}
                  </div>
                  <form action={async () => {
                    'use server'
                    await deleteHomework(h.id, classId)
                  }}>
                    <button type="submit" className="text-red-600 hover:underline text-xs">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {(!homeworkList || homeworkList.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">No homework assigned yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}