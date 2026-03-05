import { useState, useEffect } from 'react';
import {
    Calendar, Clock, Users, CheckCircle2,
    XCircle, Star, Bell, ChevronRight,
    TrendingUp, AlertCircle
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './DoctorDashboard.css';

export default function DoctorDashboard() {
    const { user } = useAuth();

    const [profile, setProfile] = useState(null);

    // Stats per status
    const [stats, setStats] = useState({
        total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0
    });

    // Today's schedule slots
    const [todaySlots, setTodaySlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(true);

    // Pending appointments waiting for action
    const [pendingAppts, setPendingAppts] = useState([]);
    const [loadingPending, setLoadingPending] = useState(true);

    // Recent notifications
    const [notifications, setNotifications] = useState([]);

    // Action loading state
    const [actionId, setActionId] = useState(null);

    const today = new Date().toISOString().split('T')[0];

    // ── Fetch all data on mount ───────────────────────────────────────────────
    useEffect(() => {
        fetchProfile();
        fetchStats();
        fetchTodaySchedule();
        fetchPendingAppointments();
        fetchNotifications();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/doctors/me');
            setProfile(res.data);
        } catch (e) { /* silent */ }
    };

    const fetchStats = async () => {
        try {
            const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
            const counts = await Promise.all(
                statuses.map(s =>
                    api.get('/appointments/me', { params: { status: s, limit: 1 } })
                        .then(r => r.data.meta?.total || 0)
                        .catch(() => 0)
                )
            );
            // Also fetch total without filter
            const total = await api.get('/appointments/me', { params: { limit: 1 } })
                .then(r => r.data.meta?.total || 0).catch(() => 0);
            setStats({
                total,
                pending: counts[0],
                confirmed: counts[1],
                completed: counts[2],
                cancelled: counts[3],
            });
        } catch (e) { /* silent */ }
    };

    const fetchTodaySchedule = async () => {
        setLoadingSlots(true);
        try {
            const res = await api.get('/schedules/me', { params: { date: today } });
            setTodaySlots(res.data || []);
        } catch (e) {
            console.error('Failed to load schedule:', e);
        } finally {
            setLoadingSlots(false);
        }
    };

    const fetchPendingAppointments = async () => {
        setLoadingPending(true);
        try {
            const res = await api.get('/appointments/me', {
                params: { status: 'PENDING', limit: 5 }
            });
            setPendingAppts(res.data.data || []);
        } catch (e) {
            console.error('Failed to load pending:', e);
        } finally {
            setLoadingPending(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications((res.data || []).slice(0, 5));
        } catch (e) { /* silent */ }
    };

    // ── Appointment actions ───────────────────────────────────────────────────
    const handleConfirm = async (id) => {
        setActionId(id);
        try {
            await api.put(`/appointments/${id}/confirm`);
            toast.success('Appointment confirmed!');
            fetchPendingAppointments();
            fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to confirm');
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Reject this appointment?')) return;
        setActionId(id);
        try {
            await api.put(`/appointments/${id}/reject`);
            toast.success('Appointment rejected.');
            fetchPendingAppointments();
            fetchStats();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to reject');
        } finally {
            setActionId(null);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const formatDate = (ds) => {
        if (!ds) return '—';
        return new Date(ds).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (t) => t ? t.slice(0, 5) : '—';

    const timeAgo = (ds) => {
        const diff = Date.now() - new Date(ds).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="doc-dashboard">
            {/* ── Hero Welcome ── */}
            <div className="doc-welcome-banner">
                <div className="welcome-text">
                    <h1>Good day, Dr. {user?.name || 'Doctor'} 👋</h1>
                    <p>Here's a summary of your practice. Stay on top of your appointments.</p>
                </div>
                <div className="welcome-date">
                    <Calendar size={16} />
                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="doc-stats-row">
                <div className="doc-stat-card total">
                    <div className="stat-icon-wrap"><Users size={22} /></div>
                    <div>
                        <p className="stat-label">Total Appointments</p>
                        <h2 className="stat-num">{stats.total}</h2>
                    </div>
                </div>
                <div className="doc-stat-card pending">
                    <div className="stat-icon-wrap"><AlertCircle size={22} /></div>
                    <div>
                        <p className="stat-label">Awaiting Review</p>
                        <h2 className="stat-num">{stats.pending}</h2>
                    </div>
                </div>
                <div className="doc-stat-card confirmed">
                    <div className="stat-icon-wrap"><TrendingUp size={22} /></div>
                    <div>
                        <p className="stat-label">Confirmed</p>
                        <h2 className="stat-num">{stats.confirmed}</h2>
                    </div>
                </div>
                <div className="doc-stat-card completed">
                    <div className="stat-icon-wrap"><CheckCircle2 size={22} /></div>
                    <div>
                        <p className="stat-label">Completed</p>
                        <h2 className="stat-num">{stats.completed}</h2>
                    </div>
                </div>
                {profile && (
                    <div className="doc-stat-card rating">
                        <div className="stat-icon-wrap"><Star size={22} /></div>
                        <div>
                            <p className="stat-label">Rating</p>
                            <h2 className="stat-num">{profile.rating ?? '—'}</h2>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Main Grid ── */}
            <div className="doc-main-grid">
                {/* ── Left: Pending Appointments ── */}
                <div className="doc-section">
                    <div className="section-header">
                        <h3>Pending Requests</h3>
                        {stats.pending > 5 && (
                            <a href="/doctor/appointments" className="section-link">
                                View all <ChevronRight size={14} />
                            </a>
                        )}
                    </div>

                    {loadingPending ? (
                        <div className="doc-spinner-wrap"><div className="spinner"></div></div>
                    ) : pendingAppts.length === 0 ? (
                        <div className="doc-empty">
                            <CheckCircle2 size={36} className="empty-ok-icon" />
                            <p>No pending appointments — all clear!</p>
                        </div>
                    ) : (
                        <div className="pending-list">
                            {pendingAppts.map(appt => (
                                <div className="pending-card" key={appt.id}>
                                    <div className="pending-info">
                                        <div className="pending-avatar">P</div>
                                        <div>
                                            <p className="pending-label">Patient Appointment</p>
                                            <span className="pending-meta">
                                                <Calendar size={13} /> {formatDate(appt.date)}
                                                &nbsp;·&nbsp;
                                                <Clock size={13} /> {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pending-btns">
                                        <button
                                            className="btn-action btn-confirm"
                                            onClick={() => handleConfirm(appt.id)}
                                            disabled={actionId === appt.id}
                                        >
                                            <CheckCircle2 size={14} /> Confirm
                                        </button>
                                        <button
                                            className="btn-action btn-reject"
                                            onClick={() => handleReject(appt.id)}
                                            disabled={actionId === appt.id}
                                        >
                                            <XCircle size={14} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Right column ── */}
                <div className="doc-right-col">
                    {/* Today's Schedule */}
                    <div className="doc-section">
                        <div className="section-header">
                            <h3>Today's Schedule</h3>
                            <span className="date-chip">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        {loadingSlots ? (
                            <div className="doc-spinner-wrap"><div className="spinner spinner-sm"></div></div>
                        ) : todaySlots.length === 0 ? (
                            <div className="doc-empty-sm">
                                <p>No slots scheduled for today.</p>
                            </div>
                        ) : (
                            <div className="slots-timeline">
                                {todaySlots.map(slot => (
                                    <div className={`slot-item ${slot.isAvailable ? 'slot-free' : 'slot-busy'}`} key={slot.id}>
                                        <div className="slot-dot"></div>
                                        <div className="slot-body">
                                            <span className="slot-time">{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</span>
                                            <span className={`slot-badge ${slot.isAvailable ? 'badge-free' : 'badge-booked'}`}>
                                                {slot.isAvailable ? 'Free' : 'Booked'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notifications */}
                    <div className="doc-section">
                        <div className="section-header">
                            <h3>Notifications</h3>
                            <Bell size={16} className="section-icon-muted" />
                        </div>
                        {notifications.length === 0 ? (
                            <div className="doc-empty-sm"><p>No new notifications.</p></div>
                        ) : (
                            <div className="notif-list">
                                {notifications.map((n, i) => (
                                    <div className={`notif-item ${!n.is_read ? 'unread' : ''}`} key={n.id || i}>
                                        <div className="notif-dot"></div>
                                        <div className="notif-body">
                                            <p className="notif-msg">{n.message}</p>
                                            {n.created_at && (
                                                <span className="notif-time">{timeAgo(n.created_at)}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Doctor Profile Summary */}
                    {profile && (
                        <div className="doc-section profile-summary-card">
                            <div className="profile-summary-header">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Doctor')}&background=136dec&color=fff&size=80`}
                                    alt={profile.name}
                                    className="profile-summary-avatar"
                                />
                                <div>
                                    <h4>{profile.name}</h4>
                                    <span className="profile-specialty-badge">{profile.specialty}</span>
                                </div>
                            </div>
                            <div className="profile-summary-meta">
                                <span><strong>{profile.experienceYears}</strong> yrs experience</span>
                                <span><Star size={13} className="star-inline" /> <strong>{profile.rating ?? '—'}</strong> rating</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
