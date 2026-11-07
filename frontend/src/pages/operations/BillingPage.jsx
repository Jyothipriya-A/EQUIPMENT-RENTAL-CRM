import React, { useState, useEffect } from 'react';
import { billingApi, customerApi, rentalApi } from '../../api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { ReceiptModal } from '../../components/ReceiptModal';
import { InvoiceModal } from '../../components/InvoiceModal';
import {
  CreditCard,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Clock,
  Receipt,
  FileText
} from 'lucide-react';

export const BillingPage = () => {
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'invoices'
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [receiptPaymentId, setReceiptPaymentId] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    customer: '',
    rental: '',
    payment_amount: '',
    payment_method: 'UPI',
    payment_type: 'Rental Payment',
    transaction_reference: '',
    notes: 'Counter payment collected at front desk.',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBillingData();
  }, [search, activeTab]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'invoices') {
        const invRes = await billingApi.getInvoices({ search });
        setInvoices(invRes.data.results || invRes.data || []);
      } else {
        const [pRes, cRes, rRes] = await Promise.all([
          billingApi.getPayments({ search }),
          customerApi.getCustomers({ page_size: 100 }),
          rentalApi.getRentals({ page_size: 100 }),
        ]);
        setPayments(pRes.data.results || pRes.data || []);
        const custs = cRes.data.results || cRes.data || [];
        setCustomers(custs);
        setRentals(rRes.data.results || rRes.data || []);

        if (custs.length > 0 && !formData.customer) {
          setFormData((prev) => ({ ...prev, customer: custs[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecord = () => {
    setFormData({
      customer: customers[0]?.id || '',
      rental: '',
      payment_amount: '',
      payment_method: 'UPI',
      payment_type: 'Rental Payment',
      transaction_reference: `UPI-${Date.now().toString().slice(-6)}`,
      notes: 'Counter payment collected at front desk.',
    });
    setError(null);
    setIsRecordOpen(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await billingApi.createPayment(formData);
      setIsRecordOpen(false);
      loadBillingData();
      setReceiptPaymentId(res.data.id);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRental = rentals.find((r) => r.id === Number(formData.rental));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Counter Billing & Invoicing</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect advance payments, issue official GST invoices, track dues, and print thermal receipts.
          </p>
        </div>

        <button
          onClick={handleOpenRecord}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Collect Counter Payment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'payments' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Counter Receipts
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'invoices' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Tax Invoices
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'payments' ? "Search payments by receipt ID, customer, transaction..." : "Search invoices by invoice number, customer, GSTIN..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading billing data...</div>
        ) : activeTab === 'payments' ? (
          payments.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">No payment receipts found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Receipt No & Date</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Rental Code</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">Amount Received</th>
                    <th className="py-3.5 px-4 text-right">Print Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-slate-900 text-xs">{p.payment_id}</p>
                        <p className="text-[11px] text-slate-400">{new Date(p.payment_date).toLocaleString()}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.customer_name}</td>
                      <td className="py-3 px-4 font-mono text-blue-600">{p.rental_code || 'General Advance'}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{p.payment_method}</span>
                        <p className="text-[11px] font-mono text-slate-400">{p.transaction_reference || 'Counter Cash'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.payment_type === 'Deposit Refund' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-800'}`}>
                          {p.payment_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600">
                        +₹{Number(p.payment_amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setReceiptPaymentId(p.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Invoices Table */
          invoices.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">No GST tax invoices issued.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Invoice # & Date</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Rental Reference</th>
                    <th className="py-3.5 px-4 text-right">Total Amount</th>
                    <th className="py-3.5 px-4 text-right">Balance Due</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">View Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-blue-600">{inv.invoice_number}</p>
                        <p className="text-[11px] text-slate-400">Date: {inv.invoice_date}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{inv.customer_details?.company_name || inv.customer_details?.full_name}</p>
                        {inv.gstin && <p className="text-[10px] text-slate-500">GSTIN: {inv.gstin}</p>}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{inv.rental_details?.rental_id}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">₹{Number(inv.grand_total).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        {Number(inv.balance_due) > 0 ? (
                          <span className="font-bold text-rose-600">₹{Number(inv.balance_due).toLocaleString()}</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Settled</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={inv.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoiceId(inv.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1 ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="Collect Counter Payment"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitPayment} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
            <select
              required
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name ? `${c.company_name} (${c.full_name})` : c.full_name} ({c.phone_number}) - Dues: ₹{c.outstanding_dues}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Rental (Optional)</label>
            <select
              value={formData.rental}
              onChange={(e) => setFormData({ ...formData, rental: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="">None / General Settlement</option>
              {rentals.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.rental_id} - {r.customer_details?.company_name || r.customer_details?.full_name} (Balance: ₹{r.outstanding_balance})
                </option>
              ))}
            </select>
          </div>

          {selectedRental && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs space-y-1">
              <p className="font-bold text-blue-900">Rental: {selectedRental.rental_id}</p>
              <p className="text-blue-700">Total Contract: ₹{selectedRental.total_amount} | Balance Due: <strong className="text-rose-600">₹{selectedRental.outstanding_balance}</strong></p>
              <p className="text-blue-600 text-[11px]">Security Deposit Held: ₹{selectedRental.security_deposit}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                <option value="Cash">Cash Handover</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Type</label>
              <select
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="Rental Payment">Rental Payment</option>
                <option value="Advance Payment">Advance Payment</option>
                <option value="Security Deposit Collection">Security Deposit</option>
                <option value="Final Settlement">Final Settlement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Collected (₹)</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={formData.payment_amount}
              onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / UPI Note</label>
            <input
              type="text"
              value={formData.transaction_reference}
              onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsRecordOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Collect & Issue Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptPaymentId}
        onClose={() => setReceiptPaymentId(null)}
        paymentId={receiptPaymentId}
      />

      {/* Official Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        invoiceId={selectedInvoiceId}
      />
    </div>
  );
};
