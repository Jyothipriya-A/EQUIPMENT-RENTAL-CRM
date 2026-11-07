import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { billingApi } from '../api';
import { Printer, CheckCircle2, Building2, Calendar, FileText } from 'lucide-react';

export const InvoiceModal = ({ isOpen, onClose, invoiceId, rentalId }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      if (invoiceId) {
        billingApi.getInvoiceById(invoiceId)
          .then((res) => setInvoice(res.data))
          .catch((err) => console.error('Invoice error:', err))
          .finally(() => setLoading(false));
      } else if (rentalId) {
        // Fetch invoices for this rental
        billingApi.getInvoices({ rental: rentalId })
          .then((res) => {
            const list = res.data.results || res.data || [];
            if (list.length > 0) setInvoice(list[0]);
            else setInvoice(null);
          })
          .catch((err) => console.error('Invoice error:', err))
          .finally(() => setLoading(false));
      }
    }
  }, [isOpen, invoiceId, rentalId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official GST Tax Invoice" maxWidth="max-w-2xl">
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Generating tax invoice...</div>
      ) : invoice ? (
        <div className="space-y-6">
          <div className="border border-slate-200 rounded-2xl p-6 bg-white text-xs print:border-none print:p-0 space-y-5">
            {/* Tax Invoice Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div>
                <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-black tracking-wider uppercase mb-1">
                  Tax Invoice
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">EquipRental Pro CRM</h2>
                <p className="text-slate-500 text-[11px]">Industrial Tools & Heavy Equipment Hire Services</p>
                <p className="text-slate-500 text-[11px]">Plot 42, Industrial Area Phase II, Bangalore, India</p>
                <p className="text-slate-700 text-[11px] font-semibold mt-1">Company GSTIN: 29AAAAA0000A1Z5</p>
              </div>

              <div className="text-right space-y-1">
                <p className="font-mono font-black text-sm text-blue-600">{invoice.invoice_number}</p>
                <p className="text-slate-500 text-[11px]">Date: <strong>{invoice.invoice_date}</strong></p>
                <p className="text-slate-500 text-[11px]">Due Date: <strong>{invoice.due_date}</strong></p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  Status: {invoice.status}
                </span>
              </div>
            </div>

            {/* Bill To & Reference Section */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px]">
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Billed To (Client)</p>
                <p className="font-bold text-slate-900 text-xs">{invoice.customer_details?.full_name}</p>
                {invoice.customer_details?.customer_type === 'company' && (
                  <p className="font-semibold text-blue-700">{invoice.customer_details?.company_name}</p>
                )}
                <p className="text-slate-600">{invoice.customer_details?.address || 'Billing address on file'}</p>
                <p className="text-slate-600">Phone: {invoice.customer_details?.phone_number}</p>
                {invoice.gstin && (
                  <p className="font-bold text-slate-800 mt-1">Customer GSTIN: {invoice.gstin}</p>
                )}
              </div>

              <div className="space-y-1 text-right">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Booking Reference</p>
                <p className="font-mono font-bold text-slate-800">Booking: {invoice.rental_details?.rental_id || 'N/A'}</p>
                {invoice.po_number && (
                  <p className="font-semibold text-slate-700">Client PO No: <strong>{invoice.po_number}</strong></p>
                )}
                <p className="text-slate-500">Rental Duration: {invoice.rental_details?.rental_duration || 0} Day(s)</p>
                <p className="text-slate-500">{invoice.rental_details?.rental_start_date} to {invoice.rental_details?.expected_return_date}</p>
              </div>
            </div>

            {/* Financial Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5">
                      <p className="font-semibold text-slate-900">Equipment Rental Hire Charges</p>
                      <p className="text-[11px] text-slate-400">Base hire charges for contracted duration</p>
                    </td>
                    <td className="py-2.5 text-right font-medium text-slate-800">
                      ₹{Number(invoice.rental_details?.rental_charges || invoice.subtotal).toLocaleString()}
                    </td>
                  </tr>

                  {Number(invoice.rental_details?.delivery_charges) > 0 && (
                    <tr>
                      <td className="py-2.5">
                        <p className="font-semibold text-slate-900">Freight & Delivery Logistics</p>
                        <p className="text-[11px] text-slate-400">Site mobilization & delivery fees</p>
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-800">
                        ₹{Number(invoice.rental_details?.delivery_charges).toLocaleString()}
                      </td>
                    </tr>
                  )}

                  {Number(invoice.rental_details?.discount) > 0 && (
                    <tr className="text-emerald-700">
                      <td className="py-2">Approved Corporate Discount</td>
                      <td className="py-2 text-right font-semibold">
                        - ₹{Number(invoice.rental_details?.discount).toLocaleString()}
                      </td>
                    </tr>
                  )}

                  <tr className="border-t border-slate-200 font-semibold text-slate-800">
                    <td className="py-2">Taxable Subtotal</td>
                    <td className="py-2 text-right">₹{Number(invoice.subtotal).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600">Central GST (CGST @ 9%)</td>
                    <td className="py-1 text-right text-slate-700">₹{(Number(invoice.tax_amount) / 2).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-600">State GST (SGST @ 9%)</td>
                    <td className="py-1 text-right text-slate-700">₹{(Number(invoice.tax_amount) / 2).toLocaleString()}</td>
                  </tr>
                  <tr className="border-t-2 border-slate-900 text-sm font-black text-slate-900">
                    <td className="py-3">Grand Total (Incl. GST)</td>
                    <td className="py-3 text-right text-blue-600">₹{Number(invoice.grand_total).toLocaleString()}</td>
                  </tr>
                  <tr className="text-xs font-bold">
                    <td className="py-2 text-slate-500">Outstanding Balance Due</td>
                    <td className={`py-2 text-right ${Number(invoice.balance_due) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      ₹{Number(invoice.balance_due).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Note on Security Deposit */}
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-[11px] text-amber-900">
              <strong>Notice regarding Refundable Security Deposit:</strong> Security deposits (₹{Number(invoice.rental_details?.security_deposit || 0).toLocaleString()}) are held separately in trust and do not constitute taxable rental revenue. Deposits are refunded in full upon safe return inspection.
            </div>

            {/* Footer / Signatures */}
            <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">Terms & Conditions:</p>
                <p>1. Payment is due strictly per agreed credit period.</p>
                <p>2. Late returns attract daily late fee per equipment specifications.</p>
              </div>
              <div className="text-center">
                <div className="h-10 border-b border-slate-400 w-36 mb-1"></div>
                <p className="font-bold text-slate-800">Authorized Signatory</p>
                <p className="text-[10px]">EquipRental Pro Accounts</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Official Invoice
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-500">
          No tax invoice found for this booking.
        </div>
      )}
    </Modal>
  );
};
