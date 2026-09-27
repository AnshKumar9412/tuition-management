import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentDashboardAnimated } from './StudentDashboardAnimated'

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

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('classes:class_id(id, name, subject)')
    .eq('student_id', user.id)
    .eq('is_active', true)

  const { data: attendance } = await supabase
    .from('attendance')
    .select('date, status, classes:class_id(name)')
    .eq('student_id', user.id)
    .order('date', { ascending: false })
    .limit(10)

  const { data: marks } = await supabase
    .from('marks')
    .select('marks_obtained, grade, exams:exam_id(title, max_marks, subject, exam_date)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: invoices } = await supabase
    .from('fee_invoices')
    .select('period_label, amount_due, amount_paid, status, due_date')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  const classIds = enrollments?.map((e: any) => e.classes?.id).filter(Boolean) || []
  const { data: homeworkList } = classIds.length > 0
    ? await supabase
        .from('homework')
        .select('title, description, due_date, attachment_url, classes:class_id(name)')
        .in('class_id', classIds)
        .order('created_at', { ascending: false })
        .limit(10)
    : { data: [] }

  const { data: allAttendance } = await supabase
    .from('attendance')
    .select('status')
    .eq('student_id', user.id)

  const attendanceSummary = {
    present: allAttendance?.filter((a) => a.status === 'present' || a.status === 'late').length || 0,
    total: allAttendance?.length || 0,
  }

  const marksChartData = (marks || [])
    .filter((m: any) => m.exams?.max_marks)
    .map((m: any) => ({
      name: m.exams?.title || 'Exam',
      percentage: Math.round((m.marks_obtained / m.exams.max_marks) * 100),
    }))
    .reverse()

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

  return (
    <StudentDashboardAnimated
      profile={profile}
      enrollments={enrollments || []}
      attendance={attendance || []}
      marks={marks || []}
      invoices={invoices || []}
      homeworkList={homeworkList || []}
      attendanceSummary={attendanceSummary}
      marksChartData={marksChartData}
      attendanceChartData={attendanceChartData}
    />
  )
}