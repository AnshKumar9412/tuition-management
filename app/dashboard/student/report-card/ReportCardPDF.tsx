'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  title: { fontSize: 20, marginBottom: 4, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginBottom: 20, color: '#555' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, marginBottom: 8, fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottom: '0.5px solid #eee' },
  label: { flex: 2 },
  value: { flex: 1, textAlign: 'right' },
  summaryBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f5f5f5', padding: 10, borderRadius: 4, marginTop: 10 },
})

type ReportCardProps = {
  studentName: string
  marks: { examTitle: string; subject: string; marksObtained: number; maxMarks: number; grade: string | null }[]
  attendanceSummary: { present: number; total: number }
  generatedDate: string
}

function ReportCardDocument({ studentName, marks, attendanceSummary, generatedDate }: ReportCardProps) {
  const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0)
  const totalMax = marks.reduce((sum, m) => sum + m.maxMarks, 0)
  const overallPercent = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0'
  const attendancePercent = attendanceSummary.total > 0
    ? ((attendanceSummary.present / attendanceSummary.total) * 100).toFixed(1)
    : '0'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Report Card</Text>
        <Text style={styles.subtitle}>{studentName} · Generated on {generatedDate}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Marks & Test Reports</Text>
          {marks.map((m, i) => (
            <View style={styles.row} key={i}>
              <Text style={styles.label}>{m.examTitle} {m.subject ? `(${m.subject})` : ''}</Text>
              <Text style={styles.value}>{m.marksObtained} / {m.maxMarks} {m.grade ? `· ${m.grade}` : ''}</Text>
            </View>
          ))}
          {marks.length === 0 && <Text>No marks recorded.</Text>}
        </View>

        <View style={styles.summaryBox}>
          <Text>Overall Percentage: {overallPercent}%</Text>
          <Text>Attendance: {attendancePercent}% ({attendanceSummary.present}/{attendanceSummary.total} days)</Text>
        </View>
      </Page>
    </Document>
  )
}

export function ReportCardDownloadButton(props: ReportCardProps) {
  return (
    <PDFDownloadLink
      document={<ReportCardDocument {...props} />}
      fileName={`report-card-${props.studentName.replace(/\s+/g, '-')}.pdf`}
    >
      {({ loading }) => (
        <button className="bg-blue-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Preparing PDF...' : '⬇ Download Report Card (PDF)'}
        </button>
      )}
    </PDFDownloadLink>
  )
}