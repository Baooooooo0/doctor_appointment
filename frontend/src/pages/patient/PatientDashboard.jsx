import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Calendar, Activity, Search, Plus, Clock,
    CheckCircle, XCircle, AlertCircle, Loader2, Bell, ChevronRight
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './PatientDashboard.css';

export default function PatientDashboard() {
    const { user } = useAuth();
    const firstName = user?.name ? user.name.split(' ')[0] : 'User';

    // Stats
    const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    // Upcoming appointments
    const [upcomingAppts, setUpcomingAppts] = useState([]);
    const [loadingAppts, setLoadingAppts] = useState(true);

    // Available doctors
    const [doctors, setDoctors] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(true);

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifs, setLoadingNotifs] = useState(true);

    // Cancel action
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        fetchStats();
        fetchUpcoming();
        fetchDoctors();
        fetchNotifications();
    }, []);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const statuses = ['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
            const counts = await Promise.all(
                statuses.map(s =>
                    api.get('/appointments/me', { params: { ...(s ? { status: s } : {}), limit: 1 } })
                        .then(r => r.data.meta?.total || 0)
                        .catch(() => 0)
                )
            );
            setStats({
                total: counts[0],
                upcoming: counts[1] + counts[2], // PENDING + CONFIRMED
                completed: counts[3],
                cancelled: counts[4],
            });
        } catch { /* silent */ } finally { setLoadingStats(false); }
    };

    const fetchUpcoming = async () => {
        setLoadingAppts(true);
        try {
            // Get PENDING and CONFIRMED appointments (upcoming)
            const [pending, confirmed] = await Promise.all([
                api.get('/appointments/me', { params: { status: 'PENDING', limit: 5 } }).then(r => r.data.data || []).catch(() => []),
                api.get('/appointments/me', { params: { status: 'CONFIRMED', limit: 5 } }).then(r => r.data.data || []).catch(() => []),
            ]);
            // Merge and sort by date
            const merged = [...pending, ...confirmed].sort((a, b) => new Date(a.date) - new Date(b.date));
            setUpcomingAppts(merged.slice(0, 5));
        } catch { /* silent */ } finally { setLoadingAppts(false); }
    };

    const fetchDoctors = async () => {
        setLoadingDocs(true);
        try {
            const res = await api.get('/doctors', { params: { page: 1, limit: 4 } });
            setDoctors(res.data.data || []);
        } catch { /* silent */ } finally { setLoadingDocs(false); }
    };

    const fetchNotifications = async () => {
        setLoadingNotifs(true);
        try {
            const res = await api.get('/notifications');
            setNotifications((res.data.items || []).slice(0, 5));
            setUnreadCount(res.data.unread || 0);
        } catch { /* silent */ } finally { setLoadingNotifs(false); }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
            toast.success('All notifications marked as read.');
        } catch { toast.error('Failed to mark notifications.'); }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        setCancellingId(id);
        try {
            await api.put(`/appointments/${id}/cancel`);
            toast.success('Appointment cancelled.');
            fetchUpcoming();
            fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to cancel.');
        } finally { setCancellingId(null); }
    };

    const formatDate = (ds) => {
        if (!ds) return '—';
        return new Date(ds).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };
    const formatTime = (t) => t ? t.slice(0, 5) : '—';

    const timeAgo = (ds) => {
        if (!ds) return '';
        const diff = Date.now() - new Date(ds).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const statusBadge = (s) => {
        if (s === 'CONFIRMED') return { cls: 'badge-blue', label: 'Confirmed', Icon: CheckCircle };
        if (s === 'PENDING') return { cls: 'badge-orange', label: 'Pending', Icon: AlertCircle };
        return { cls: 'badge-gray', label: s, Icon: Clock };
    };

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <h1>Dashboard Overview</h1>
                <p>Welcome back, {firstName}! Here's your health summary.</p>
            </header>

            <div className="dashboard-grid">
                {/* ── Main Column ── */}
                <div className="main-col">

                    {/* Health Stats */}
                    <div className="stat-cards">
                        <div className="stat-card" style={{ '--delay': '0s' }}>
                            <div className="stat-icon bg-blue-light text-blue"><Calendar size={20} /></div>
                            <div className="stat-info">
                                <div className="stat-label">Total Appointments</div>
                                {loadingStats ? <div className="skeleton skeleton-line w-12" style={{ marginTop: 4 }}></div> : <div className="stat-value">{stats.total}</div>}
                                <div className="stat-subtext text-gray">All time</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ '--delay': '0.05s' }}>
                            <div className="stat-icon bg-orange-light text-orange"><Activity size={20} /></div>
                            <div className="stat-info">
                                <div className="stat-label">Upcoming</div>
                                {loadingStats ? <div className="skeleton skeleton-line w-12" style={{ marginTop: 4 }}></div> : <div className="stat-value">{stats.upcoming}</div>}
                                <div className="stat-subtext text-orange">Pending/Confirmed</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ '--delay': '0.1s' }}>
                            <div className="stat-icon bg-green-light text-green"><CheckCircle size={20} /></div>
                            <div className="stat-info">
                                <div className="stat-label">Completed</div>
                                {loadingStats ? <div className="skeleton skeleton-line w-12" style={{ marginTop: 4 }}></div> : <div className="stat-value">{stats.completed}</div>}
                                <div className="stat-subtext text-green">Successfully past</div>
                            </div>
                        </div>

                        <div className="stat-card" style={{ '--delay': '0.15s' }}>
                            <div className="stat-icon bg-purple-light text-purple"><XCircle size={20} /></div>
                            <div className="stat-info">
                                <div className="stat-label">Cancelled</div>
                                {loadingStats ? <div className="skeleton skeleton-line w-12" style={{ marginTop: 4 }}></div> : <div className="stat-value">{stats.cancelled}</div>}
                                <div className="stat-subtext text-red">Missed/Cancelled</div>
                            </div>
                        </div>
                    </div>

                    {/* ── Upcoming Appointments ── */}
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h3>Upcoming Appointments</h3>
                            <Link to="/patient/appointments" className="link-view-all">View All</Link>
                        </div>

                        {loadingAppts ? (
                            <div className="appointment-list">
                                {[1, 2].map((i) => (
                                    <div className="card appointment-card" key={i}>
                                        <div className="appt-header">
                                            <div className="skeleton skeleton-line w-24"></div>
                                            <div className="skeleton skeleton-line w-24"></div>
                                        </div>
                                        <div className="appt-body">
                                            <div className="skeleton" style={{ width: 50, height: 50, borderRadius: 10 }}></div>
                                            <div className="doc-info" style={{ flex: 1 }}>
                                                <div className="skeleton skeleton-line w-full"></div>
                                                <div className="skeleton skeleton-line w-24"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : upcomingAppts.length === 0 ? (
                            <div className="dash-empty">
                                <Calendar size={36} className="dash-empty-icon" />
                                <p>No upcoming appointments.</p>
                                <Link to="/doctors" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                                    <Search size={14} /> Find a Doctor
                                </Link>
                            </div>
                        ) : (
                            <div className="appointment-list">
                                {upcomingAppts.map(appt => {
                                    const st = statusBadge(appt.status);
                                    const StIcon = st.Icon;
                                    return (
                                        <div className="card appointment-card" key={appt.id}>
                                            <div className="appt-header">
                                                <span className={`badge ${st.cls}`}>
                                                    <StIcon size={12} /> {st.label}
                                                </span>
                                                <div className="appt-time">
                                                    <Calendar size={14} /> {formatDate(appt.date)} • {formatTime(appt.start_time)}
                                                </div>
                                            </div>
                                            <div className="appt-body">
                                                <div className="doc-avatar">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(appt.doctor_name || 'D')}&background=136dec&color=fff&size=48`}
                                                        alt="Doctor"
                                                    />
                                                </div>
                                                <div className="doc-info">
                                                    <h4>{appt.doctor_name || `Doctor`}</h4>
                                                    <p>
                                                        {appt.doctor_specialty || 'Specialist'}
                                                        {' • '}
                                                        <Clock size={12} style={{ verticalAlign: -1 }} /> {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="appt-footer">
                                                <Link to="/patient/appointments" className="btn btn-outline btn-sm">View Details</Link>
                                                {appt.status === 'PENDING' && (
                                                    <button
                                                        className="btn btn-outline btn-sm text-red"
                                                        style={{ borderColor: '#fecaca', color: '#b91c1c' }}
                                                        onClick={() => handleCancel(appt.id)}
                                                        disabled={cancellingId === appt.id}
                                                    >
                                                        {cancellingId === appt.id ? 'Cancelling…' : 'Cancel'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* ── Available Doctors ── */}
                    <section className="dashboard-section" style={{ '--delay': '0.2s' }}>
                        <div className="section-header">
                            <h3>Available Doctors</h3>
                            <Link to="/doctors" className="link-view-all">View All</Link>
                        </div>

                        {loadingDocs ? (
                            <div className="doctors-grid">
                                {[1, 2, 3, 4].map(i => (
                                    <div className="card mini-doc-card" style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }} key={i}>
                                        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }}></div>
                                        <div style={{ flex: 1 }}>
                                            <div className="skeleton skeleton-line w-full"></div>
                                            <div className="skeleton skeleton-line w-12" style={{ marginBottom: 0 }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : doctors.length === 0 ? (
                            <div className="dash-empty"><p>No doctors available.</p></div>
                        ) : (
                            <div className="doctors-grid">
                                {doctors.map(doc => (
                                    <Link
                                        to={`/doctors/${doc.doctorId || doc.id}`}
                                        className="card mini-doc-card"
                                        key={doc.doctorId || doc.id}
                                        state={{ doctor: doc }}
                                    >
                                        <div className="doc-avatar-sm">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name || 'D')}&background=136dec&color=fff&size=40`}
                                                alt={doc.name}
                                            />
                                        </div>
                                        <div className="doc-info-sm">
                                            <h4>{doc.name}</h4>
                                            <p>{doc.specialty || 'Specialist'}</p>
                                        </div>
                                        <div className="btn-icon-light"><ChevronRight size={16} /></div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* ── Right Column ── */}
                <div className="side-col">

                    {/* Recent Notifications */}
                    <div className="card recent-activity-card">
                        <div className="section-header">
                            <h3>Recent Notifications {unreadCount > 0 && <span className="notif-unread-count">{unreadCount}</span>}</h3>
                            {unreadCount > 0 && <button className="link-view-all" onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>}
                        </div>

                        {loadingNotifs ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ display: 'flex', gap: 16 }}>
                                        <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6 }}></div>
                                        <div style={{ flex: 1 }}>
                                            <div className="skeleton skeleton-line w-24"></div>
                                            <div className="skeleton skeleton-line w-full"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="dash-empty"><Bell size={28} className="dash-empty-icon" /><p>No notifications.</p></div>
                        ) : (
                            <div className="activity-timeline">
                                {notifications.map((n, i) => (
                                    <div className={`activity-item ${!n.is_read ? 'unread' : ''}`} key={n.id || i}>
                                        <div className={`activity-dot ${!n.is_read ? 'bg-blue' : 'bg-gray'}`}></div>
                                        <div className="activity-content">
                                            <h4>{n.title || n.type || 'Notification'}</h4>
                                            <p>{n.content}</p>
                                            {n.created_at && <span className="activity-time">{timeAgo(n.created_at)}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="card-footer-center">
                            <Link to="/patient/appointments" className="link-view-all">View All Activity</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
