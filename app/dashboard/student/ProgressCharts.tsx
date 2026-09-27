'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

type MarksChartData = {
  name: string
  percentage: number
}

type AttendanceChartData = {
  name: string
  value: number
}

const ATTENDANCE_COLORS: Record<string, string> = {
  Present: '#22c55e',
  Absent: '#ef4444',
  Late: '#eab308',
  Excused: '#3b82f6',
}

export function MarksBarChart({ data }: { data: MarksChartData[] }) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-sm">Not enough marks data yet to show a chart.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value: number) => [`${value}%`, 'Score']} />
        <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function AttendancePieChart({ data }: { data: AttendanceChartData[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return <p className="text-gray-400 text-sm">No attendance data yet to show a chart.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={ATTENDANCE_COLORS[entry.name] || '#8884d8'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}