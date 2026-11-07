import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { rentalApi } from '../api';
import { Printer, Download, FileText, CheckCircle2 } from 'lucide-react';

export const AgreementModal = ({ isOpen, onClose, rentalId }) => {
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && rentalId) {
      setLoading(true);
      rentalApi.getAgreementData(rentalId)
        .then((res) => setAgreement(res.data))
        .catch((err) => console.error("Failed to load agreement:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, rentalId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.open(rentalApi.getAgreementPdfUrl(rentalId), '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rental Agreement Preview" maxWidth="max-w-4xl">
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Preparing agreement document...</p>
        </div>
      ) : agreement ? (
        <div className="space-y-6">
          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Agreement
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Official PDF
            </button>
          </div>

          {/* Printable Document Box */}
          <div className="border border-slate-200 rounded-xl p-6 sm:p-8 bg-white print:p-0 print:border-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between border-b border-slate-200 pb-5 gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{agreement.company.name}</h2>
                <p className="text-xs text-slate-500 mt-1">{agreement.company.address}</p>
                <p className="text-xs text-slate-500">GSTIN: {agreement.company.gstin} | Phone: {agreement.company.phone}</p>
              </div>
              <div className="text-right sm:text-right">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                  {agreement.status}
                </span>
                <p className="text-sm font-bold text-slate-800 mt-2">Agreement: {agreement.rental_id}</p>
                <p className="text-xs text-slate-500">Booking: {new Date(agreement.booking_date).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Customer & Period Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold uppercase tracking-wider text-slate-400 mb-2">Customer Details</p>
                <p className="text-sm font-bold text-slate-900">{agreement.customer.name}</p>
                <p className="text-slate-600 mt-1">Phone: {agreement.customer.phone}</p>
                <p className="text-slate-600">Email: {agreement.customer.email || 'N/A'}</p>
                <p className="text-slate-600 mt-1">ID Proof: {agreement.customer.id_type} - {agreement.customer.id_number}</p>
                <p className="text-slate-600 mt-1">Address: {agreement.customer.address || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold uppercase tracking-wider text-slate-400 mb-2">Rental Schedule</p>
                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span>Start Date:</span>
                    <span className="font-semibold text-slate-900">{agreement.rental_start_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected Return Date:</span>
                    <span className="font-semibold text-slate-900">{agreement.expected_return_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rental Duration:</span>
                    <span className="font-semibold text-slate-900">{agreement.rental_duration} Days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Equipment Items Table */}
            <div className="py-5 border-b border-slate-200">
              <p className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Itemized Equipment & Tools</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="pb-2">Product Name</th>
                      <th className="pb-2">Serial Number</th>
                      <th className="pb-2">Dispatch Condition</th>
                      <th className="pb-2 text-right">Daily Rate (₹)</th>
                      <th className="pb-2 text-right">Security Deposit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agreement.items.map((item, idx) => (
                      <tr key={idx} className="text-slate-800">
                        <td className="py-2.5 font-medium">{item.product_name} ({item.product_code})</td>
                        <td className="py-2.5 font-mono text-slate-600">{item.serial_number}</td>
                        <td className="py-2.5">{item.condition}</td>
                        <td className="py-2.5 text-right font-semibold">₹{item.daily_rate.toLocaleString()}</td>
                        <td className="py-2.5 text-right font-semibold">₹{item.security_deposit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="py-5 border-b border-slate-200">
              <div className="max-w-xs ml-auto space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Rental Charges:</span>
                  <span className="font-medium text-slate-900">₹{agreement.financials.rental_charges.toLocaleString()}</span>
                </div>
                {agreement.financials.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-medium">- ₹{agreement.financials.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax (18%):</span>
                  <span className="font-medium text-slate-900">₹{agreement.financials.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">₹{agreement.financials.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Security Deposit (Held):</span>
                  <span className="font-medium text-amber-700">₹{agreement.financials.security_deposit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Amount Paid:</span>
                  <span className="font-medium text-emerald-700">₹{agreement.financials.paid_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-rose-600 pt-1 border-t border-slate-100">
                  <span>Outstanding Balance:</span>
                  <span>₹{agreement.financials.outstanding_balance.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="py-4 border-b border-slate-200 text-[11px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Standard Terms & Conditions</p>
              {agreement.terms.map((t, idx) => (
                <p key={idx}>• {t}</p>
              ))}
            </div>

            {/* Signatures Block */}
            <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center">
              <div>
                <div className="h-12 border-b border-dashed border-slate-300"></div>
                <p className="font-bold text-slate-800 mt-2">Authorized Signatory</p>
                <p className="text-slate-400 text-[10px]">{agreement.company.name}</p>
              </div>
              <div>
                <div className="h-12 border-b border-dashed border-slate-300"></div>
                <p className="font-bold text-slate-800 mt-2">Customer Signature & Acceptance</p>
                <p className="text-slate-400 text-[10px]">{agreement.customer.name}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-rose-500">Failed to load agreement data.</p>
      )}
    </Modal>
  );
};
