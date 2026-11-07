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
  DollarSign,
  Calendar,
  Receipt
} from 'lucide-react';

export const ReturnsInspection = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRental, setSelectedRental] = useState(null);
  const [agreementRentalId, setAgreementRentalId] = useState(null);
  const [invoiceRentalId, setInvoiceRentalId] = useState(null);

  useEffect(() => {
    loadDueRentals();
  }, [search, statusFilter]);

  const loadDueRentals = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await rentalApi.getRentals(params);
      const eligibleRentals = (res.data.results || res.data || []).filter((r) =>
        ['Dispatched', 'Partially Dispatched', 'Partially Returned', 'Return Pending Inspection', 'Returned', 'Overdue'].includes(r.rental_status)
      );
      setRentals(eligibleRentals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { label: 'All Returns Queue', value: '' },
    { label: 'Pending Physical Return', value: 'Dispatched' },
    { label: 'Pending Inspection Quarantine', value: 'Return Pending Inspection' },
    { label: 'Ready for Settlement & Refund', value: 'Returned' },
    { label: 'Overdue Returns', value: 'Overdue' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Returns & Damage Inspection Desk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process physical equipment returns, assess conditions, calculate automated late fees, and disburse deposit refunds.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === t.value
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search rental ID, customer, phone, serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Active Equipment Awaiting Return */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Returns Processing Queue ({rentals.length})
          </h3>
          <span className="text-xs text-slate-500">Includes active, quarantined & awaiting settlement</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading rentals...</div>
        ) : rentals.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No equipment bookings currently in return queue.
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                          Past Due Date
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {r.customer_details?.company_name || r.customer_details?.full_name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Phone: {r.customer_details?.phone_number} • Deployed: {r.items?.length || 0} unit(s)
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1">
                      <span>Expected Return: <strong className="text-slate-800">{r.expected_return_date}</strong></span>
                      <span>•</span>
                      <span>Deposit Held: <strong className="text-amber-700">₹{Number(r.security_deposit).toLocaleString()}</strong></span>
                    </div>
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
                        ? 'Damage Inspection'
                        : 'Inspect & Process Return'}
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
        onSuccess={loadDueRentals}
      />

      {/* Agreement Preview Modal */}
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
