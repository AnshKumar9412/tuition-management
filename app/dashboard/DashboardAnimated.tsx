'use client'

import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

const tileColors: Record<string, string> = {
  Students: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
  Teachers: 'bg-green-50 hover:bg-green-100 text-green-700',
  Classes: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
  Enrollments: 'bg-amber-50 hover:bg-amber-100 text-amber-700',
  Fees: 'bg-rose-50 hover:bg-rose-100 text-rose-700',
}

export function DashboardAnimatedContent({ profile }: { profile: any }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="bg-white rounded-2xl shadow-md p-8"
    >
      <motion.h1 variants={itemVariants} className="text-2xl font-bold mb-1">
        Welcome, {profile.full_name} 👋
      </motion.h1>

      <motion.p variants={itemVariants} className="text-gray-500 mb-6">
        Role: <span className="font-medium capitalize">{profile.role}</span>
      </motion.p>

      <motion.a
        variants={itemVariants}
        href="/dashboard/notices"
        className="text-sm text-blue-600 hover:underline block mb-4"
      >
        📢 View Notices
      </motion.a>

      {profile.role === 'admin' && (
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold mb-4">Admin Dashboard</h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { label: 'Students', href: '/dashboard/admin/students' },
              { label: 'Teachers', href: '/dashboard/admin/teachers' },
              { label: 'Classes', href: '/dashboard/admin/classes' },
              { label: 'Enrollments', href: '/dashboard/admin/enrollments' },
              { label: 'Fees', href: '/dashboard/admin/fees' },
            ].map((tile) => (
              <motion.a
                key={tile.label}
                variants={itemVariants}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                href={tile.href}
                className={`rounded-xl p-4 text-center transition-colors ${tileColors[tile.label]}`}
              >
                <p className="font-medium">{tile.label}</p>
              </motion.a>
            ))}
          </motion.div>
        </motion.div>
      )}

      {profile.role === 'teacher' && (
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold mb-4">Teacher Dashboard</h2>
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="/dashboard/teacher"
            className="bg-blue-50 hover:bg-blue-100 rounded-xl p-4 inline-block transition"
          >
            <p className="font-medium text-blue-700">Go to My Classes →</p>
          </motion.a>
        </motion.div>
      )}

      {profile.role === 'student' && (
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold mb-4">Student Dashboard</h2>
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            href="/dashboard/student"
            className="bg-blue-50 hover:bg-blue-100 rounded-xl p-4 inline-block transition"
          >
            <p className="font-medium text-blue-700">View My Progress →</p>
          </motion.a>
        </motion.div>
      )}

      <motion.form variants={itemVariants} action="/auth/signout" method="post" className="mt-8">
        <button type="submit" className="text-sm text-red-600 hover:underline">
          Log out
        </button>
      </motion.form>
    </motion.div>
  )
}