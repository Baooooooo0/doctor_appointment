import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ConnectionTest from './pages/ConnectionTest';
import AuthPage from './pages/auth/AuthPage';
import DashboardLayout from './components/layout/DashboardLayout';
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorSearchPage from './pages/patient/DoctorSearchPage';
import DoctorDetailPage from './pages/patient/DoctorDetailPage';
import MyAppointmentsPage from './pages/patient/MyAppointmentsPage';

// ─── Page placeholders (sẽ thay bằng components thực) ────────────────────────
const Placeholder = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: 40, fontFamily: 'Inter, sans-serif', maxWidth: 480 }}>
      <h2 style={{ marginBottom: 8 }}>🚧 {title}</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Page đang được xây dựng...</p>

      {/* Hiện thông tin user đang login để test */}
      {user && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
          padding: '14px 18px', marginBottom: 20, fontSize: 14
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: '#166534' }}>✅ Đăng nhập thành công</div>
          <div><b>Tên:</b> {user.name}</div>
          <div><b>Email:</b> {user.email}</div>
          <div><b>Role:</b> <code style={{ background: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>{user.role}</code></div>
        </div>
      )}

      <button
        onClick={handleLogout}
        style={{
          padding: '9px 20px', background: '#ef4444', color: '#fff',
          border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14
        }}
      >
        🚪 Đăng xuất &amp; quay về /login
      </button>
    </div>
  );
};

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
      <Route path="/login" element={
        <PublicRoute><AuthPage /></PublicRoute>
      } />

      {/* Patient */}
      <Route path="/doctors" element={
        <ProtectedRoute allowedRoles={['PATIENT']}>
          <DashboardLayout>
            <DoctorSearchPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctors/:id" element={
        <ProtectedRoute allowedRoles={['PATIENT']}>
          <DashboardLayout>
            <DoctorDetailPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/patient/dashboard" element={
        <ProtectedRoute allowedRoles={['PATIENT']}>
          <DashboardLayout>
            <PatientDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/patient/appointments" element={
        <ProtectedRoute allowedRoles={['PATIENT']}>
          <DashboardLayout>
            <MyAppointmentsPage />
          </DashboardLayout>
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
