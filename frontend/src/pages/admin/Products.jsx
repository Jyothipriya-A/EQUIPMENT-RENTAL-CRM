import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../../api';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Eye,
  Wrench,
  AlertCircle,
  CheckCircle,
  IndianRupee,
  Layers
} from 'lucide-react';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [associatedAssets, setAssociatedAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    product_code: '',
    category: '',
    brand: '',
    model: '',
    description: '',
    image_url: '',
    daily_rental_rate: '',
    weekly_rental_rate: '',
    monthly_rental_rate: '',
    security_deposit: '',
    late_fee_per_day: '',
    default_rental_duration: 1,
    status: 'active',
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, selectedCategory, sortOrder]);

  const loadCategories = async () => {
    try {
      const res = await inventoryApi.getCategories();
      setCategories(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (sortOrder) params.ordering = sortOrder;

      const res = await inventoryApi.getProducts(params);
      setProducts(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setFormData({
      name: '',
      product_code: `PRD-${Date.now().toString().slice(-4)}`,
      category: categories[0]?.id || '',
      brand: '',
      model: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop',
      daily_rental_rate: '500',
      weekly_rental_rate: '3000',
      monthly_rental_rate: '10000',
      security_deposit: '2500',
      late_fee_per_day: '200',
      default_rental_duration: 1,
      status: 'active',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      product_code: product.product_code,
      category: product.category,
      brand: product.brand || '',
      model: product.model || '',
      description: product.description || '',
      image_url: product.image_url || '',
      daily_rental_rate: product.daily_rental_rate,
      weekly_rental_rate: product.weekly_rental_rate,
      monthly_rental_rate: product.monthly_rental_rate,
      security_deposit: product.security_deposit,
      late_fee_per_day: product.late_fee_per_day,
      default_rental_duration: product.default_rental_duration || 1,
      status: product.status,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (selectedProduct) {
        await inventoryApi.updateProduct(selectedProduct.id, formData);
      } else {
        await inventoryApi.createProduct(formData);
      }
      setIsFormOpen(false);
      loadProducts();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to save product. Please check fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to archive or delete this product?')) {
      try {
        await inventoryApi.deleteProduct(id);
        loadProducts();
      } catch (err) {
        alert(err.response?.data?.detail || 'Cannot delete product with existing assets or rentals.');
      }
    }
  };

  const handleViewAssets = async (product) => {
    setSelectedProduct(product);
    setIsAssetsModalOpen(true);
    setLoadingAssets(true);
    try {
      const res = await inventoryApi.getAssets({ product: product.id });
      setAssociatedAssets(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAssets(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage equipment types, rental pricing tiers, deposits, and associate physical assets.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, brand, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <option value="">Sort by Price</option>
            <option value="daily_rental_rate">Price: Low to High</option>
            <option value="-daily_rental_rate">Price: High to Low</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Products Table (Desktop) / Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading catalog...</div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            No products found matching your search.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Product Info</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-right">Daily Rate</th>
                    <th className="py-3.5 px-4 text-right">Weekly Rate</th>
                    <th className="py-3.5 px-4 text-right">Deposit</th>
                    <th className="py-3.5 px-4 text-center">Fleet Assets</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100'}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 bg-slate-100"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                            <p className="text-[11px] font-mono text-slate-500">{p.product_code} • {p.brand} {p.model}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{p.category_name}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">₹{Number(p.daily_rental_rate).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">₹{Number(p.weekly_rental_rate).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-700">₹{Number(p.security_deposit).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleViewAssets(p)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>{p.available_assets}/{p.total_assets} Available</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={p.status === 'active' ? 'Available' : 'Retired'} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100"
                          title="Delete / Archive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              {products.map((p) => (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={p.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100'}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{p.name}</h4>
                        <Badge status={p.status === 'active' ? 'Available' : 'Retired'} />
                      </div>
                      <p className="text-[11px] font-mono text-slate-500">{p.product_code} • {p.brand}</p>
                      <p className="text-xs font-extrabold text-blue-600 mt-1">₹{Number(p.daily_rental_rate).toLocaleString()} / day</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => handleViewAssets(p)}
                      className="text-blue-600 font-bold flex items-center gap-1"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      {p.available_assets}/{p.total_assets} Assets Available
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedProduct ? 'Edit Product' : 'Add New Equipment Product'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                placeholder="e.g. Hydraulic Plate Compactor 90kg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Product Code / SKU</label>
              <input
                type="text"
                required
                value={formData.product_code}
                onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase"
                placeholder="e.g. PRD-CMP-01"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand & Model</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  placeholder="Brand (e.g. Bosch)"
                />
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  placeholder="Model (e.g. GSH 16-30)"
                />
              </div>
            </div>
          </div>

          {/* Rates */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <p className="font-bold text-xs text-slate-800 mb-3 uppercase tracking-wider">Rental Pricing Tiers (₹ INR)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Daily Rate</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.daily_rental_rate}
                  onChange={(e) => setFormData({ ...formData, daily_rental_rate: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Weekly Rate</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.weekly_rental_rate}
                  onChange={(e) => setFormData({ ...formData, weekly_rental_rate: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Monthly Rate</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.monthly_rental_rate}
                  onChange={(e) => setFormData({ ...formData, monthly_rental_rate: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Security Deposit</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Late Fee Per Day</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.late_fee_per_day}
                  onChange={(e) => setFormData({ ...formData, late_fee_per_day: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Default Duration (Days)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.default_rental_duration}
                  onChange={(e) => setFormData({ ...formData, default_rental_duration: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Specs</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              placeholder="Detailed technical specifications..."
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Saving...' : selectedProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Associated Assets Modal */}
      <Modal
        isOpen={isAssetsModalOpen}
        onClose={() => setIsAssetsModalOpen(false)}
        title={`Physical Assets: ${selectedProduct?.name}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Individual physical units tracked by unique serial numbers in inventory.
          </p>

          {loadingAssets ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading units...</div>
          ) : associatedAssets.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No physical assets registered for this product yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-2">Asset ID</th>
                    <th className="pb-2">Serial Number</th>
                    <th className="pb-2">Condition</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {associatedAssets.map((ast) => (
                    <tr key={ast.id} className="text-slate-800">
                      <td className="py-2.5 font-bold font-mono">{ast.asset_id}</td>
                      <td className="py-2.5 font-mono text-slate-600">{ast.serial_number}</td>
                      <td className="py-2.5">
                        <Badge status={ast.current_condition} />
                      </td>
                      <td className="py-2.5">
                        <Badge status={ast.availability_status} />
                      </td>
                      <td className="py-2.5 text-slate-600">{ast.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsAssetsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
