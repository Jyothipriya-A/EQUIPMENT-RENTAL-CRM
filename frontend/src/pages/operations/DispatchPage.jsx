import React, { useState, useEffect } from 'react';
import { rentalApi } from '../../api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { AgreementModal } from '../../components/AgreementModal';
import {
  Truck,
  Search,
  CheckCircle2,
  FileText,
  AlertCircle,
  Calendar,
  User,
  Wrench,
  MapPin,
  CheckSquare,
  Square
} from 'lucide-react';

export const DispatchPage = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRental, setSelectedRental] = useState(null);
  const [agreementRentalId, setAgreementRentalId] = useState(null);

  // Partial dispatch: selected asset IDs
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);

  // Dispatch Form
  const [dispatchData, setDispatchData] = useState({
    delivery_location: 'Site Mobilization / Front Yard',
    accessories_provided: 'Heavy-duty power cables, toolkit, safety goggles',
    customer_signature_name: '',
    initial_condition_notes: 'Tested on-site, zero defects, oil & grease verified.',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPendingDispatches();
  }, [search]);

  const loadPendingDispatches = async () => {
    try {
      setLoading(true);
      const res = await rentalApi.getRentals({ search });
      const pending = (res.data.results || res.data || []).filter((r) =>
        ['Reserved', 'Confirmed', 'Partially Dispatched', 'Ready for Dispatch'].includes(r.rental_status)
      );
      setRentals(pending);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDispatch = (r) => {
    setSelectedRental(r);
    // Eligible items to dispatch: Reserved or Ready for Dispatch
    const eligibleAssets = (r.items || [])
      .filter((item) => ['Reserved', 'Ready for Dispatch'].includes(item.item_status))
      .map((item) => item.asset);

    setSelectedAssetIds(eligibleAssets);

    setDispatchData({
      delivery_location: 'Client Worksite / Counter Pick-up',
      accessories_provided: 'Standard toolkit, heavy duty cables, safety guard',
      customer_signature_name: r.customer_details?.full_name || '',
      initial_condition_notes: 'All items tested and verified functional before handover.',
    });
    setError(null);
  };

  const toggleAssetCheck = (assetId) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const handleSubmitDispatch = async (e) => {
    e.preventDefault();
    if (selectedAssetIds.length === 0) {
      setError('Please select at least one physical asset unit to dispatch.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      await rentalApi.dispatchRental(selectedRental.id, {
        ...dispatchData,
        asset_ids: selectedAssetIds,
      });
      setSelectedRental(null);
      loadPendingDispatches();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Dispatch failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Equipment Dispatch Desk</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verify equipment handover, record outgoing accessories, support partial releases, and record customer acceptance.
        </p>
      </div>

      {/* Search Input */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search pending bookings by rental code, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Bookings Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Pending Dispatch Queue ({rentals.length})
          </h3>
          <span className="text-xs text-slate-500">Supports partial & full dispatch</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading bookings...</div>
        ) : rentals.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No equipment bookings currently pending dispatch.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rentals.map((r) => {
              const totalItems = r.items?.length || 0;
              const dispatchedCount = (r.items || []).filter((i) => i.item_status === 'Dispatched').length;

              return (
                <div key={r.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900">{r.rental_id}</span>
                      <Badge status={r.rental_status} />
                      {dispatchedCount > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {dispatchedCount}/{totalItems} Units Released
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {r.customer_details?.company_name || r.customer_details?.full_name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Contact: {r.customer_details?.full_name} ({r.customer_details?.phone_number})
                    </p>
                    <p className="text-xs text-slate-600 pt-1">
                      Equipment: <strong className="text-slate-800">{totalItems} physical unit(s)</strong> booked for {r.rental_duration} days
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
                      onClick={() => handleOpenDispatch(r)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Handover & Dispatch
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      <Modal
        isOpen={!!selectedRental}
        onClose={() => setSelectedRental(null)}
        title={`Handover Equipment: ${selectedRental?.rental_id}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitDispatch} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-900">{selectedRental?.customer_details?.company_name || selectedRental?.customer_details?.full_name}</p>
            <p className="text-slate-600">Start: {selectedRental?.rental_start_date} → Return: {selectedRental?.expected_return_date}</p>
          </div>

          {/* Partial Dispatch Asset Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Select Units to Release (Supports Partial Dispatch)
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1">
              {(selectedRental?.items || []).map((item) => {
                const isDispatched = item.item_status === 'Dispatched';
                const isSelected = selectedAssetIds.includes(item.asset);

                return (
                  <div
                    key={item.id}
                    onClick={() => !isDispatched && toggleAssetCheck(item.asset)}
                    className={`p-2.5 flex items-center justify-between text-xs rounded-lg transition-colors ${
                      isDispatched
                        ? 'opacity-50 bg-slate-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-50/70 cursor-pointer'
                        : 'hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="text-blue-600">
                        {isDispatched ? (
                          <span className="text-[10px] font-bold text-slate-400">Already Out</span>
                        ) : isSelected ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{item.product_name}</p>
                        <p className="font-mono text-[11px] text-slate-500">SN: {item.serial_number}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      isDispatched ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.item_status}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500">
              Selected to release: <strong>{selectedAssetIds.length}</strong> unit(s)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Delivery / Dispatch Location
            </label>
            <input
              type="text"
              required
              value={dispatchData.delivery_location}
              onChange={(e) => setDispatchData({ ...dispatchData, delivery_location: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
              placeholder="Worksite address or Counter pick-up"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Accessories Handed Over
            </label>
            <input
              type="text"
              required
              value={dispatchData.accessories_provided}
              onChange={(e) => setDispatchData({ ...dispatchData, accessories_provided: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer / Driver Signature Name
            </label>
            <input
              type="text"
              required
              value={dispatchData.customer_signature_name}
              onChange={(e) => setDispatchData({ ...dispatchData, customer_signature_name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Handover Inspection Notes
            </label>
            <textarea
              rows="2"
              value={dispatchData.initial_condition_notes}
              onChange={(e) => setDispatchData({ ...dispatchData, initial_condition_notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSelectedRental(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedAssetIds.length === 0}
              className="px-5 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Updating...' : `Authorize Dispatch (${selectedAssetIds.length} items)`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Agreement Modal */}
      <AgreementModal
        isOpen={!!agreementRentalId}
        onClose={() => setAgreementRentalId(null)}
        rentalId={agreementRentalId}
      />
    </div>
  );
};
