import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createInvoice, recordPayment, deleteInvoice } from './actions'

export default async function FeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')
    .order('full_name')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, fee_amount')
    .order('name')

  const { data: invoices } = await supabase
    .from('fee_invoices')
    .select('id, period_label, amount_due, amount_paid, due_date, status, students:student_id(full_name), classes:class_id(name)')
    .order('created_at', { ascending: false })

  const statusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    unpaid: 'bg-gray-100 text-gray-600',
    overdue: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to dashboard
          </a>
          <h1 className="text-2xl font-bold mt-2">Manage Fees</h1>
        </div>

        {/* Create invoice */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-4">Create New Invoice</h2>
          <form action={createInvoice} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select name="studentId" required className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="">— Select student —</option>
                {students?.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class (optional)</label>
              <select name="classId" className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="">— No specific class —</option>
                {classes?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} (₹{c.fee_amount})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period Label</label>
              <input name="periodLabel" required placeholder="e.g. October 2026"
                className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Due</label>
              <input name="amountDue" type="number" step="0.01" required placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input name="dueDate" type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="bg-blue-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-blue-700">
                Create Invoice
              </button>
            </div>
          </form>
        </div>

        {/* All invoices */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="font-semibold mb-4">All Invoices ({invoices?.length || 0})</h2>
          <div className="space-y-4">
            {invoices?.map((inv: any) => (
              <div key={inv.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="font-medium">{inv.students?.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {inv.period_label} {inv.classes?.name ? `· ${inv.classes.name}` : ''}
                      {inv.due_date ? ` · Due ${inv.due_date}` : ''}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[inv.status]}`}>
                    {inv.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm mb-3">
                  <p>
                    Paid: <span className="font-medium">₹{inv.amount_paid}</span> / ₹{inv.amount_due}
                  </p>
                  <form action={async () => {
                    'use server'
                    await deleteInvoice(inv.id)
                  }}>
                    <button type="submit" className="text-red-600 hover:underline text-xs">
                      Delete Invoice
                    </button>
                  </form>
                </div>

                {inv.status !== 'paid' && (
                  <form action={recordPayment} className="flex flex-wrap gap-2 items-end border-t border-gray-100 pt-3">
                    <input type="hidden" name="invoiceId" value={inv.id} />
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Amount</label>
                      <input name="amount" type="number" step="0.01" required
                        className="w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Method</label>
                      <select name="method" className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs text-gray-500 mb-1">Notes</label>
                      <input name="notes" placeholder="Optional"
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                    </div>
                    <button type="submit" className="bg-green-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-green-700">
                      Record Payment
                    </button>
                  </form>
                )}
              </div>
            ))}

            {(!invoices || invoices.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">
                No invoices yet. Create one above.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}