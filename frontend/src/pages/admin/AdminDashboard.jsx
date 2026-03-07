import { useState, useEffect, useCallback } from 'react';
import {
    Users, Stethoscope, Calendar, Clock, Search,
    Lock, Unlock, ChevronLeft, ChevronRight, Loader2,
    ShieldCheck, UserCircle, TrendingUp, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const ROLE_FILTER = [
    { label: 'All Roles', value: '' },
    { label: 'Patient', value: 'PATIENT' },
    { label: 'Doctor', value: 'DOCTOR' },
    { label: 'Admin', value: 'ADMIN' },
];

const APPT_STATUS_FILTER = [
    { label: 'All Status', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Rejected', value: 'REJECTED' },
];

const APPT_STATUS_CONFIG = {
    PENDING: { label: 'Pending', cls: 'appt-st-pending', Icon: AlertCircle },
    CONFIRMED: { label: 'Confirmed', cls: 'appt-st-confirmed', Icon: CheckCircle },
    COMPLETED: { label: 'Completed', cls: 'appt-st-completed', Icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', cls: 'appt-st-cancelled', Icon: XCircle },
    REJECTED: { label: 'Rejected', cls: 'appt-st-rejected', Icon: XCircle },
};

export default function AdminDashboard() {
    // Active tab: 'users' | 'appointments'
    const [activeTab, setActiveTab] = useState('users');

    // Stats
    const [stats, setStats] = useState({ doctors: 0, patients: 0, appointments: 0, revenue: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    // ── Users state ──
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [uPage, setUPage] = useState(1);
    const [uTotalPages, setUTotalPages] = useState(1);
    const [uTotal, setUTotal] = useState(0);
    const [roleFilter, setRoleFilter] = useState('');
    const [uSearch, setUSearch] = useState('');
    const [uSearchInput, setUSearchInput] = useState('');
    const [lockingId, setLockingId] = useState(null);

    // ── Appointments state ──
    const [appointments, setAppointments] = useState([]);
    const [loadingAppts, setLoadingAppts] = useState(true);
    const [aPage, setAPage] = useState(1);
    const [aTotalPages, setATotalPages] = useState(1);
    const [aTotal, setATotal] = useState(0);
    const [apptStatusFilter, setApptStatusFilter] = useState('');
    const [aSearch, setASearch] = useState('');
    const [aSearchInput, setASearchInput] = useState('');

    const LIMIT = 10;

    // ── Fetch Stats ──
    useEffect(() => {
        const fetchStats = async () => {
            setLoadingStats(true);
            try {
                const res = await api.get('/admin/stats');
                setStats(res.data.counts || {});
            } catch {
                toast.error('Failed to load statistics.');
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    // ── Fetch Users ──
    const fetchUsers = useCallback(async (pg, role, search) => {
        setLoadingUsers(true);
        try {
            const params = { page: pg, limit: LIMIT };
            if (role) params.role = role;
            if (search) params.search = search;
            const res = await api.get('/admin/users', { params });
            setUsers(res.data.users || []);
            setUTotalPages(res.data.totalPages || 1);
            setUTotal(res.data.total || 0);
        } catch {
            toast.error('Failed to load users.');
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers(uPage, roleFilter, uSearch);
    }, [uPage, roleFilter, uSearch, fetchUsers, activeTab]);

    // ── Fetch Appointments ──
    const fetchAppointments = useCallback(async (pg, status, search) => {
        setLoadingAppts(true);
        try {
            const params = { page: pg, limit: LIMIT };
            if (status) params.status = status;
            if (search) params.search = search;
            const res = await api.get('/admin/appointments', { params });
            setAppointments(res.data.appointments || []);
            setATotalPages(res.data.totalPages || 1);
            setATotal(res.data.total || 0);
        } catch {
            toast.error('Failed to load appointments.');
        } finally {
            setLoadingAppts(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'appointments') fetchAppointments(aPage, apptStatusFilter, aSearch);
    }, [aPage, apptStatusFilter, aSearch, fetchAppointments, activeTab]);

    // ── Handlers: Users ──
    const handleUSearch = (e) => { e.preventDefault(); setUSearch(uSearchInput); setUPage(1); };
    const handleRoleChange = (val) => { setRoleFilter(val); setUPage(1); };

    const handleToggleLock = async (userId, currentlyLocked) => {
        const action = currentlyLocked ? 'unlock' : 'lock';
        if (!window.confirm(`Are you sure you want to ${action} this account?`)) return;
        setLockingId(userId);
        try {
            await api.put(`/admin/users/${userId}/lock`, { isLocked: !currentlyLocked });
            toast.success(currentlyLocked ? 'Account unlocked.' : 'Account locked.');
            fetchUsers(uPage, roleFilter, uSearch);
        } catch (err) {
            toast.error(err.response?.data?.error || `Failed to ${action} account.`);
        } finally { setLockingId(null); }
    };

    // ── Handlers: Appointments ──
    const handleASearch = (e) => { e.preventDefault(); setASearch(aSearchInput); setAPage(1); };
    const handleApptStatusChange = (val) => { setApptStatusFilter(val); setAPage(1); };

    // ── Helpers ──
    const formatDate = (ds) => {
        if (!ds) return '—';
        return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const formatTime = (t) => t ? t.slice(0, 5) : '—';
    const roleBadgeClass = (r) => {
        if (r === 'PATIENT') return 'role-patient';
        if (r === 'DOCTOR') return 'role-doctor';
        if (r === 'ADMIN') return 'role-admin';
        return '';
    };

    return (
        <div className="admin-dashboard">
            {/* ── Header ── */}
            <div className="adm-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>System overview and management.</p>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="adm-stats-row">
                <div className="adm-stat-card adm-stat-blue">
                    <div className="adm-stat-icon"><Stethoscope size={22} /></div>
                    <div>
                        <p className="adm-stat-label">Doctors</p>
                        <h2 className="adm-stat-num">{loadingStats ? '—' : stats.doctors}</h2>
                    </div>
                </div>
                <div className="adm-stat-card adm-stat-green">
                    <div className="adm-stat-icon"><Users size={22} /></div>
                    <div>
                        <p className="adm-stat-label">Patients</p>
                        <h2 className="adm-stat-num">{loadingStats ? '—' : stats.patients}</h2>
                    </div>
                </div>
                <div className="adm-stat-card adm-stat-purple">
                    <div className="adm-stat-icon"><Calendar size={22} /></div>
                    <div>
                        <p className="adm-stat-label">Appointments</p>
                        <h2 className="adm-stat-num">{loadingStats ? '—' : stats.appointments}</h2>
                    </div>
                </div>
                <div className="adm-stat-card adm-stat-amber">
                    <div className="adm-stat-icon"><TrendingUp size={22} /></div>
                    <div>
                        <p className="adm-stat-label">Revenue</p>
                        <h2 className="adm-stat-num">{loadingStats ? '—' : `$${stats.revenue}`}</h2>
                    </div>
                </div>
            </div>

            {/* ── Main Tab Switcher ── */}
            <div className="adm-main-tabs">
                <button
                    className={`adm-main-tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={16} /> Users <span className="adm-tab-count">{uTotal}</span>
                </button>
                <button
                    className={`adm-main-tab ${activeTab === 'appointments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('appointments')}
                >
                    <Calendar size={16} /> Appointments <span className="adm-tab-count">{aTotal}</span>
                </button>
            </div>

            {/* ═══════════ USERS TAB ═══════════ */}
            {activeTab === 'users' && (
                <div className="adm-users-section card">
                    <div className="adm-users-header">
                        <div className="adm-users-title-row">
                            <ShieldCheck size={20} className="adm-icon-blue" />
                            <h3>User Management</h3>
                            <span className="adm-user-count">{uTotal} total</span>
                        </div>
                        <div className="adm-users-controls">
                            <div className="adm-role-tabs">
                                {ROLE_FILTER.map(rf => (
                                    <button
                                        key={rf.value}
                                        className={`adm-role-btn ${roleFilter === rf.value ? 'active' : ''}`}
                                        onClick={() => handleRoleChange(rf.value)}
                                    >{rf.label}</button>
                                ))}
                            </div>
                            <form className="adm-search-form" onSubmit={handleUSearch}>
                                <Search size={16} className="adm-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={uSearchInput}
                                    onChange={(e) => setUSearchInput(e.target.value)}
                                />
                            </form>
                        </div>
                    </div>

                    {loadingUsers ? (
                        <div className="adm-loading"><Loader2 size={28} className="spin-icon" /><p>Loading users...</p></div>
                    ) : users.length === 0 ? (
                        <div className="adm-empty"><UserCircle size={48} className="adm-empty-icon" /><h4>No users found</h4><p>Try adjusting your search or filter.</p></div>
                    ) : (
                        <div className="adm-table-wrap">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} className={u.is_locked ? 'row-locked' : ''}>
                                            <td>
                                                <div className="adm-user-cell">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random&size=36`}
                                                        alt={u.name}
                                                        className="adm-user-avatar"
                                                    />
                                                    <span className="adm-user-name">{u.name}</span>
                                                </div>
                                            </td>
                                            <td className="adm-td-email">{u.email}</td>
                                            <td><span className={`adm-role-badge ${roleBadgeClass(u.role)}`}>{u.role}</span></td>
                                            <td>
                                                {u.is_locked
                                                    ? <span className="adm-status-badge status-locked"><Lock size={12} /> Locked</span>
                                                    : <span className="adm-status-badge status-active"><Unlock size={12} /> Active</span>
                                                }
                                            </td>
                                            <td className="adm-td-date">{formatDate(u.created_at)}</td>
                                            <td>
                                                <button
                                                    className={`adm-action-btn ${u.is_locked ? 'btn-unlock' : 'btn-lock'}`}
                                                    onClick={() => handleToggleLock(u.id, u.is_locked)}
                                                    disabled={lockingId === u.id}
                                                >
                                                    {lockingId === u.id ? <Loader2 size={14} className="spin-icon" />
                                                        : u.is_locked ? <><Unlock size={14} /> Unlock</> : <><Lock size={14} /> Lock</>}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loadingUsers && uTotalPages > 1 && (
                        <div className="adm-pagination">
                            <button className="adm-page-btn" disabled={uPage === 1} onClick={() => setUPage(p => p - 1)}>
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <span className="adm-page-info">Page {uPage} of {uTotalPages}</span>
                            <button className="adm-page-btn" disabled={uPage === uTotalPages} onClick={() => setUPage(p => p + 1)}>
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ APPOINTMENTS TAB ═══════════ */}
            {activeTab === 'appointments' && (
                <div className="adm-users-section card">
                    <div className="adm-users-header">
                        <div className="adm-users-title-row">
                            <Calendar size={20} className="adm-icon-blue" />
                            <h3>All Appointments</h3>
                            <span className="adm-user-count">{aTotal} total</span>
                        </div>
                        <div className="adm-users-controls">
                            <div className="adm-role-tabs">
                                {APPT_STATUS_FILTER.map(sf => (
                                    <button
                                        key={sf.value}
                                        className={`adm-role-btn ${apptStatusFilter === sf.value ? 'active' : ''}`}
                                        onClick={() => handleApptStatusChange(sf.value)}
                                    >{sf.label}</button>
                                ))}
                            </div>
                            <form className="adm-search-form" onSubmit={handleASearch}>
                                <Search size={16} className="adm-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by patient or doctor name..."
                                    value={aSearchInput}
                                    onChange={(e) => setASearchInput(e.target.value)}
                                />
                            </form>
                        </div>
                    </div>

                    {loadingAppts ? (
                        <div className="adm-loading"><Loader2 size={28} className="spin-icon" /><p>Loading appointments...</p></div>
                    ) : appointments.length === 0 ? (
                        <div className="adm-empty"><Calendar size={48} className="adm-empty-icon" /><h4>No appointments found</h4><p>Try adjusting your search or filter.</p></div>
                    ) : (
                        <div className="adm-table-wrap">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.map(a => {
                                        const stCfg = APPT_STATUS_CONFIG[a.status] || APPT_STATUS_CONFIG.PENDING;
                                        const StIcon = stCfg.Icon;
                                        return (
                                            <tr key={a.id}>
                                                <td>
                                                    <div className="adm-user-cell">
                                                        <img
                                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(a.patient_name || 'P')}&background=3b82f6&color=fff&size=36`}
                                                            alt={a.patient_name}
                                                            className="adm-user-avatar"
                                                        />
                                                        <div>
                                                            <span className="adm-user-name">{a.patient_name || '—'}</span>
                                                            <span className="adm-sub-text">{a.patient_email || ''}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="adm-user-cell">
                                                        <img
                                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(a.doctor_name || 'D')}&background=16a34a&color=fff&size=36`}
                                                            alt={a.doctor_name}
                                                            className="adm-user-avatar"
                                                        />
                                                        <div>
                                                            <span className="adm-user-name">{a.doctor_name || '—'}</span>
                                                            <span className="adm-sub-text">{a.doctor_email || ''}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="adm-td-date">{formatDate(a.date)}</td>
                                                <td>
                                                    <span className="adm-time-cell">
                                                        <Clock size={13} />
                                                        {formatTime(a.start_time)} – {formatTime(a.end_time)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`adm-status-badge ${stCfg.cls}`}>
                                                        <StIcon size={12} /> {stCfg.label}
                                                    </span>
                                                </td>
                                                <td className="adm-td-date">{formatDate(a.created_at)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loadingAppts && aTotalPages > 1 && (
                        <div className="adm-pagination">
                            <button className="adm-page-btn" disabled={aPage === 1} onClick={() => setAPage(p => p - 1)}>
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <span className="adm-page-info">Page {aPage} of {aTotalPages}</span>
                            <button className="adm-page-btn" disabled={aPage === aTotalPages} onClick={() => setAPage(p => p + 1)}>
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
