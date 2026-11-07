import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { billingApi } from '../api';
import { Printer, CheckCircle } from 'lucide-react';

export const ReceiptModal = ({ isOpen, onClose, paymentId }) => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && paymentId) {
      setLoading(true);
      billingApi.getPaymentReceipt(paymentId)
        .then((res) => setReceipt(res.data))
        .catch((err) => console.error("Receipt error:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, paymentId]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Payment Receipt" maxWidth="max-w-md">
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Loading receipt...
        </div>
      ) : receipt ? (
        <div className="space-y-4">
          <div className="border border-slate-200 rounded-xl p-5 bg-white text-xs print:border-none print:p-0">
            {/* Header */}
            <div className="text-center pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">{receipt.company.name}</h3>
              <p className="text-[11px] text-slate-500">{receipt.company.address}</p>
              <p className="text-[11px] text-slate-500">GSTIN: {receipt.company.gstin}</p>
            </div>

            {/* Receipt Details */}
            <div className="py-4 space-y-2 border-b border-slate-200 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-bold text-slate-900">{receipt.payment_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{new Date(receipt.receipt_date).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900">{receipt.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Type:</span>
                <span className="font-medium">{receipt.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-medium">{receipt.method}</span>
              </div>
              {receipt.reference && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Ref:</span>
                  <span className="font-mono text-slate-600">{receipt.reference}</span>
                </div>
              )}
              {receipt.rental && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Rental Reference:</span>
                  <span className="font-medium text-blue-600">{receipt.rental.rental_id}</span>
                </div>
              )}
            </div>

            {/* Total Paid */}
            <div className="py-4 text-center bg-slate-50 rounded-xl my-3">
              <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold">Amount Received</p>
              <h2 className="text-2xl font-black text-emerald-600 mt-1">₹{Number(receipt.amount).toLocaleString()}</h2>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                {receipt.status}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 text-center">
              Recorded by: {receipt.recorded_by} • Thank you for your business!
            </div>
          </div>

          <div className="flex justify-end no-print">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
