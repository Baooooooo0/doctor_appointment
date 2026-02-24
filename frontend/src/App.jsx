import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ConnectionTest from './pages/ConnectionTest';

// ─── Page placeholders (sẽ thay bằng components thực) ────────────────────────
const Placeholder = ({ title }) => (
  <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
    <h2>🚧 {title}</h2>
    <p>Page đang được xây dựng...</p>
  </div>
);

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return children;
}

// ─── Auto-redirect khi đã đăng nhập vào /login ───────────────────────────────
function PublicRoute({ children }) {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated) {
    if (role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
    if (role === 'DOCTOR') return <Navigate to="/doctor/dashboard" replace />;
    if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
}

// ─── Router ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Placeholder title="Healthcare Landing Page" />} />
      <Route path="/test" element={<ConnectionTest />} />
      <Route path="/doctors" element={<Placeholder title="Search Doctors" />} />
      <Route path="/doctors/:id" element={<Placeholder title="Doctor Detail & Booking" />} />
      <Route path="/login" element={
        <PublicRoute><Placeholder title="Login / Register" /></PublicRoute>
      } />

      {/* Patient */}
      <Route path="/patient/dashboard" element={
        <ProtectedRoute allowedRoles={['PATIENT']}>
          <Placeholder title="Patient Dashboard" />
        </ProtectedRoute>
      } />
      <Route path="/patient/appointments" element={
        <ProtectedRoute allowedRoles={['PATIENT']}>
          <Placeholder title="My Appointments" />
        </ProtectedRoute>
      } />

      {/* Doctor */}
      <Route path="/doctor/dashboard" element={
        <ProtectedRoute allowedRoles={['DOCTOR']}>
          <Placeholder title="Doctor Dashboard" />
        </ProtectedRoute>
      } />
      <Route path="/doctor/schedules" element={
        <ProtectedRoute allowedRoles={['DOCTOR']}>
          <Placeholder title="Schedule Manager" />
        </ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Placeholder title="Admin Dashboard" />
        </ProtectedRoute>
      } />

      {/* Shared */}
      <Route path="/profile" element={
        <ProtectedRoute><Placeholder title="User Profile" /></ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<Placeholder title="404 – Not Found" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
