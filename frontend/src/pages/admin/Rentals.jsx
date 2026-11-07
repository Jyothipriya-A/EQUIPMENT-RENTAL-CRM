import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { rentalApi } from '../../api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { AgreementModal } from '../../components/AgreementModal';
import { InvoiceModal } from '../../components/InvoiceModal';
import { DamageInspectionModal } from '../../components/DamageInspectionModal';
import {
  FileText,
  Search,
  Filter,
  Truck,
  RotateCcw,
  Calendar,
  AlertCircle,
  Plus,
  Clock,
  Printer,
  ChevronRight,
  User,
  XCircle,
  Receipt,
  RefreshCw,
  CheckCircle2,
  CheckSquare,
  Square
} from 'lucide-react';

export const Rentals = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  // Modals
  const [agreementRentalId, setAgreementRentalId] = useState(null);
  const [invoiceRentalId, setInvoiceRentalId] = useState(null);
  const [inspectRental, setInspectRental] = useState(null);
  const [dispatchRental, setDispatchRental] = useState(null);
  const [extendRental, setExtendRental] = useState(null);
  const [cancelRental, setCancelRental] = useState(null);

  // Partial Dispatch Selection
  const [dispatchAssetIds, setDispatchAssetIds] = useState([]);

  // Dispatch Form State
  const [dispatchData, setDispatchData] = useState({
    delivery_location: 'Client Worksite / Counter Pick-up',
    accessories_provided: 'Standard toolkit, heavy duty cables, safety goggles',
    customer_signature_name: '',
    initial_condition_notes: 'All items tested and verified functional.',
  });

  // Extend Form State
  const [newReturnDate, setNewReturnDate] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    loadRentals();
  }, [search, statusFilter]);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      
      if (statusFilter === 'quotation') {
        params.is_quotation = 'true';
      } else if (statusFilter) {
        params.status = statusFilter;
      }

      const res = await rentalApi.getRentals(params);
      setRentals(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDispatch = (rental) => {
    setDispatchRental(rental);
    const eligible = (rental.items || [])
      .filter((i) => ['Reserved', 'Ready for Dispatch'].includes(i.item_status))
      .map((i) => i.asset);
    setDispatchAssetIds(eligible);

    setDispatchData({
      delivery_location: 'Client Worksite / Counter Pick-up',
      accessories_provided: 'Standard toolkit, cables, operator manual',
      customer_signature_name: rental.customer_details?.full_name || '',
      initial_condition_notes: 'Checked and tested before dispatch.',
    });
    setActionError(null);
  };

  const toggleDispatchAsset = (assetId) => {
    setDispatchAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    if (dispatchAssetIds.length === 0) {
      setActionError('Please select at least one unit to dispatch.');
      return;
    }
    setActionSubmitting(true);
    setActionError(null);
    try {
      await rentalApi.dispatchRental(dispatchRental.id, {
        ...dispatchData,
        asset_ids: dispatchAssetIds,
      });
      setDispatchRental(null);
      loadRentals();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.detail || 'Dispatch failed.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleOpenExtend = (rental) => {
    setExtendRental(rental);
    const d = new Date(rental.expected_return_date);
    d.setDate(d.getDate() + 3);
    setNewReturnDate(d.toISOString().split('T')[0]);
    setActionError(null);
  };

  const handleConfirmExtend = async (e) => {
    e.preventDefault();
    setActionSubmitting(true);
    setActionError(null);
    try {
      await rentalApi.extendRental(extendRental.id, { new_return_date: newReturnDate });
      setExtendRental(null);
      loadRentals();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.detail || 'Extension failed. Overlapping booking detected.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleConvertQuotation = async (rentalId) => {
    try {
      await rentalApi.convertQuotation(rentalId);
      loadRentals();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to convert quotation.');
    }
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    setActionSubmitting(true);
    setActionError(null);
    try {
      await rentalApi.cancelRental(cancelRental.id, { reason: 'Cancelled by customer / admin request' });
      setCancelRental(null);
      loadRentals();
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.detail || 'Cancellation failed.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const statusTabs = [
    { label: 'All Contracts', value: '' },
    { label: 'Quotations', value: 'quotation' },
    { label: 'Reserved / Confirmed', value: 'Confirmed' },
    { label: 'Dispatched (On-Site)', value: 'Dispatched' },
    { label: 'Pending Inspection', value: 'Return Pending Inspection' },
    { label: 'Returned', value: 'Returned' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Overdue', value: 'Overdue' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rental Agreements & Quotations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full rental lifecycle tracking, quotation conversions, dispatch releases, return inspections, and invoices.
          </p>
        </div>

        <Link
          to="/operations/new-booking"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Booking / Quotation
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === tab.value
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by rental ID, customer name, phone number, PO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Rentals Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading rentals...</div>
        ) : rentals.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No rental agreements found matching criteria.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Rental / Quotation ID & Client</th>
                    <th className="py-3.5 px-4">Duration & Schedule</th>
                    <th className="py-3.5 px-4 text-center">Equipment Count</th>
                    <th className="py-3.5 px-4 text-right">Total Charges</th>
                    <th className="py-3.5 px-4 text-right">Balance Due</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Lifecycle Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rentals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold text-xs ${r.is_quotation ? 'text-amber-700' : 'text-blue-700'}`}>
                            {r.rental_id}
                          </span>
                          {r.is_quotation && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-800">
                              Quote
                            </span>
                          )}
                        </div>
                        <p className="text-slate-800 font-semibold">{r.customer_details?.company_name || r.customer_details?.full_name}</p>
                        <p className="text-[11px] text-slate-400">
                          {r.customer_details?.phone_number} {r.po_number && `• PO: ${r.po_number}`}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-semibold text-slate-800">{r.rental_duration} Days</span>
                        <p className="text-[11px] text-slate-500">
                          {r.rental_start_date} → {r.expected_return_date}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                          {r.items?.length || 0} unit(s)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ₹{Number(r.total_amount).toLocaleString()}
                        <p className="text-[10px] text-amber-700 font-normal">Dep: ₹{Number(r.security_deposit).toLocaleString()}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {r.is_quotation ? (
                          <span className="text-slate-400 italic text-[11px]">Pending Approval</span>
                        ) : Number(r.outstanding_balance) > 0 ? (
                          <span className="font-bold text-rose-600">₹{Number(r.outstanding_balance).toLocaleString()}</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Settled</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge status={r.rental_status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Convert Quotation */}
                          {r.is_quotation && (
                            <button
                              onClick={() => handleConvertQuotation(r.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 shadow-xs"
                              title="Convert Quotation to Confirmed Booking"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Convert
                            </button>
                          )}

                          {/* View Agreement */}
                          <button
                            onClick={() => setAgreementRentalId(r.id)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                            title="Agreement Document & Print"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* View Tax Invoice */}
                          {!r.is_quotation && (
                            <button
                              onClick={() => setInvoiceRentalId(r.id)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                              title="Tax Invoice"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}

                          {/* Dispatch Button if Confirmed / Reserved / Partially Dispatched */}
                          {['Reserved', 'Confirmed', 'Partially Dispatched'].includes(r.rental_status) && (
                            <button
                              onClick={() => handleOpenDispatch(r)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                            >
                              Dispatch
                            </button>
                          )}

                          {/* Return & Inspection Button */}
                          {['Dispatched', 'Partially Returned', 'Return Pending Inspection', 'Overdue'].includes(r.rental_status) && (
                            <button
                              onClick={() => setInspectRental(r)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            >
                              {r.rental_status === 'Return Pending Inspection' ? 'Inspect Damage' : 'Return & Inspect'}
                            </button>
                          )}

                          {/* Final Settle Button if Returned */}
                          {r.rental_status === 'Returned' && (
                            <button
                              onClick={() => setInspectRental(r)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                            >
                              Settle & Refund
                            </button>
                          )}

                          {/* Extend Button */}
                          {['Dispatched', 'Confirmed'].includes(r.rental_status) && (
                            <button
                              onClick={() => handleOpenExtend(r)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                              title="Extend rental dates"
                            >
                              Extend
                            </button>
                          )}

                          {/* Cancel Button */}
                          {['Reserved', 'Confirmed', 'Quotation Sent'].includes(r.rental_status) && (
                            <button
                              onClick={() => setCancelRental(r)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                              title="Cancel Reservation"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {rentals.map((r) => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-bold text-xs ${r.is_quotation ? 'text-amber-700' : 'text-blue-600'}`}>
                          {r.rental_id}
                        </span>
                        {r.is_quotation && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">Quote</span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 mt-0.5">
                        {r.customer_details?.company_name || r.customer_details?.full_name}
                      </h4>
                    </div>
                    <Badge status={r.rental_status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Dates</p>
                      <p className="font-medium">{r.rental_start_date} → {r.expected_return_date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Charges</p>
                      <p className="font-bold text-slate-900">₹{Number(r.total_amount).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAgreementRentalId(r.id)}
                        className="text-xs text-blue-600 font-bold flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Agreement
                      </button>
                      {!r.is_quotation && (
                        <button
                          onClick={() => setInvoiceRentalId(r.id)}
                          className="text-xs text-indigo-600 font-bold flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Invoice
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {r.is_quotation && (
                        <button
                          onClick={() => handleConvertQuotation(r.id)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700"
                        >
                          Convert
                        </button>
                      )}
                      {['Reserved', 'Confirmed'].includes(r.rental_status) && (
                        <button
                          onClick={() => handleOpenDispatch(r)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-700"
                        >
                          Dispatch
                        </button>
                      )}
                      {['Dispatched', 'Return Pending Inspection', 'Overdue'].includes(r.rental_status) && (
                        <button
                          onClick={() => setInspectRental(r)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700"
                        >
                          Return & Inspect
                        </button>
                      )}
                      {r.rental_status === 'Returned' && (
                        <button
                          onClick={() => setInspectRental(r)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700"
                        >
                          Settle
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dispatch Modal */}
      <Modal
        isOpen={!!dispatchRental}
        onClose={() => setDispatchRental(null)}
        title={`Handover Equipment: ${dispatchRental?.rental_id}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleConfirmDispatch} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {actionError}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-900">{dispatchRental?.customer_details?.company_name || dispatchRental?.customer_details?.full_name}</p>
            <p className="text-slate-600">Start: {dispatchRental?.rental_start_date} → Return: {dispatchRental?.expected_return_date}</p>
          </div>

          {/* Unit selection for partial dispatch */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Select Units to Release</label>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-1 divide-y divide-slate-100">
              {(dispatchRental?.items || []).map((item) => {
                const isDispatched = item.item_status === 'Dispatched';
                const isSelected = dispatchAssetIds.includes(item.asset);
                return (
                  <div
                    key={item.id}
                    onClick={() => !isDispatched && toggleDispatchAsset(item.asset)}
                    className={`p-2 flex items-center justify-between text-xs rounded-lg transition-colors ${
                      isDispatched ? 'opacity-50 bg-slate-50' : 'cursor-pointer hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-blue-600">
                        {isDispatched ? '✓ Out' : isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-300" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.product_name}</p>
                        <p className="font-mono text-[10px] text-slate-400">SN: {item.serial_number}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">{item.item_status}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery / Handover Location</label>
            <input
              type="text"
              required
              value={dispatchData.delivery_location}
              onChange={(e) => setDispatchData({ ...dispatchData, delivery_location: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Accessories Provided</label>
            <input
              type="text"
              required
              value={dispatchData.accessories_provided}
              onChange={(e) => setDispatchData({ ...dispatchData, accessories_provided: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Receiving Signature Name</label>
            <input
              type="text"
              required
              value={dispatchData.customer_signature_name}
              onChange={(e) => setDispatchData({ ...dispatchData, customer_signature_name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDispatchRental(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionSubmitting || dispatchAssetIds.length === 0}
              className="px-5 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {actionSubmitting ? 'Updating...' : `Authorize Dispatch (${dispatchAssetIds.length} units)`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Extend Rental Modal */}
      <Modal
        isOpen={!!extendRental}
        onClose={() => setExtendRental(null)}
        title={`Extend Rental Contract: ${extendRental?.rental_id}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmExtend} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {actionError}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <p><strong>Current Return Date:</strong> {extendRental?.expected_return_date}</p>
            <p className="text-slate-500">System will verify equipment availability for the extended timeframe.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Requested Return Date
            </label>
            <input
              type="date"
              required
              min={extendRental?.expected_return_date}
              value={newReturnDate}
              onChange={(e) => setNewReturnDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setExtendRental(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionSubmitting}
              className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {actionSubmitting ? 'Verifying & Extending...' : 'Confirm Extension'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Return & Damage Modal */}
      <DamageInspectionModal
        isOpen={!!inspectRental}
        onClose={() => setInspectRental(null)}
        rental={inspectRental}
        onSuccess={loadRentals}
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
