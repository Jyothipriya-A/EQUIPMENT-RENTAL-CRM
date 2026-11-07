import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { MobileAdminLayout } from './layouts/MobileAdminLayout';
import { OperationsLayout } from './layouts/OperationsLayout';

// Auth
import { Login } from './pages/auth/Login';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Products } from './pages/admin/Products';
import { Assets } from './pages/admin/Assets';
import { Customers } from './pages/admin/Customers';
import { Rentals } from './pages/admin/Rentals';
import { ReturnsInspection } from './pages/admin/ReturnsInspection';
import { StaffManagement } from './pages/admin/StaffManagement';
import { Suppliers } from './pages/admin/Suppliers';
import { Maintenance } from './pages/admin/Maintenance';
import { PaymentsLedger } from './pages/admin/PaymentsLedger';
import { Reports } from './pages/admin/Reports';
import { NotificationsPage } from './pages/admin/NotificationsPage';
import { SettingsPage } from './pages/admin/SettingsPage';

// Operations Pages
import { OperationsDashboard } from './pages/operations/OperationsDashboard';
import { RealTimeAvailability } from './pages/operations/RealTimeAvailability';
import { CreateRentalBooking } from './pages/operations/CreateRentalBooking';
import { DispatchPage } from './pages/operations/DispatchPage';
import { ReturnsPage } from './pages/operations/ReturnsPage';
import { CustomerRegistration } from './pages/operations/CustomerRegistration';
import { BillingPage } from './pages/operations/BillingPage';

// Root redirect component based on authentication & role
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin' || user?.is_superuser) return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/operations/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Auth - Separate Admin & Staff Login Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Login initialPortal="admin" />} />
            <Route path="/staff/login" element={<Login initialPortal="staff" />} />

            {/* Desktop Admin Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="assets" element={<Assets />} />
              <Route path="customers" element={<Customers />} />
              <Route path="rentals" element={<Rentals />} />
              <Route path="dispatch" element={<DispatchPage />} />
              <Route path="returns-inspection" element={<ReturnsInspection />} />
              <Route path="payments" element={<PaymentsLedger initialTab="payments" />} />
              <Route path="ledger" element={<PaymentsLedger initialTab="ledger" />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="reports" element={<Reports />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Dedicated Mobile Admin Portal */}
            <Route
              path="/admin/mobile"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <MobileAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="assets" element={<Assets />} />
              <Route path="customers" element={<Customers />} />
              <Route path="rentals" element={<Rentals />} />
              <Route path="dispatch" element={<DispatchPage />} />
              <Route path="returns-inspection" element={<ReturnsInspection />} />
              <Route path="payments" element={<PaymentsLedger initialTab="payments" />} />
              <Route path="ledger" element={<PaymentsLedger initialTab="ledger" />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="reports" element={<Reports />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Operations / Front Desk Portal */}
            <Route
              path="/operations"
              element={
                <ProtectedRoute allowedRoles={['admin', 'front_desk', 'operations']}>
                  <OperationsLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/operations/dashboard" replace />} />
              <Route path="dashboard" element={<OperationsDashboard />} />
              <Route path="availability" element={<RealTimeAvailability />} />
              <Route path="new-booking" element={<CreateRentalBooking />} />
              <Route path="dispatch" element={<DispatchPage />} />
              <Route path="returns" element={<ReturnsPage />} />
              <Route path="customers" element={<CustomerRegistration />} />
              <Route path="billing" element={<BillingPage />} />
            </Route>

            {/* Default fallback */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
