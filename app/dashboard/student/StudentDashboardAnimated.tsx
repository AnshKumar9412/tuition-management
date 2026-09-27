'use client'

import { motion } from 'framer-motion'
import { ReportCardDownloadButton } from './report-card/ReportCardPDF'
import { MarksBarChart, AttendancePieChart } from './ProgressCharts'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

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

export function StudentDashboardAnimated({
  profile,
  enrollments,
  attendance,
  marks,
  invoices,
  homeworkList,
  attendanceSummary,
  marksChartData,
  attendanceChartData,
}: any) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="max-w-3xl mx-auto space-y-6"
      >
        <motion.div variants={itemVariants}>
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to dashboard
          </a>
          <h1 className="text-2xl font-bold mt-2">My Progress</h1>
        </motion.div>

        <motion.div variants={itemVariants}>
          <ReportCardDownloadButton
            studentName={profile.full_name}
            marks={marks.map((m: any) => ({
              examTitle: m.exams?.title || '',
              subject: m.exams?.subject || '',
              marksObtained: m.marks_obtained,
              maxMarks: m.exams?.max_marks || 100,
              grade: m.grade,
            }))}
            attendanceSummary={attendanceSummary}
            generatedDate={new Date().toLocaleDateString()}
          />
        </motion.div>

        {/* My classes */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-3">My Classes</h2>
          <div className="flex flex-wrap gap-2">
            {enrollments.map((e: any, i: number) => (
              <motion.span
                key={i}
                whileHover={{ scale: 1.05 }}
                className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-sm"
              >
                {e.classes?.name}
              </motion.span>
            ))}
            {enrollments.length === 0 && (
              <p className="text-gray-400 text-sm">You're not enrolled in any classes yet.</p>
            )}
          </div>
        </motion.div>

        {/* Progress Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="font-semibold mb-3">Marks Trend</h2>
            <MarksBarChart data={marksChartData} />
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="font-semibold mb-3">Attendance Breakdown</h2>
            <AttendancePieChart data={attendanceChartData} />
          </div>
        </motion.div>

        {/* Attendance */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-3">Recent Attendance</h2>
          <div className="space-y-2">
            {attendance.map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                <span>{a.date} · {a.classes?.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${attendanceColors[a.status]}`}>
                  {a.status}
                </span>
              </div>
            ))}
            {attendance.length === 0 && (
              <p className="text-gray-400 text-sm">No attendance records yet.</p>
            )}
          </div>
        </motion.div>

        {/* Marks */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-3">Marks & Test Reports</h2>
          <div className="space-y-2">
            {marks.map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                <span>{m.exams?.title} {m.exams?.subject ? `(${m.exams.subject})` : ''}</span>
                <span className="font-medium">
                  {m.marks_obtained} / {m.exams?.max_marks} {m.grade ? `· ${m.grade}` : ''}
                </span>
              </div>
            ))}
            {marks.length === 0 && (
              <p className="text-gray-400 text-sm">No marks entered yet.</p>
            )}
          </div>
        </motion.div>

        {/* Homework */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-3">Homework</h2>
          <div className="space-y-2">
            {homeworkList.map((h: any, i: number) => (
              <div key={i} className="border-b border-gray-100 pb-2 text-sm">
                <p className="font-medium">{h.title} <span className="text-gray-400 font-normal">· {h.classes?.name}</span></p>
                {h.description && <p className="text-gray-600 mt-0.5">{h.description}</p>}
                {h.due_date && <p className="text-xs text-gray-400 mt-0.5">Due: {h.due_date}</p>}
{h.attachment_url && (
  <a href={h.attachment_url} target="_blank" rel="noopener noreferrer"
    className="text-blue-600 hover:underline text-xs mt-1 inline-block">
    📎 Download Attachment
  </a>
)}
              </div>
            ))}
            {homeworkList.length === 0 && (
              <p className="text-gray-400 text-sm">No homework assigned yet.</p>
            )}
          </div>
        </motion.div>

        {/* Fees */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-3">Fee Status</h2>
          <div className="space-y-2">
            {invoices.map((inv: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                <span>{inv.period_label} {inv.due_date ? `· Due ${inv.due_date}` : ''}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status]}`}>
                  ₹{inv.amount_paid}/₹{inv.amount_due} · {inv.status}
                </span>
              </div>
            ))}
            {invoices.length === 0 && (
              <p className="text-gray-400 text-sm">No fee records yet.</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}