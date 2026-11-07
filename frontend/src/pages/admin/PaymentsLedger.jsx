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
  DollarSign,
  FileSpreadsheet,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Calendar,
  CheckCircle2,
  Clock,
  IndianRupee,
  Receipt,
  FileText
} from 'lucide-react';

export const PaymentsLedger = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState(
    initialTab || (window.location.pathname.includes('/ledger') ? 'ledger' : 'payments')
  ); // 'payments' | 'invoices' | 'ledger' | 'deposits'

  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [receiptPaymentId, setReceiptPaymentId] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // Aux data for Record Payment
  const [customers, setCustomers] = useState([]);
  const [rentals, setRentals] = useState([]);

  // Form State
  const [paymentForm, setPaymentForm] = useState({
    customer: '',
    rental: '',
    payment_amount: '',
    payment_method: 'UPI',
    payment_type: 'Rental Payment',
    transaction_reference: '',
    notes: '',
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAuxData();
    loadSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'payments') loadPayments();
    else if (activeTab === 'invoices') loadInvoices();
    else if (activeTab === 'ledger') loadLedger();
    else if (activeTab === 'deposits') loadDeposits();
  }, [activeTab, search]);

  const loadSummary = async () => {
    try {
      const res = await billingApi.getLedgerSummary();
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAuxData = async () => {
    try {
      const [cRes, rRes] = await Promise.all([
        customerApi.getCustomers({ page_size: 100 }),
        rentalApi.getRentals({ page_size: 100 }),
      ]);
      setCustomers(cRes.data.results || cRes.data || []);
      setRentals(rRes.data.results || rRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await billingApi.getPayments({ search });
      setPayments(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await billingApi.getInvoices({ search });
      setInvoices(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async () => {
    try {
      setLoading(true);
      const res = await billingApi.getLedgerEntries();
      setLedgerEntries(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDeposits = async () => {
    try {
      setLoading(true);
      const res = await billingApi.getDeposits();
      setDeposits(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecordPayment = () => {
    setPaymentForm({
      customer: customers[0]?.id || '',
      rental: '',
      payment_amount: '',
      payment_method: 'UPI',
      payment_type: 'Rental Payment',
      transaction_reference: `UPI-${Date.now().toString().slice(-6)}`,
      notes: 'Customer payment received at counter.',
    });
    setFormError(null);
    setIsRecordPaymentOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await billingApi.createPayment(paymentForm);
      setIsRecordPaymentOpen(false);
      loadPayments();
      loadSummary();
      setReceiptPaymentId(res.data.id);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments & Financial Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cash collection, GST invoices, UPI & bank transactions, accounting ledger, and segregated security deposit liabilities.
          </p>
        </div>

        <button
          onClick={handleOpenRecordPayment}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Record New Payment
        </button>
      </div>

      {/* Summary KPI Strip */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Cash Collection</span>
            <p className="text-xl font-black text-emerald-600 mt-1">₹{Number(summary.today_cash_collection).toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Physical cash drawer balance</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Inflow (All Modes)</span>
            <p className="text-xl font-black text-slate-900 mt-1">₹{Number(summary.today_total_collected).toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">UPI, Cards & Bank Transfers</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deposit Refunds Issued</span>
            <p className="text-xl font-black text-rose-600 mt-1">₹{Number(summary.today_total_refunded).toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Returned deposit payouts</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security Deposit Liability</span>
            <p className="text-xl font-black text-amber-700 mt-1">₹{Number(summary.security_deposit_liability).toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Customer funds held separately</p>
          </div>
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'payments'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Payments Log
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'invoices'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          GST Tax Invoices
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'ledger'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          General Ledger
        </button>

        <button
          onClick={() => setActiveTab('deposits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'deposits'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Security Deposits
        </button>
      </div>

      {/* Search Input for Payments / Invoices */}
      {(activeTab === 'payments' || activeTab === 'invoices') && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'payments' ? "Search payment ID, transaction reference, customer..." : "Search invoice number, client GSTIN, customer name..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading financial records...</div>
        ) : activeTab === 'payments' ? (
          /* Payments Table */
          payments.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">No payment transactions recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Payment ID & Date</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Rental Link</th>
                    <th className="py-3.5 px-4">Method & Ref</th>
                    <th className="py-3.5 px-4">Transaction Type</th>
                    <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
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
                        <p className="text-[11px] font-mono text-slate-500">{p.transaction_reference || 'Counter Cash'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.payment_type === 'Deposit Refund' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-800'}`}>
                          {p.payment_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold text-sm ${p.payment_type === 'Deposit Refund' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {p.payment_type === 'Deposit Refund' ? '-' : '+'}₹{Number(p.payment_amount).toLocaleString()}
                        </span>
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
        ) : activeTab === 'invoices' ? (
          /* Invoices Table */
          invoices.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">No GST invoices issued yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Invoice # & Date</th>
                    <th className="py-3.5 px-4">Customer / Enterprise</th>
                    <th className="py-3.5 px-4">Booking Ref & PO</th>
                    <th className="py-3.5 px-4 text-right">Subtotal</th>
                    <th className="py-3.5 px-4 text-right">GST (18%)</th>
                    <th className="py-3.5 px-4 text-right">Grand Total</th>
                    <th className="py-3.5 px-4 text-right">Balance Due</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-blue-600 text-xs">{inv.invoice_number}</p>
                        <p className="text-[11px] text-slate-400">Date: {inv.invoice_date}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{inv.customer_details?.company_name || inv.customer_details?.full_name}</p>
                        {inv.gstin && <p className="font-mono text-[10px] text-slate-500">GSTIN: {inv.gstin}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold text-slate-700">{inv.rental_details?.rental_id}</span>
                        {inv.po_number && <p className="text-[10px] text-slate-500">PO: {inv.po_number}</p>}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">₹{Number(inv.subtotal).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-600">₹{Number(inv.tax_amount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">₹{Number(inv.grand_total).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        {Number(inv.balance_due) > 0 ? (
                          <span className="font-bold text-rose-600">₹{Number(inv.balance_due).toLocaleString()}</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Fully Paid</span>
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
                          View Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'ledger' ? (
          /* General Ledger Table */
          ledgerEntries.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">No ledger entries generated yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Entry Number</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Accounting Category</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4 text-right">Debit (₹)</th>
                    <th className="py-3.5 px-4 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerEntries.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{l.entry_number}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(l.entry_date).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <Badge status={l.entry_type} />
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{l.category}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{l.description}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        {l.entry_type === 'Debit' ? `₹${Number(l.amount).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {l.entry_type === 'Credit' ? `₹${Number(l.amount).toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Security Deposits Table */
          deposits.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">No security deposit records.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Rental ID & Customer</th>
                    <th className="py-3.5 px-4 text-right">Total Collected</th>
                    <th className="py-3.5 px-4 text-right">Deducted (Damages/Late)</th>
                    <th className="py-3.5 px-4 text-right">Refunded to Client</th>
                    <th className="py-3.5 px-4 text-right">Currently Held</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-blue-600 text-xs">{d.rental_code}</p>
                        <p className="font-bold text-slate-800">{d.customer_name}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">₹{Number(d.total_collected).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">₹{Number(d.total_deducted).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700">₹{Number(d.total_refunded).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-black text-amber-700">₹{Number(d.remaining_held).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={d.status} />
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
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        title="Record Payment / Collect Security Deposit"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
            <select
              required
              value={paymentForm.customer}
              onChange={(e) => setPaymentForm({ ...paymentForm, customer: e.target.value })}
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
              value={paymentForm.rental}
              onChange={(e) => setPaymentForm({ ...paymentForm, rental: e.target.value })}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Type</label>
              <select
                value={paymentForm.payment_type}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="Rental Payment">Rental Payment</option>
                <option value="Advance Payment">Advance Payment</option>
                <option value="Security Deposit Collection">Security Deposit Collection</option>
                <option value="Final Settlement">Final Settlement</option>
                <option value="Deposit Refund">Deposit Refund</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash Handover</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹ INR)</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={paymentForm.payment_amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_amount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / Cheque #</label>
              <input
                type="text"
                value={paymentForm.transaction_reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                placeholder="e.g. UPI-998822"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks & Ledger Notes</label>
            <input
              type="text"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsRecordPaymentOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Record Payment & Post to Ledger'}
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
