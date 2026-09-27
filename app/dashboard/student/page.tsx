import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReportCardDownloadButton } from './report-card/ReportCardPDF'
import { MarksBarChart, AttendancePieChart } from './ProgressCharts'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') redirect('/dashboard')

  // Classes the student is enrolled in
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('classes:class_id(id, name, subject)')
    .eq('student_id', user.id)
    .eq('is_active', true)

  // Recent attendance (last 10)
  const { data: attendance } = await supabase
    .from('attendance')
    .select('date, status, classes:class_id(name)')
    .eq('student_id', user.id)
    .order('date', { ascending: false })
    .limit(10)

  // Marks
  const { data: marks } = await supabase
    .from('marks')
    .select('marks_obtained, grade, exams:exam_id(title, max_marks, subject, exam_date)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Attendance summary for report card
  const { data: allAttendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('student_id', user.id)

  const attendanceSummary = {
    present: allAttendance?.filter((a) => a.status === 'present' || a.status === 'late').length || 0,
    total: allAttendance?.length || 0,
  }

  // Shape data for charts
  const marksChartData = (marks || [])
    .filter((m: any) => m.exams?.max_marks)
    .map((m: any) => ({
      name: m.exams?.title || 'Exam',
      percentage: Math.round((m.marks_obtained / m.exams.max_marks) * 100),
    }))
    .reverse() // show oldest to newest, left to right

  const attendanceCounts = { Present: 0, Absent: 0, Late: 0, Excused: 0 }
  allAttendance?.forEach((a: any) => {
    if (a.status === 'present') attendanceCounts.Present++
    else if (a.status === 'absent') attendanceCounts.Absent++
    else if (a.status === 'late') attendanceCounts.Late++
    else if (a.status === 'excused') attendanceCounts.Excused++
  })
  const attendanceChartData = Object.entries(attendanceCounts)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)

  // Homework for enrolled classes
  const classIds = enrollments?.map((e: any) => e.classes?.id).filter(Boolean) || []
  const { data: homeworkList } = classIds.length > 0
    ? await supabase
        .from('homework')
        .select('title, description, due_date, classes:class_id(name)')
        .in('class_id', classIds)
        .order('created_at', { ascending: false })
        .limit(10)
    : { data: [] }

  // Fee invoices
  const { data: invoices } = await supabase
    .from('fee_invoices')
    .select('period_label, amount_due, amount_paid, status, due_date')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  const statusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    unpaid: 'bg-gray-100 text-gray-600',
    overdue: 'bg-red-100 text-red-700',
  }

  const attendanceColors: Record<string, string> = {
    present: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-yellow-100 text-yellow-700',
    excused: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to dashboard
          </a>
          <h1 className="text-2xl font-bold mt-2">My Progress</h1>
        </div>
        <div>
          <ReportCardDownloadButton
            studentName={profile.full_name}
            marks={(marks || []).map((m: any) => ({
              examTitle: m.exams?.title || '',
              subject: m.exams?.subject || '',
              marksObtained: m.marks_obtained,
              maxMarks: m.exams?.max_marks || 100,
              grade: m.grade,
            }))}
            attendanceSummary={attendanceSummary}
            generatedDate={new Date().toLocaleDateString()}
          />
        </div>

        {/* My classes */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-3">My Classes</h2>
          <div className="flex flex-wrap gap-2">
            {enrollments?.map((e: any, i: number) => (
              <span key={i} className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm">
                {e.classes?.name}
              </span>
            ))}
            {(!enrollments || enrollments.length === 0) && (
              <p className="text-gray-400 text-sm">You're not enrolled in any classes yet.</p>
            )}
          </div>
        </div>
        {/* Progress Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="font-semibold mb-3">Marks Trend</h2>
            <MarksBarChart data={marksChartData} />
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="font-semibold mb-3">Attendance Breakdown</h2>
            <AttendancePieChart data={attendanceChartData} />
          </div>
        </div>

        {/* Attendance */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-3">Recent Attendance</h2>
          <div className="space-y-2">
            {attendance?.map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                <span>{a.date} · {a.classes?.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${attendanceColors[a.status]}`}>
                  {a.status}
                </span>
              </div>
            ))}
            {(!attendance || attendance.length === 0) && (
              <p className="text-gray-400 text-sm">No attendance records yet.</p>
            )}
          </div>
        </div>

        {/* Marks */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-3">Marks & Test Reports</h2>
          <div className="space-y-2">
            {marks?.map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                <span>{m.exams?.title} {m.exams?.subject ? `(${m.exams.subject})` : ''}</span>
                <span className="font-medium">
                  {m.marks_obtained} / {m.exams?.max_marks} {m.grade ? `· ${m.grade}` : ''}
                </span>
              </div>
            ))}
            {(!marks || marks.length === 0) && (
              <p className="text-gray-400 text-sm">No marks entered yet.</p>
            )}
          </div>
        </div>

     {/* Homework */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-3">Homework</h2>
          <div className="space-y-2">
            {homeworkList?.map((h: any, i: number) => (
              <div key={i} className="border-b border-gray-100 pb-2 text-sm">
                <p className="font-medium">{h.title} <span className="text-gray-400 font-normal">· {h.classes?.name}</span></p>
                {h.description && <p className="text-gray-600 mt-0.5">{h.description}</p>}
                {h.due_date && <p className="text-xs text-gray-400 mt-0.5">Due: {h.due_date}</p>}
              </div>
            ))}
            {(!homeworkList || homeworkList.length === 0) && (
              <p className="text-gray-400 text-sm">No homework assigned yet.</p>
            )}
          </div>
        </div>


        {/* Fees */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-3">Fee Status</h2>
          <div className="space-y-2">
            {invoices?.map((inv: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                <span>{inv.period_label} {inv.due_date ? `· Due ${inv.due_date}` : ''}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status]}`}>
                  ₹{inv.amount_paid}/₹{inv.amount_due} · {inv.status}
                </span>
              </div>
            ))}
            {(!invoices || invoices.length === 0) && (
              <p className="text-gray-400 text-sm">No fee records yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}