import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { rentalApi } from '../api';
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Wrench,
  DollarSign,
  ArrowRight,
  Clock,
  AlertTriangle
} from 'lucide-react';

export const DamageInspectionModal = ({ isOpen, onClose, rental, onSuccess }) => {
  // Stages: 1 = Return Check-in, 2 = Damage Inspection, 3 = Final Settlement & Refund
  const [currentStage, setCurrentStage] = useState(1);

  const [actualReturnDate, setActualReturnDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [checkinNotes, setCheckinNotes] = useState('Equipment returned at counter.');
  
  // Inspection items
  const [inspections, setInspections] = useState([]);
  
  // Settle form
  const [refundMethod, setRefundMethod] = useState('UPI');
  const [settleNotes, setSettleNotes] = useState('Deposit refund & final balance settled.');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [settlementSuccess, setSettlementSuccess] = useState(false);

  useEffect(() => {
    if (rental && rental.items) {
      setSettlementSuccess(false);
      setError(null);

      // Determine initial stage based on rental status
      if (['Return Pending Inspection'].includes(rental.rental_status)) {
        setCurrentStage(2);
      } else if (['Returned'].includes(rental.rental_status)) {
        setCurrentStage(3);
      } else {
        setCurrentStage(1);
      }

      const returnedDate = rental.actual_return_date || new Date().toISOString().split('T')[0];
      setActualReturnDate(returnedDate);

      const itemsList = rental.items.map((item) => ({
        asset_id: item.asset,
        product_name: item.product_name,
        serial_number: item.serial_number,
        asset_code: item.asset_id,
        late_fee_per_day: Number(item.product_details?.late_fee_per_day || item.asset_details?.late_fee_per_day || 200),
        condition_before: item.condition_on_dispatch || 'Good',
        inspection_result: item.condition_on_return || 'Good Condition',
        damage_description: '',
        damage_charges: 0,
        missing_accessories: '',
        missing_accessories_charge: 0,
        replacement_cost: 0,
      }));
      setInspections(itemsList);
    }
  }, [rental, isOpen]);

  if (!isOpen || !rental) return null;

  // Calculate late days
  const expDate = new Date(rental.expected_return_date);
  const retDate = new Date(actualReturnDate);
  const diffTime = retDate - expDate;
  const lateDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;

  // Calculate totals
  const totalLateFees = inspections.reduce((acc, curr) => {
    return acc + (Number(curr.late_fee_per_day) || 200) * lateDays;
  }, 0);

  const totalDamageCharges = inspections.reduce((acc, curr) => {
    return acc + Number(curr.damage_charges || 0);
  }, 0);

  const totalMissingCharges = inspections.reduce((acc, curr) => {
    return acc + Number(curr.missing_accessories_charge || 0);
  }, 0);

  const totalDeductions = totalLateFees + totalDamageCharges + totalMissingCharges;
  const depositHeld = Number(rental.security_deposit || 0);
  const refundableDeposit = Math.max(0, depositHeld - totalDeductions);
  const additionalBalanceDue = Math.max(0, totalDeductions - depositHeld);

  const handleInspectionChange = (index, field, value) => {
    setInspections((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Stage 1: Check in equipment
  const handleCheckin = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await rentalApi.processReturn(rental.id, {
        actual_return_date: actualReturnDate,
        notes: checkinNotes,
      });
      setCurrentStage(2);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Return check-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Stage 2: Submit Damage Inspection
  const handleInspectionSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await rentalApi.inspectEquipment(rental.id, {
        inspections: inspections.map((i) => ({
          asset_id: i.asset_id,
          inspection_result: i.inspection_result,
          damage_description: i.damage_description,
          damage_charges: Number(i.damage_charges) || 0,
          replacement_cost: Number(i.replacement_cost) || 0,
          missing_accessories: i.missing_accessories,
          missing_accessories_charge: Number(i.missing_accessories_charge) || 0,
        })),
      });
      setCurrentStage(3);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Inspection submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Stage 3: Final Settle Booking & Deposit Refund
  const handleSettleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await rentalApi.settleBooking(rental.id, {
        payment_method: refundMethod,
        notes: settleNotes,
      });
      setSettlementSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Final settlement failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Return & Damage Inspection: ${rental.rental_id}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3-Stage Stepper Header */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs font-bold">
          <div className={`flex items-center gap-2 ${currentStage === 1 ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
              currentStage > 1 ? 'bg-emerald-100 text-emerald-700' : currentStage === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'
            }`}>
              {currentStage > 1 ? '✓' : '1'}
            </span>
            <span>Check-in Return</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-200"></div>

          <div className={`flex items-center gap-2 ${currentStage === 2 ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
              currentStage > 2 ? 'bg-emerald-100 text-emerald-700' : currentStage === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'
            }`}>
              {currentStage > 2 ? '✓' : '2'}
            </span>
            <span>Damage & Late Fee Inspection</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-200"></div>

          <div className={`flex items-center gap-2 ${currentStage === 3 ? 'text-blue-600' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
              settlementSuccess ? 'bg-emerald-100 text-emerald-700' : currentStage === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200'
            }`}>
              {settlementSuccess ? '✓' : '3'}
            </span>
            <span>Final Settlement & Refund</span>
          </div>
        </div>

        {/* STAGE 1: CHECK-IN RETURN */}
        {currentStage === 1 && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Actual Physical Return Date
                </label>
                <input
                  type="date"
                  value={actualReturnDate}
                  onChange={(e) => setActualReturnDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Return Date
                </label>
                <div className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-semibold">
                  {rental.expected_return_date}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Counter Receiving Notes
                </label>
                <input
                  type="text"
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  placeholder="Items delivered back to yard / counter..."
                />
              </div>
            </div>

            {lateDays > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  <strong>Overdue Warning:</strong> This equipment is returned <strong>{lateDays} day(s)</strong> late. Automatic late fees will be calculated in Stage 2.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Returned on or before scheduled date. Zero late fee penalty applicable.</span>
              </div>
            )}

            <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600">
              <strong>Business Workflow Note:</strong> Clicking below marks returned assets as <em>Return Pending Inspection</em>. Tools are quarantined until certified clean & undamaged.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleCheckin}
                className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Receive & Proceed to Inspection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: DAMAGE & CONDITION INSPECTION */}
        {currentStage === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Inspect physical condition of each unit before releasing or scheduling maintenance.</span>
              {lateDays > 0 && (
                <span className="font-bold text-rose-600">Late Penalty: {lateDays} day(s) overdue</span>
              )}
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {inspections.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{item.product_name}</h4>
                      <p className="font-mono text-[11px] text-slate-500">SN: {item.serial_number}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500">Late Fee Rate: ₹{item.late_fee_per_day}/day</span>
                      {lateDays > 0 && (
                        <p className="font-bold text-rose-600">Fee: ₹{item.late_fee_per_day * lateDays}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Inspection Finding
                      </label>
                      <select
                        value={item.inspection_result}
                        onChange={(e) => handleInspectionChange(idx, 'inspection_result', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-semibold bg-white"
                      >
                        <option value="Good Condition">Good Condition (Clean, ready to rent)</option>
                        <option value="Minor Damage">Minor Damage (Needs minor repair)</option>
                        <option value="Major Damage">Major Damage (Needs workshop overhaul)</option>
                        <option value="Missing Parts">Missing Parts / Accessories</option>
                        <option value="Not Working">Not Working / Motor Failure</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Damage Charges to Deduct (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.damage_charges}
                        onChange={(e) => handleInspectionChange(idx, 'damage_charges', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                        placeholder="0.00"
                      />
                    </div>

                    {item.inspection_result !== 'Good Condition' && (
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Damage & Defect Description (Auto-routed to Maintenance Desk)
                        </label>
                        <input
                          type="text"
                          value={item.damage_description}
                          onChange={(e) => handleInspectionChange(idx, 'damage_description', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-rose-300 bg-rose-50/50"
                          placeholder="e.g. Broken casing, burned cord, missing blade guard"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Summary Box */}
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Automated Late Fees:</span>
                <span className="font-bold text-slate-900">₹{totalLateFees.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Equipment Damage Charges:</span>
                <span className="font-bold text-rose-600">₹{totalDamageCharges.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Penalty Deductions:</span>
                <span className="text-rose-700">₹{totalDeductions.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={handleInspectionSubmit}
                className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>Save Inspection & Go to Settlement</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: FINAL SETTLEMENT & DEPOSIT REFUND */}
        {currentStage === 3 && (
          <div className="space-y-4">
            {settlementSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-slate-900">Final Settlement Completed!</h3>
                <p className="text-xs text-slate-500">
                  Deposit refund recorded in ledger and rental agreement marked Completed.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onSuccess) onSuccess();
                    }}
                    className="px-5 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl shadow"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                    Final Financial Settlement Breakdown
                  </h4>
                  <div className="flex justify-between text-slate-600">
                    <span>Base Rental Charges:</span>
                    <span>₹{Number(rental.rental_charges).toLocaleString()}</span>
                  </div>
                  {Number(rental.delivery_charges) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery / Freight Charges:</span>
                      <span>₹{Number(rental.delivery_charges).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>GST Tax (18%):</span>
                    <span>₹{Number(rental.tax).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Late Returns Fee:</span>
                    <span>₹{totalLateFees.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Damage Inspection Deductions:</span>
                    <span>₹{totalDamageCharges.toLocaleString()}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-800">
                    <span>Security Deposit Held:</span>
                    <span className="text-amber-700">₹{depositHeld.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-700">
                    <span>Total Deductions Absorbed by Deposit:</span>
                    <span>- ₹{Math.min(depositHeld, totalDeductions).toLocaleString()}</span>
                  </div>

                  <div className="pt-3 border-t-2 border-slate-900 flex justify-between text-sm font-black">
                    <span className="text-emerald-700">Refundable Security Deposit to Client:</span>
                    <span className="text-emerald-700 text-base">₹{refundableDeposit.toLocaleString()}</span>
                  </div>

                  {additionalBalanceDue > 0 && (
                    <div className="flex justify-between text-xs font-black text-rose-600">
                      <span>Additional Balance Outstanding (Exceeds Deposit):</span>
                      <span>₹{additionalBalanceDue.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Deposit Refund Method
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold bg-white"
                    >
                      <option value="UPI">UPI Instant Refund</option>
                      <option value="Cash">Cash Handover at Counter</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                      <option value="Card">Card Reversal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Settlement Notes
                    </label>
                    <input
                      type="text"
                      value={settleNotes}
                      onChange={(e) => setSettleNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                      placeholder="Notes for ledger entry..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSettleSubmit}
                    className="px-6 py-2.5 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50"
                  >
                    {submitting ? 'Settling...' : 'Disburse Refund & Mark Completed'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
