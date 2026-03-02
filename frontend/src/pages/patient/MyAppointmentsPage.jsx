import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, XCircle, Search } from 'lucide-react';
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

const STATUS_STYLE = {
    PENDING: { label: 'Pending', cls: 'status-pending' },
    CONFIRMED: { label: 'Confirmed', cls: 'status-confirmed' },
    COMPLETED: { label: 'Completed', cls: 'status-completed' },
    CANCELLED: { label: 'Cancelled', cls: 'status-cancelled' },
    REJECTED: { label: 'Rejected', cls: 'status-rejected' },
};

const LIMIT = 8;

export default function MyAppointmentsPage() {
    const [activeTab, setActiveTab] = useState('');
    const [appointments, setAppointments] = useState([]);
    const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(null); // id of appointment being cancelled

    const fetchAppointments = useCallback(async (status, pageNum) => {
        setLoading(true);
        try {
            const params = { page: pageNum, limit: LIMIT };
            if (status) params.status = status;
            const res = await api.get('/appointments/me', { params });
            setAppointments(res.data.data || []);
            setMeta(res.data.meta || { totalPages: 1, total: 0 });
        } catch (err) {
            toast.error('Failed to load appointments.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments(activeTab, page);
    }, [activeTab, page, fetchAppointments]);

    const handleTabChange = (val) => {
        setActiveTab(val);
        setPage(1);
    };

    const handleCancel = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        setCancelling(appointmentId);
        try {
            await api.put(`/appointments/${appointmentId}/cancel`);
            toast.success('Appointment cancelled.');
            fetchAppointments(activeTab, page);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Could not cancel appointment.');
        } finally {
            setCancelling(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '—';
        return timeStr.slice(0, 5);
    };

    return (
        <div className="appt-page">
            <div className="appt-page-header">
                <div>
                    <h1>My Appointments</h1>
                    <p>Manage and track all your scheduled appointments.</p>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="status-tabs">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.value}
                        className={`tab-btn ${activeTab === tab.value ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.value)}
                    >
                        {tab.label}
                        {tab.value === '' && meta.total > 0 && (
                            <span className="tab-count">{meta.total}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="appt-loading">
                    <div className="spinner"></div>
                    <p>Loading appointments…</p>
                </div>
            ) : appointments.length === 0 ? (
                <div className="appt-empty">
                    <Calendar size={48} className="empty-icon" />
                    <h2>No appointments found</h2>
                    <p>
                        {activeTab
                            ? `You have no ${activeTab.toLowerCase()} appointments.`
                            : "You haven't booked any appointments yet."}
                    </p>
                </div>
            ) : (
                <>
                    <div className="appt-list">
                        {appointments.map(appt => {
                            const statusInfo = STATUS_STYLE[appt.status] || { label: appt.status, cls: '' };
                            const isCancelling = cancelling === appt.id;

                            return (
                                <div className="appt-card" key={appt.id}>
                                    {/* Left: Avatar placeholder */}
                                    <div className="appt-avatar">
                                        <User size={24} />
                                    </div>

                                    {/* Middle: Info */}
                                    <div className="appt-info">
                                        <div className="appt-doctor-name">Doctor's Appointment</div>
                                        <div className="appt-id-text">ID: {appt.id.slice(0, 8)}…</div>
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

                                    {/* Right: Status + Action */}
                                    <div className="appt-actions">
                                        <span className={`status-badge ${statusInfo.cls}`}>
                                            {statusInfo.label}
                                        </span>
                                        {appt.status === 'PENDING' && (
                                            <button
                                                className="btn btn-cancel"
                                                onClick={() => handleCancel(appt.id)}
                                                disabled={isCancelling}
                                            >
                                                {isCancelling ? (
                                                    'Cancelling…'
                                                ) : (
                                                    <><XCircle size={14} /> Cancel</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {meta.totalPages > 1 && (
                        <div className="appt-pagination">
                            <button
                                className="page-btn"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <span className="page-info">Page {page} of {meta.totalPages}</span>
                            <button
                                className="page-btn"
                                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                disabled={page === meta.totalPages}
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
