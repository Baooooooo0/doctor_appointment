import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { login as apiLogin, register as apiRegister } from '../../api/auth.api';
import './AuthPage.css';

// ─── Icons ────────────────────────────────────────────────────────────────────
const HeartIcon = () => (
    <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
    </svg>
);

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onSwitchToRegister }) {
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.email || !form.password) { setError('Vui lòng điền đầy đủ thông tin.'); return; }
        setLoading(true);
        try {
            const res = await apiLogin({ email: form.email, password: form.password });
            login(res.data);
            toast.success('Đăng nhập thành công!');
            const role = res.data.user?.role;
            if (role === 'DOCTOR') navigate('/doctor/dashboard');
            else if (role === 'ADMIN') navigate('/admin/dashboard');
            else navigate('/patient/dashboard');
        } catch (err) {
            const msg = err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div className="form-header">
                <h2>Chào mừng trở lại</h2>
                <p>Nhập thông tin đăng nhập của bạn</p>
            </div>

            {error && <div className="alert-error">⚠ {error}</div>}

            <div className="form-group">
                <label className="form-label">Email</label>
                <input
                    type="email"
                    className="form-input"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={set('email')}
                    autoComplete="email"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <div className="form-input-wrap">
                    <input
                        type={showPw ? 'text' : 'password'}
                        className="form-input"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={set('password')}
                        autoComplete="current-password"
                    />
                    <span className="input-icon" onClick={() => setShowPw(p => !p)}>
                        {showPw ? <EyeOffIcon /> : <EyeIcon />}
                    </span>
                </div>
            </div>

            <div className="form-footer">
                <span />
                <button type="button" className="form-link">Quên mật khẩu?</button>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Đăng nhập'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' }}>
                Chưa có tài khoản?{' '}
                <button type="button" className="form-link" onClick={onSwitchToRegister}>
                    Đăng ký ngay
                </button>
            </p>
        </form>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Map backend field names → Vietnamese labels
const FIELD_LABELS = {
    name: 'Họ và tên', email: 'Email', password: 'Mật khẩu',
    phone: 'Số điện thoại', specialty: 'Chuyên khoa',
    experienceYears: 'Kinh nghiệm', dateOfBirth: 'Ngày sinh', gender: 'Giới tính',
};

// ─── Register Form ────────────────────────────────────────────────────────────
function RegisterForm({ onSwitchToLogin }) {
    const [role, setRole] = useState('PATIENT');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    // globalErrors: string[] – list of error messages for the top banner
    const [globalErrors, setGlobalErrors] = useState([]);
    // fieldErrors: { [fieldName]: string } – inline error per field
    const [fieldErrors, setFieldErrors] = useState({});
    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: '',
        specialty: '', experienceYears: '',
        dateOfBirth: '', gender: '',
    });
    const { login } = useAuth();
    const navigate = useNavigate();

    // Clear field error when user edits that field
    const set = (k) => (e) => {
        setForm(f => ({ ...f, [k]: e.target.value }));
        if (fieldErrors[k]) setFieldErrors(fe => ({ ...fe, [k]: '' }));
    };

    // Client-side validation → returns { [field]: message } or {}
    const validateForm = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Họ và tên không được để trống.';
        if (!form.email.trim()) errs.email = 'Email không được để trống.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            errs.email = 'Email không hợp lệ.';
        if (!form.password) errs.password = 'Mật khẩu không được để trống.';
        else if (form.password.length < 8)
            errs.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
        if (role === 'DOCTOR' && !form.specialty.trim())
            errs.specialty = 'Vui lòng nhập chuyên khoa.';
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGlobalErrors([]);
        setFieldErrors({});

        // Run client-side validation first
        const clientErrs = validateForm();
        if (Object.keys(clientErrs).length > 0) {
            setFieldErrors(clientErrs);
            setGlobalErrors(Object.values(clientErrs));
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: form.name,
                email: form.email,
                password: form.password,
                phone: form.phone || undefined,
                role,
                ...(role === 'DOCTOR' && {
                    specialty: form.specialty,
                    experienceYears: Number(form.experienceYears) || 0,
                }),
                ...(role === 'PATIENT' && {
                    dateOfBirth: form.dateOfBirth || undefined,
                    gender: form.gender || undefined,
                }),
            };
            const res = await apiRegister(payload);
            login(res.data);
            toast.success('Đăng ký thành công! Chào mừng bạn 🎉');
            navigate(role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard');
        } catch (err) {
            const data = err.response?.data;

            if (Array.isArray(data?.details) && data.details.length > 0) {
                // Backend returned validation details: [{ field, message }]
                const fe = {};
                const msgs = [];
                data.details.forEach(({ field, message }) => {
                    const label = FIELD_LABELS[field] || field || '';
                    const fullMsg = label ? `${label}: ${message}` : message;
                    if (field) fe[field] = message;  // inline
                    msgs.push(fullMsg);               // banner
                });
                setFieldErrors(fe);
                setGlobalErrors(msgs);
            } else {
                // Generic error (e.g. 409 email existed)
                const msg = data?.error || 'Đăng ký thất bại. Vui lòng thử lại.';
                setGlobalErrors([msg]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div className="form-header">
                <h2>Tạo tài khoản</h2>
                <p>Quản lý hành trình chăm sóc sức khoẻ của bạn</p>
            </div>

            {/* Role selector */}
            <div className="role-selector">
                {[
                    { value: 'PATIENT', icon: '🏥', name: 'Bệnh nhân', desc: 'Đặt lịch khám' },
                    { value: 'DOCTOR', icon: '👨‍⚕️', name: 'Bác sĩ', desc: 'Quản lý lịch' },
                ].map(r => (
                    <div
                        key={r.value}
                        className={`role-card ${role === r.value ? 'selected' : ''}`}
                        onClick={() => setRole(r.value)}
                    >
                        <div className="role-icon">{r.icon}</div>
                        <div className="role-name">{r.name}</div>
                        <div className="role-desc">{r.desc}</div>
                    </div>
                ))}
            </div>

            {/* Error banner – shows ALL errors */}
            {globalErrors.length > 0 && (
                <div className="alert-error">
                    <span style={{ marginRight: 6 }}>⚠</span>
                    <div>
                        {globalErrors.length === 1
                            ? globalErrors[0]
                            : <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {globalErrors.map((msg, i) => <li key={i}>{msg}</li>)}
                            </ul>
                        }
                    </div>
                </div>
            )}

            {/* Common fields */}
            <div className="form-group">
                <label className="form-label">Họ và tên *</label>
                <input
                    className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                    placeholder="Nguyễn Văn A" value={form.name} onChange={set('name')}
                />
                {fieldErrors.name && <div className="form-error-msg">⚠ {fieldErrors.name}</div>}
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                        type="email"
                        className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                        placeholder="name@example.com" value={form.email} onChange={set('email')}
                    />
                    {fieldErrors.email && <div className="form-error-msg">⚠ {fieldErrors.email}</div>}
                </div>
                <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
                    <input
                        className={`form-input ${fieldErrors.phone ? 'error' : ''}`}
                        placeholder="0901234567" value={form.phone} onChange={set('phone')}
                    />
                    {fieldErrors.phone && <div className="form-error-msg">⚠ {fieldErrors.phone}</div>}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Mật khẩu * (ít nhất 8 ký tự)</label>
                <div className="form-input-wrap">
                    <input
                        type={showPw ? 'text' : 'password'}
                        className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={set('password')}
                    />
                    <span className="input-icon" onClick={() => setShowPw(p => !p)}>
                        {showPw ? <EyeOffIcon /> : <EyeIcon />}
                    </span>
                </div>
                {fieldErrors.password && <div className="form-error-msg">⚠ {fieldErrors.password}</div>}
            </div>

            {/* Patient extra fields */}
            {role === 'PATIENT' && (
                <>
                    <div className="section-divider">Thông tin bệnh nhân</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Ngày sinh</label>
                            <input type="date" className="form-input" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Giới tính</label>
                            <select className="form-input" value={form.gender} onChange={set('gender')}>
                                <option value="">-- Chọn --</option>
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                                <option value="OTHER">Khác</option>
                            </select>
                        </div>
                    </div>
                </>
            )}

            {/* Doctor extra fields */}
            {role === 'DOCTOR' && (
                <>
                    <div className="section-divider">Thông tin chuyên môn</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Chuyên khoa *</label>
                            <input
                                className={`form-input ${fieldErrors.specialty ? 'error' : ''}`}
                                placeholder="Tim mạch, Nội khoa..." value={form.specialty} onChange={set('specialty')}
                            />
                            {fieldErrors.specialty && <div className="form-error-msg">⚠ {fieldErrors.specialty}</div>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kinh nghiệm (năm)</label>
                            <input type="number" min="0" className="form-input" placeholder="5" value={form.experienceYears} onChange={set('experienceYears')} />
                        </div>
                    </div>
                </>
            )}

            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14, marginTop: 4 }}>
                Bằng cách đăng ký, bạn đồng ý với{' '}
                <span className="form-link">Điều khoản dịch vụ</span> và{' '}
                <span className="form-link">Chính sách bảo mật</span>.
            </p>

            <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Tạo tài khoản'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' }}>
                Đã có tài khoản?{' '}
                <button type="button" className="form-link" onClick={onSwitchToLogin}>
                    Đăng nhập
                </button>
            </p>
        </form>
    );
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────
export default function AuthPage() {
    const [tab, setTab] = useState('login');

    return (
        <div className="auth-page">

            {/* Hero panel (left) */}
            <div className="auth-hero">
                <div className="hero-logo">
                    <HeartIcon />
                    HealthCare+
                </div>

                <nav className="hero-nav">
                    <a href="#">Trang chủ</a>
                    <a href="#">Chuyên khoa</a>
                    <a href="#">Về chúng tôi</a>
                    <a href="#">Liên hệ</a>
                </nav>

                <h1 className="hero-tagline">
                    Sức khoẻ của bạn,<br />
                    Ưu tiên của chúng tôi.
                </h1>
                <p className="hero-sub">
                    Kết nối với hơn 10.000+ chuyên gia hàng đầu và quản lý lịch sử y tế
                    của bạn một cách an toàn. Tin tưởng bởi hơn 1 triệu bệnh nhân.
                </p>

                <div className="hero-stats">
                    <div className="stat-item">
                        <span className="stat-value">10K+</span>
                        <span className="stat-label">Bác sĩ chuyên khoa</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">1M+</span>
                        <span className="stat-label">Bệnh nhân</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">50+</span>
                        <span className="stat-label">Chuyên khoa</span>
                    </div>
                </div>
            </div>

            {/* Form panel (right) */}
            <div className="auth-form-panel">
                {/* Tab switcher */}
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                        onClick={() => setTab('login')}
                    >
                        Đăng nhập
                    </button>
                    <button
                        className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
                        onClick={() => setTab('register')}
                    >
                        Đăng ký
                    </button>
                </div>

                {tab === 'login'
                    ? <LoginForm onSwitchToRegister={() => setTab('register')} />
                    : <RegisterForm onSwitchToLogin={() => setTab('login')} />
                }
            </div>
        </div>
    );
}
