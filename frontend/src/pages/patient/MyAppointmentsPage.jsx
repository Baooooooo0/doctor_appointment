import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './MyAppointmentsPage.css';

const STATUS_TABS = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Rejected', value: 'REJECTED' },
];

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', color: 'status-pending', icon: AlertCircle },
    CONFIRMED: { label: 'Confirmed', color: 'status-confirmed', icon: CheckCircle },
    COMPLETED: { label: 'Completed', color: 'status-completed', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', color: 'status-cancelled', icon: XCircle },
    REJECTED: { label: 'Rejected', color: 'status-rejected', icon: XCircle },
};

export default function MyAppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [cancellingId, setCancellingId] = useState(null);

    const LIMIT = 8;

    const fetchAppointments = useCallback(async (status, pageNum) => {
        setLoading(true);
        try {
            const params = { page: pageNum, limit: LIMIT };
            if (status) params.status = status;
            const res = await api.get('/appointments/me', { params });
            setAppointments(res.data.data || []);
            const meta = res.data.meta || {};
            setTotalPages(meta.totalPages || 1);
            setTotalCount(meta.total || 0);
        } catch (err) {
            toast.error('Failed to load appointments.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments(activeTab, page);
    }, [activeTab, page, fetchAppointments]);

    const handleTabChange = (tabValue) => {
        setActiveTab(tabValue);
        setPage(1);
    };

    const handleCancel = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        setCancellingId(appointmentId);
        try {
            await api.put(`/appointments/${appointmentId}/cancel`);
            toast.success('Appointment cancelled.');
            fetchAppointments(activeTab, page);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Cannot cancel this appointment.');
        } finally {
            setCancellingId(null);
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (timeStr) => timeStr?.slice(0, 5) || '--:--';

    return (
        <div className="appointments-page">
            {/* ── Header ── */}
            <div className="page-header">
                <div>
                    <h1>My Appointments</h1>
                    <p>View and manage all your medical appointments in one place.</p>
                </div>
                <div className="total-badge">{totalCount} Total</div>
            </div>

            {/* ── Status Tabs ── */}
            <div className="status-tabs">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.value}
                        className={`tab-btn ${activeTab === tab.value ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Content ── */}
            {loading ? (
                <div className="appt-list">
                    {[1, 2, 3, 4].map(i => (
                        <div className="appt-card" key={i}>
                            <div className="appt-card-left">
                                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }}></div>
                                <div className="appt-info" style={{ flex: 1, paddingTop: 4 }}>
                                    <div className="skeleton skeleton-line w-24"></div>
                                    <div className="appt-meta-row" style={{ marginTop: 4 }}>
                                        <div className="skeleton skeleton-line w-12" style={{ marginBottom: 0 }}></div>
                                        <div className="skeleton skeleton-line w-12" style={{ marginBottom: 0 }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="appt-card-right">
                                <div className="skeleton skeleton-line w-12" style={{ height: 26, borderRadius: 20, marginBottom: 0 }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : appointments.length === 0 ? (
                <div className="appt-empty">
                    <Calendar size={48} className="empty-icon" />
                    <h3>No appointments found</h3>
                    <p>You have no {activeTab ? activeTab.toLowerCase() : ''} appointments yet.</p>
                </div>
            ) : (
                <div className="appt-list">
                    {appointments.map((appt, index) => {
                        const status = STATUS_CONFIG[appt.status] || STATUS_CONFIG.PENDING;
                        const StatusIcon = status.icon;
                        return (
                            <div className="appt-card" key={appt.id} data-status={appt.status} style={{ '--delay': `${index * 0.05}s` }}>
                                <div className="appt-card-left">
                                    <div className="doctor-avatar-sm">
                                        <User size={20} />
                                    </div>
                                    <div className="appt-info">
                                        <h3>Doctor ID: {appt.doctor_id?.slice(0, 8)}…</h3>
                                        <div className="appt-meta-row">
                                            <span className="appt-meta-item">
                                                <Calendar size={14} />
                                                {formatDate(appt.date)}
                                            </span>
                                            <span className="appt-meta-item">
                                                <Clock size={14} />
                                                {formatTime(appt.start_time)} – {formatTime(appt.end_time)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="appt-card-right">
                                    <span className={`status-badge ${status.color}`}>
                                        <StatusIcon size={13} />
                                        {status.label}
                                    </span>

                                    {appt.status === 'PENDING' && (
                                        <button
                                            className="btn-cancel-appt"
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

            {/* ── Pagination ── */}
            {!loading && totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="btn-page"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <span className="page-info">Page {page} of {totalPages}</span>
                    <button
                        className="btn-page"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
