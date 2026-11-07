import React, { useState, useEffect } from 'react';
import { rentalApi } from '../../api';
import { Badge } from '../../components/Badge';
import { DamageInspectionModal } from '../../components/DamageInspectionModal';
import { AgreementModal } from '../../components/AgreementModal';
import { InvoiceModal } from '../../components/InvoiceModal';
import {
  RotateCcw,
  Search,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Receipt
} from 'lucide-react';

export const ReturnsPage = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRental, setSelectedRental] = useState(null);
  const [agreementRentalId, setAgreementRentalId] = useState(null);
  const [invoiceRentalId, setInvoiceRentalId] = useState(null);

  useEffect(() => {
    loadReturns();
  }, [search]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      const res = await rentalApi.getRentals({ search });
      const pendingReturns = (res.data.results || res.data || []).filter((r) =>
        ['Dispatched', 'Partially Dispatched', 'Partially Returned', 'Return Pending Inspection', 'Returned', 'Overdue'].includes(r.rental_status)
      );
      setRentals(pendingReturns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Returns & Inspection Check-in</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Scan or search rental contracts, inspect returned tools, compute automated late fees, and disburse deposit refunds.
        </p>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search rental contract ID, customer name, serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Pending Return Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Active Rentals Ready for Check-in ({rentals.length})
          </h3>
          <span className="text-xs text-slate-500">Supports partial and full returns</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading active contracts...</div>
        ) : rentals.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No active contracts pending return check-in.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rentals.map((r) => {
              const isOverdue = new Date() > new Date(r.expected_return_date);

              return (
                <div key={r.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900">{r.rental_id}</span>
                      <Badge status={r.rental_status} />
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 animate-pulse">
                          Overdue Check-in
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {r.customer_details?.company_name || r.customer_details?.full_name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Expected Return: <strong className="text-slate-800">{r.expected_return_date}</strong> • Security Deposit Held: <strong className="text-amber-700">₹{Number(r.security_deposit).toLocaleString()}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => setAgreementRentalId(r.id)}
                      className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Agreement
                    </button>

                    <button
                      onClick={() => setInvoiceRentalId(r.id)}
                      className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Invoice
                    </button>

                    <button
                      onClick={() => setSelectedRental(r)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-sm flex items-center gap-1.5 transition-colors ${
                        r.rental_status === 'Returned'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : r.rental_status === 'Return Pending Inspection'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {r.rental_status === 'Returned'
                        ? 'Final Settlement & Refund'
                        : r.rental_status === 'Return Pending Inspection'
                        ? 'Inspect Damage'
                        : 'Process Return'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Return & Damage Modal */}
      <DamageInspectionModal
        isOpen={!!selectedRental}
        onClose={() => setSelectedRental(null)}
        rental={selectedRental}
        onSuccess={loadReturns}
      />

      {/* Agreement Modal */}
      <AgreementModal
        isOpen={!!agreementRentalId}
        onClose={() => setAgreementRentalId(null)}
        rentalId={agreementRentalId}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={!!invoiceRentalId}
        onClose={() => setInvoiceRentalId(null)}
        rentalId={invoiceRentalId}
      />
    </div>
  );
};
