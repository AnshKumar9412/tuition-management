'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Not authorized')

  return { supabase, adminId: user.id }
}

export async function createInvoice(formData: FormData) {
  const { supabase } = await assertAdmin()

  const studentId = formData.get('studentId') as string
  const classId = formData.get('classId') as string
  const periodLabel = formData.get('periodLabel') as string
  const amountDue = formData.get('amountDue') as string
  const dueDate = formData.get('dueDate') as string

  const { error } = await supabase.from('fee_invoices').insert({
    student_id: studentId,
    class_id: classId || null,
    period_label: periodLabel,
    amount_due: parseFloat(amountDue),
    due_date: dueDate || null,
    status: 'unpaid',
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/admin/fees')
}

export async function recordPayment(formData: FormData) {
  const { supabase, adminId } = await assertAdmin()

  const invoiceId = formData.get('invoiceId') as string
  const amount = formData.get('amount') as string
  const method = formData.get('method') as string
  const notes = formData.get('notes') as string

  const { error } = await supabase.from('fee_payments').insert({
    invoice_id: invoiceId,
    amount: parseFloat(amount),
    method,
    received_by: adminId,
    notes: notes || null,
  })

  if (error) throw new Error(error.message)

  // The trigger in your schema (update_invoice_on_payment) automatically
  // recalculates amount_paid and status on the invoice — no manual update needed.

  revalidatePath('/dashboard/admin/fees')
}

export async function deleteInvoice(invoiceId: string) {
  const { supabase } = await assertAdmin()
  await supabase.from('fee_invoices').delete().eq('id', invoiceId)
  revalidatePath('/dashboard/admin/fees')
}