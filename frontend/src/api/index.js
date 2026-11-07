import client from './client';

export const authApi = {
  login: (credentials) => client.post('/auth/login/', credentials),
  me: () => client.get('/auth/me/'),
  getStaff: (params) => client.get('/auth/staff/', { params }),
  createStaff: (data) => client.post('/auth/staff/', data),
  updateStaff: (id, data) => client.patch(`/auth/staff/${id}/`, data),
  deleteStaff: (id) => client.delete(`/auth/staff/${id}/`),
};

export const inventoryApi = {
  getCategories: () => client.get('/categories/'),
  createCategory: (data) => client.post('/categories/', data),
  updateCategory: (id, data) => client.patch(`/categories/${id}/`, data),

  getProducts: (params) => client.get('/products/', { params }),
  getProductById: (id) => client.get(`/products/${id}/`),
  createProduct: (data) => client.post('/products/', data),
  updateProduct: (id, data) => client.patch(`/products/${id}/`, data),
  deleteProduct: (id) => client.delete(`/products/${id}/`),

  getAssets: (params) => client.get('/assets/', { params }),
  getAssetById: (id) => client.get(`/assets/${id}/`),
  createAsset: (data) => client.post('/assets/', data),
  updateAsset: (id, data) => client.patch(`/assets/${id}/`, data),
  getAssetHistory: (id) => client.get(`/assets/${id}/history/`),

  getSuppliers: (params) => client.get('/suppliers/', { params }),
  createSupplier: (data) => client.post('/suppliers/', data),
  updateSupplier: (id, data) => client.patch(`/suppliers/${id}/`, data),
};

export const customerApi = {
  getCustomers: (params) => client.get('/customers/', { params }),
  getCustomerById: (id) => client.get(`/customers/${id}/`),
  createCustomer: (data) => client.post('/customers/', data),
  updateCustomer: (id, data) => client.patch(`/customers/${id}/`, data),
  getCustomerRentalHistory: (id) => client.get(`/customers/${id}/rental_history/`),
  getCustomerPayments: (id) => client.get(`/customers/${id}/payments_history/`),
};

export const rentalApi = {
  checkAvailability: (params) => client.get('/rentals/availability/', { params }),
  createBooking: (data) => client.post('/rentals/create_booking/', data),
  createQuotation: (data) => client.post('/rentals/create_quotation/', data),
  convertQuotation: (id) => client.post(`/rentals/${id}/convert_quotation/`),
  getRentals: (params) => client.get('/rentals/', { params }),
  getRentalById: (id) => client.get(`/rentals/${id}/`),
  dispatchRental: (id, data) => client.post(`/rentals/${id}/dispatch/`, data),
  processReturn: (id, data) => client.post(`/rentals/${id}/process_return/`, data),
  inspectEquipment: (id, data) => client.post(`/rentals/${id}/inspect/`, data),
  settleBooking: (id, data) => client.post(`/rentals/${id}/settle/`, data),
  extendRental: (id, data) => client.post(`/rentals/${id}/extend/`, data),
  cancelRental: (id, data) => client.post(`/rentals/${id}/cancel/`, data),
  getAgreementData: (id) => client.get(`/rentals/${id}/agreement/`),
  getAgreementPdfUrl: (id) => `${client.defaults.baseURL}/rentals/${id}/agreement_pdf/`,
};

export const billingApi = {
  getPayments: (params) => client.get('/payments/', { params }),
  createPayment: (data) => client.post('/payments/', data),
  getPaymentReceipt: (id) => client.get(`/payments/${id}/receipt/`),
  getLedgerEntries: (params) => client.get('/ledger/', { params }),
  getLedgerSummary: () => client.get('/ledger/summary/'),
  getDeposits: (params) => client.get('/deposits/', { params }),
  getInvoices: (params) => client.get('/invoices/', { params }),
  getInvoiceById: (id) => client.get(`/invoices/${id}/`),
  createInvoice: (data) => client.post('/invoices/', data),
  updateInvoice: (id, data) => client.patch(`/invoices/${id}/`, data),
};

export const maintenanceApi = {
  getMaintenances: (params) => client.get('/maintenance/', { params }),
  createMaintenance: (data) => client.post('/maintenance/', data),
  completeMaintenance: (id, data) => client.post(`/maintenance/${id}/complete/`, data),
};

export const notificationApi = {
  getNotifications: (params) => client.get('/notifications/', { params }),
  getUnreadCount: () => client.get('/notifications/unread_count/'),
  markRead: (id) => client.post(`/notifications/${id}/mark_read/`),
  markAllRead: () => client.post('/notifications/mark_all_read/'),
};

export const reportApi = {
  getDashboardStats: () => client.get('/reports/dashboard-stats/'),
  getRevenueReport: (params) => client.get('/reports/revenue/', { params }),
  getExportCsvUrl: (type) => `${client.defaults.baseURL}/reports/export-csv/?type=${type}`,
};

export const settingsApi = {
  getSettings: () => client.get('/settings/'),
  updateSettings: (data) => client.put('/settings/', data),
};
