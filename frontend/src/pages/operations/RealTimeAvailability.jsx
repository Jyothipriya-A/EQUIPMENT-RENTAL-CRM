import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rentalApi, inventoryApi } from '../../api';
import { Badge } from '../../components/Badge';
import {
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Clock,
  IndianRupee,
  Shield,
  ArrowRight
} from 'lucide-react';

export const RealTimeAvailability = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextWeekStr);

  const [availabilityResults, setAvailabilityResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAuxData();
    // Run initial search
    handleSearch(todayStr, nextWeekStr);
  }, []);

  const loadAuxData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        inventoryApi.getCategories(),
        inventoryApi.getProducts({ page_size: 100 }),
      ]);
      setCategories(catRes.data.results || catRes.data || []);
      setProducts(prodRes.data.results || prodRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (sDate = startDate, eDate = endDate) => {
    if (!sDate || !eDate) {
      setError('Please select both start and expected return dates.');
      return;
    }
    if (new Date(eDate) < new Date(sDate)) {
      setError('Expected return date cannot be before rental start date.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = {
        start_date: sDate,
        end_date: eDate,
      };
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedProduct) params.product_id = selectedProduct;

      const res = await rentalApi.checkAvailability(params);
      setAvailabilityResults(res.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to calculate live availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookProduct = (product, availableAssets) => {
    // Navigate to Create Rental Booking wizard with preselected product & dates
    navigate('/operations/new-booking', {
      state: {
        preselectedProductId: product.product_id,
        preselectedStartDate: startDate,
        preselectedEndDate: endDate,
        suggestedAssetId: availableAssets[0]?.id,
      },
    });
  };

  const durationDays = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Real-Time Fleet Availability</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Dynamic availability engine calculated from actual physical asset records, maintenance schedules, and overlapping bookings.
        </p>
      </div>

      {/* Query Search Card */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="">All Equipment Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Specific Product (Optional)</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="">All Products</option>
              {products
                .filter((p) => !selectedCategory || p.category === Number(selectedCategory))
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.product_code})</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rental Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Return Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-600">
            Selected Duration: <strong className="text-blue-600">{durationDays} Day(s)</strong>
          </span>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Checking Availability...' : 'Calculate Live Availability'}
          </button>
        </div>
      </div>

      {/* Results View */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Checking physical serial units and booking conflicts...</p>
        </div>
      ) : hasSearched && availabilityResults.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-800">No equipment units available</h3>
          <p className="text-xs text-slate-500 mt-1">
            All physical units for this selection are either currently reserved, dispatched, or undergoing maintenance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availabilityResults.map((item) => (
            <div
              key={item.product_id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100'}
                    alt={item.product_name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                      {item.category_name}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{item.product_name}</h3>
                    <p className="font-mono text-[11px] text-slate-400">{item.product_code}</p>
                  </div>
                </div>

                {/* Availability Badge */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-600 font-medium">Available Units:</span>
                  <span
                    className={`font-black px-2.5 py-0.5 rounded-full text-xs ${
                      item.available_quantity > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.available_quantity} of {item.total_quantity} Ready
                  </span>
                </div>

                {/* Rates & Estimates */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex justify-between">
                    <span>Daily Rate:</span>
                    <span className="font-bold text-slate-900">₹{Number(item.daily_rate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Deposit:</span>
                    <span className="font-semibold text-amber-700">₹{Number(item.security_deposit).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="font-bold text-slate-800">Est. Rental ({durationDays}d):</span>
                    <span className="font-black text-blue-600">₹{Number(item.estimated_rental_for_period).toLocaleString()}</span>
                  </div>
                </div>

                {/* Physical Units Serial Numbers List */}
                {item.available_assets.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Available Physical Units
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {item.available_assets.slice(0, 3).map((a) => (
                        <span key={a.id} className="font-mono text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                          {a.serial_number} ({a.condition})
                        </span>
                      ))}
                      {item.available_assets.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{item.available_assets.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Book Action */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                {item.available_quantity > 0 ? (
                  <button
                    onClick={() => handleBookProduct(item, item.available_assets)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
                  >
                    <span>Book This Equipment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
                  >
                    Out of Stock for Selected Dates
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
