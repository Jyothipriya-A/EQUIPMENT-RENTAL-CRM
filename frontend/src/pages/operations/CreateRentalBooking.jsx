import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { rentalApi, customerApi, inventoryApi } from '../../api';
import { AgreementModal } from '../../components/AgreementModal';
import {
  CalendarPlus,
  CheckCircle2,
  Users,
  Wrench,
  Calendar,
  Calculator,
  Percent,
  CreditCard,
  FileCheck,
  AlertCircle,
  Plus,
  ArrowRight,
  ArrowLeft,
  Printer,
  Download,
  FileText,
  Truck,
  Building2,
  RefreshCw
} from 'lucide-react';

export const CreateRentalBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Wizard Step: 1 through 8
  const [currentStep, setCurrentStep] = useState(1);

  // Workflow Mode: 'booking' vs 'quotation'
  const [bookingMode, setBookingMode] = useState('booking'); // 'booking' | 'quotation'

  // Aux Data
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loadingAux, setLoadingAux] = useState(true);

  // Booking Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const validUntilDefault = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [startDate, setStartDate] = useState(location.state?.preselectedStartDate || todayStr);
  const [endDate, setEndDate] = useState(location.state?.preselectedEndDate || nextWeekStr);
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [deliveryCharges, setDeliveryCharges] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [poNumber, setPoNumber] = useState('');
  const [quotationValidUntil, setQuotationValidUntil] = useState(validUntilDefault);
  const [advancePayment, setAdvancePayment] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('Counter booking confirmed.');

  // Result state
  const [createdRental, setCreatedRental] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  useEffect(() => {
    loadAuxData();
  }, []);

  const loadAuxData = async () => {
    try {
      setLoadingAux(true);
      const [cRes, pRes, aRes] = await Promise.all([
        customerApi.getCustomers({ page_size: 100 }),
        inventoryApi.getProducts({ page_size: 100 }),
        inventoryApi.getAssets({ page_size: 200 }),
      ]);
      const custs = cRes.data.results || cRes.data || [];
      const prods = pRes.data.results || pRes.data || [];
      const asts = aRes.data.results || aRes.data || [];

      setCustomers(custs);
      setProducts(prods);
      setAssets(asts);

      if (custs.length > 0) {
        setSelectedCustomerId(custs[0].id);
        if (custs[0].po_number) setPoNumber(custs[0].po_number);
      }

      if (location.state?.suggestedAssetId) {
        setSelectedAssetIds([location.state.suggestedAssetId]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAux(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === Number(selectedCustomerId));

  // Auto-fill PO number when customer changes if they have a default PO
  const handleCustomerChange = (custId) => {
    setSelectedCustomerId(custId);
    const c = customers.find((item) => item.id === Number(custId));
    if (c?.po_number) setPoNumber(c.po_number);
  };

  // Calculate rental duration in days
  const durationDays = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));

  // Calculate charges for selected assets
  const selectedAssetObjects = assets.filter((a) => selectedAssetIds.includes(a.id));

  const totalRentalCharges = selectedAssetObjects.reduce((acc, a) => {
    const prod = products.find((p) => p.id === a.product);
    if (!prod) return acc;
    if (durationDays >= 30) {
      return acc + (Number(prod.monthly_rental_rate) / 30) * durationDays;
    } else if (durationDays >= 7) {
      return acc + (Number(prod.weekly_rental_rate) / 7) * durationDays;
    } else {
      return acc + Number(prod.daily_rental_rate) * durationDays;
    }
  }, 0);

  const totalSecurityDeposit = selectedAssetObjects.reduce((acc, a) => {
    const prod = products.find((p) => p.id === a.product);
    return acc + Number(prod?.security_deposit || 0);
  }, 0);

  const delivery = Number(deliveryCharges) || 0;
  const discount = Number(discountAmount) || 0;
  const subtotal = Math.max(0, totalRentalCharges + delivery - discount);
  const tax = subtotal * 0.18; // 18% GST
  const totalPayable = subtotal + tax;

  const toggleAssetSelect = (assetId) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (bookingMode === 'quotation') {
        const payload = {
          customer_id: selectedCustomerId,
          rental_start_date: startDate,
          expected_return_date: endDate,
          asset_ids: selectedAssetIds,
          discount: discount,
          delivery_charges: delivery,
          tax_rate: 18,
          po_number: poNumber,
          quotation_valid_until: quotationValidUntil,
          notes: notes,
        };
        const res = await rentalApi.createQuotation(payload);
        setCreatedRental(res.data);
      } else {
        const payload = {
          customer_id: selectedCustomerId,
          rental_start_date: startDate,
          expected_return_date: endDate,
          asset_ids: selectedAssetIds,
          discount: discount,
          delivery_charges: delivery,
          tax_rate: 18,
          po_number: poNumber,
          advance_payment: Number(advancePayment) || 0,
          payment_method: paymentMethod,
          payment_reference: paymentRef,
          notes: notes,
        };
        const res = await rentalApi.createBooking(payload);
        setCreatedRental(res.data);
      }
      setCurrentStep(8); // Step 8: View Agreement / Quotation Card
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Operation failed. Please verify asset availability or overlapping bookings.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertToBooking = async () => {
    if (!createdRental) return;
    setConverting(true);
    setError(null);
    try {
      const res = await rentalApi.convertQuotation(createdRental.id);
      setCreatedRental(res.data);
      setBookingMode('booking');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Conversion failed. Equipment may have conflict with another booking.');
    } finally {
      setConverting(false);
    }
  };

  const stepsConfig = [
    { num: 1, label: 'Customer' },
    { num: 2, label: 'Equipment' },
    { num: 3, label: 'Dates' },
    { num: 4, label: 'Pricing' },
    { num: 5, label: 'Discounts & PO' },
    { num: 6, label: bookingMode === 'quotation' ? 'Validity' : 'Advance' },
    { num: 7, label: 'Review' },
    { num: 8, label: bookingMode === 'quotation' ? 'Quotation' : 'Agreement' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rental Workflow Wizard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Switch between generating formal price quotations or executing confirmed rental contracts.
          </p>
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setBookingMode('booking')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              bookingMode === 'booking'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Direct Booking</span>
          </button>
          <button
            type="button"
            onClick={() => setBookingMode('quotation')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              bookingMode === 'quotation'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Price Quotation</span>
          </button>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-between min-w-[500px] gap-2">
          {stepsConfig.map((s) => (
            <div key={s.num} className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === s.num
                    ? bookingMode === 'quotation' ? 'bg-amber-600 text-white shadow-xs' : 'bg-blue-600 text-white shadow-xs'
                    : currentStep > s.num
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > s.num ? '✓' : s.num}
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  currentStep === s.num ? 'text-slate-900 font-bold' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
              {s.num < 8 && <div className="w-4 h-0.5 bg-slate-200 mx-1"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Step Container Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 min-h-[420px] flex flex-col justify-between">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: SELECT CUSTOMER */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 1: Select Customer / Enterprise</h3>
                <p className="text-xs text-slate-500">Pick an active individual client or corporate account</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-slate-700">Choose Registered Client</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-800 font-medium"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_type === 'company' ? `🏢 ${c.company_name} (${c.full_name})` : `👤 ${c.full_name}`} - {c.phone_number} (Dues: ₹{c.outstanding_dues})
                  </option>
                ))}
              </select>

              {selectedCustomer && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {selectedCustomer.customer_type === 'company' ? selectedCustomer.company_name : selectedCustomer.full_name}
                      </p>
                      <p className="text-slate-500 text-[11px]">Contact Person: {selectedCustomer.full_name} ({selectedCustomer.phone_number})</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedCustomer.customer_type === 'company' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {selectedCustomer.customer_type === 'company' ? 'Corporate Account' : 'Individual Client'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                    <p>Email: {selectedCustomer.email || selectedCustomer.company_email || 'N/A'}</p>
                    <p>Address: {selectedCustomer.billing_address || selectedCustomer.address || 'N/A'}</p>
                    {selectedCustomer.gstin && <p className="font-bold text-slate-800">GSTIN: {selectedCustomer.gstin}</p>}
                    {selectedCustomer.po_number && <p className="font-bold text-slate-800">Default PO: {selectedCustomer.po_number}</p>}
                  </div>

                  {Number(selectedCustomer.outstanding_dues) > 0 && (
                    <div className="mt-2 p-2 bg-rose-50 text-rose-700 rounded-lg font-bold border border-rose-200">
                      Warning: Customer has outstanding dues of ₹{Number(selectedCustomer.outstanding_dues).toLocaleString()}.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: SELECT EQUIPMENT & PHYSICAL ASSETS */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 2: Select Equipment Assets</h3>
                <p className="text-xs text-slate-500">Pick available physical units to assign to this rental</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Selected units: <span className="font-bold text-blue-600">{selectedAssetIds.length} asset(s)</span>
            </p>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {assets
                .filter((a) => a.availability_status === 'Available')
                .map((ast) => {
                  const isSelected = selectedAssetIds.includes(ast.id);
                  return (
                    <div
                      key={ast.id}
                      onClick={() => toggleAssetSelect(ast.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border text-xs font-bold ${
                            isSelected ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && '✓'}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{ast.product_name}</h4>
                          <p className="font-mono text-[11px] text-slate-500">
                            SN: {ast.serial_number} • Tag: {ast.asset_id} • Location: {ast.location}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <span className="font-bold text-slate-900">₹{ast.daily_rental_rate}/day</span>
                        <p className="text-[10px] text-amber-700">Dep: ₹{ast.security_deposit}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* STEP 3: SELECT RENTAL DURATION */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 3: Select Rental Period</h3>
                <p className="text-xs text-slate-500">Set departure and scheduled return dates</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rental Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Return Date</label>
                <input
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500">Total Duration:</span>
                <p className="text-lg font-black text-slate-900">{durationDays} Calendar Day(s)</p>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Rate Tier Applied:</span>
                <p className="font-bold text-blue-600">
                  {durationDays >= 30 ? 'Monthly Optimized Rate' : durationDays >= 7 ? 'Weekly Tier Rate' : 'Standard Daily Rate'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: AUTOMATIC PRICE & LOGISTICS CALCULATION */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 4: Price & Logistics Breakdown</h3>
                <p className="text-xs text-slate-500">Breakdown for {selectedAssetIds.length} items over {durationDays} days</p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Calculated Equipment Rental Charges:</span>
                <span className="font-bold text-slate-900 text-sm">₹{totalRentalCharges.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-slate-700">
                <span>Site Delivery & Freight Logistics (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={deliveryCharges}
                  onChange={(e) => setDeliveryCharges(e.target.value)}
                  className="w-32 px-3 py-1 text-xs text-right rounded-lg border border-slate-300 font-semibold bg-white"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-between text-slate-700">
                <span>Refundable Security Deposit (Held Separately):</span>
                <span className="font-bold text-amber-700 text-sm">₹{totalSecurityDeposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>GST Tax (18% on Rental + Delivery):</span>
                <span className="font-bold text-slate-900">₹{tax.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Contract Value:</span>
                <span className="text-blue-600 text-base">₹{totalPayable.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: APPLY DISCOUNTS & PO NUMBER */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Step 5: Apply Discounts & Purchase Order</h3>
                <p className="text-xs text-slate-500">Add commercial discounts and client PO reference</p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount Amount (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalRentalCharges}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Purchase Order (PO) Number
                  </label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold bg-white"
                    placeholder="e.g. PO-CORP-2026-99"
                  />
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span>Gross Rental + Freight:</span>
                  <span>₹{(totalRentalCharges + delivery).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount Applied:</span>
                  <span>- ₹{discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Net Taxable Charge:</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: ADVANCE OR VALIDITY */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {bookingMode === 'quotation' ? 'Step 6: Quotation Validity' : 'Step 6: Collect Advance Payment'}
                </h3>
                <p className="text-xs text-slate-500">
                  {bookingMode === 'quotation' ? 'Set expiration date for commercial quotation' : 'Record advance collection towards rent or deposit'}
                </p>
              </div>
            </div>

            {bookingMode === 'quotation' ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quotation Valid Until</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={quotationValidUntil}
                    onChange={(e) => setQuotationValidUntil(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold bg-white"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Quotation remains valid until this date. Upon customer sign-off, it can be converted to an active booking with 1 click.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Advance Amount Collected (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                  >
                    <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Reference (Optional)</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                    placeholder="e.g. UPI-998844 or Cheque No"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 7: REVIEW & CONFIRM */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Step 7: Review & Issue {bookingMode === 'quotation' ? 'Quotation' : 'Booking'}
                </h3>
                <p className="text-xs text-slate-500">Backend will re-validate availability across physical units</p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5">
              <p><strong>Customer:</strong> {selectedCustomer?.company_name || selectedCustomer?.full_name} ({selectedCustomer?.phone_number})</p>
              <p><strong>Period:</strong> {startDate} to {endDate} ({durationDays} days)</p>
              <p><strong>Selected Equipment:</strong> {selectedAssetIds.length} physical asset(s)</p>
              {poNumber && <p><strong>PO Reference:</strong> {poNumber}</p>}
              <p><strong>Rental + Delivery:</strong> ₹{(totalRentalCharges + delivery).toLocaleString()} | <strong>GST:</strong> ₹{tax.toLocaleString()}</p>
              <p><strong>Total Value:</strong> ₹{totalPayable.toLocaleString()} | <strong>Security Deposit:</strong> ₹{totalSecurityDeposit.toLocaleString()}</p>
              {bookingMode === 'booking' && (
                <p><strong>Advance Paid:</strong> ₹{Number(advancePayment).toLocaleString()} via {paymentMethod}</p>
              )}
              {bookingMode === 'quotation' && (
                <p className="text-amber-800 font-semibold">Valid Until: {quotationValidUntil}</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 8: RESULT (AGREEMENT OR QUOTATION) */}
        {currentStep === 8 && createdRental && (
          <div className="text-center py-6 space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              createdRental.is_quotation ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              {createdRental.is_quotation ? <FileText className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">
                {createdRental.is_quotation ? 'Formal Price Quotation Issued!' : 'Rental Agreement Generated!'}
              </h2>
              <p className="text-sm font-mono font-bold text-blue-600 mt-1">{createdRental.rental_id}</p>
              <p className="text-xs text-slate-500 mt-1">
                {createdRental.is_quotation
                  ? `Quotation sent to client. Valid until ${createdRental.quotation_valid_until}.`
                  : 'Equipment successfully booked and reserved in fleet registry.'}
              </p>
            </div>

            {/* If quotation, show prominent 1-click Convert button */}
            {createdRental.is_quotation ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs max-w-md mx-auto space-y-3">
                <p className="text-amber-900 font-semibold">
                  Client approved the quotation? Convert it now to generate the tax invoice, lock the fleet assets, and issue the agreement.
                </p>
                <button
                  type="button"
                  disabled={converting}
                  onClick={handleConvertToBooking}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${converting ? 'animate-spin' : ''}`} />
                  <span>{converting ? 'Converting to Booking...' : 'Convert Quotation to Confirmed Booking'}</span>
                </button>
              </div>
            ) : null}

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setShowAgreementModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
              >
                <Printer className="w-4 h-4" />
                View & Print Agreement
              </button>
              <button
                onClick={() => navigate('/operations/dispatch')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
              >
                Go to Dispatch Desk
              </button>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        {currentStep < 8 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous Step
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 7 ? (
              <button
                type="button"
                disabled={currentStep === 2 && selectedAssetIds.length === 0}
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className={`flex items-center gap-1.5 px-6 py-2.5 text-xs font-black text-white rounded-xl shadow-md transition-all disabled:opacity-50 ${
                  bookingMode === 'quotation' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {submitting
                  ? 'Processing...'
                  : bookingMode === 'quotation'
                  ? 'Generate Price Quotation'
                  : 'Confirm & Lock Booking'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Agreement Modal */}
      {createdRental && (
        <AgreementModal
          isOpen={showAgreementModal}
          onClose={() => setShowAgreementModal(false)}
          rentalId={createdRental.id}
        />
      )}
    </div>
  );
};
