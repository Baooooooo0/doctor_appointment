import { useState, useEffect, useCallback } from 'react';
import {
    Calendar,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Stethoscope,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './DoctorAppointmentsPage.css';

const STATUS_TABS = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Rejected', value: 'REJECTED' },
];

const STATUS_CONFIG = {
    PENDING: { label: 'Pending', cls: 'doc-appt-status-pending', Icon: AlertCircle },
    CONFIRMED: { label: 'Confirmed', cls: 'doc-appt-status-confirmed', Icon: CheckCircle2 },
    COMPLETED: { label: 'Completed', cls: 'doc-appt-status-completed', Icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelled', cls: 'doc-appt-status-cancelled', Icon: XCircle },
    REJECTED: { label: 'Rejected', cls: 'doc-appt-status-rejected', Icon: XCircle },
};

export default function DoctorAppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [actionId, setActionId] = useState(null);

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

    const handleTabChange = (status) => {
        setActiveTab(status);
        setPage(1);
    };

    const refreshCurrentPage = () => {
        fetchAppointments(activeTab, page);
    };

    const handleConfirm = async (appointmentId) => {
        setActionId(appointmentId);
        try {
            await api.put(`/appointments/${appointmentId}/confirm`);
            toast.success('Appointment confirmed.');
            refreshCurrentPage();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to confirm appointment.');
        } finally {
            setActionId(null);
        }
    };

    const handleReject = async (appointmentId) => {
        if (!window.confirm('Reject this appointment?')) return;
        setActionId(appointmentId);
        try {
            await api.put(`/appointments/${appointmentId}/reject`);
            toast.success('Appointment rejected.');
            refreshCurrentPage();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to reject appointment.');
        } finally {
            setActionId(null);
        }
    };

    const handleComplete = async (appointmentId) => {
        if (!window.confirm('Mark this appointment as completed?')) return;
        setActionId(appointmentId);
        try {
            await api.put(`/appointments/${appointmentId}/complete`);
            toast.success('Appointment marked as completed.');
            refreshCurrentPage();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to complete appointment.');
        } finally {
            setActionId(null);
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (timeStr) => timeStr?.slice(0, 5) || '--:--';

    return (
        <div className="doc-appt-page">
            <div className="doc-appt-header">
                <div>
                    <h1>Appointments</h1>
                    <p>Review, confirm, reject, and complete patient appointments.</p>
                </div>
                <div className="doc-appt-total">{totalCount} Total</div>
            </div>

            <div className="doc-appt-tabs">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.value}
                        className={`doc-appt-tab ${activeTab === tab.value ? 'active' : ''}`}
                        onClick={() => handleTabChange(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="doc-appt-loading">
                    <Loader2 size={28} className="spin-icon" />
                    <p>Loading appointments...</p>
                </div>
            ) : appointments.length === 0 ? (
                <div className="doc-appt-empty">
                    <Stethoscope size={44} className="doc-appt-empty-icon" />
                    <h3>No appointments found</h3>
                    <p>No appointments match the selected status right now.</p>
                </div>
            ) : (
                <div className="doc-appt-list">
                    {appointments.map((appointment, index) => {
                        const status = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.PENDING;
                        const StatusIcon = status.Icon;
                        const isWorking = actionId === appointment.id;

                        return (
                            <div
                                key={appointment.id}
                                className="doc-appt-card"
                                data-status={appointment.status}
                                style={{ '--delay': `${index * 0.05}s` }}
                            >
                                <div className="doc-appt-main">
                                    <div className="doc-appt-avatar">
                                        <User size={20} />
                                    </div>

                                    <div className="doc-appt-info">
                                        <h3>{appointment.patient_name || 'Patient Appointment'}</h3>
                                        <div className="doc-appt-meta">
                                            <span>
                                                <Calendar size={14} />
                                                {formatDate(appointment.date)}
                                            </span>
                                            <span>
                                                <Clock size={14} />
                                                {formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="doc-appt-side">
                                    <span className={`doc-appt-status ${status.cls}`}>
                                        <StatusIcon size={13} />
                                        {status.label}
                                    </span>

                                    <div className="doc-appt-actions">
                                        {appointment.status === 'PENDING' && (
                                            <>
                                                <button
                                                    className="doc-appt-btn doc-appt-btn-primary"
                                                    onClick={() => handleConfirm(appointment.id)}
                                                    disabled={isWorking}
                                                >
                                                    {isWorking ? 'Working...' : 'Confirm'}
                                                </button>
                                                <button
                                                    className="doc-appt-btn doc-appt-btn-danger"
                                                    onClick={() => handleReject(appointment.id)}
                                                    disabled={isWorking}
                                                >
                                                    {isWorking ? 'Working...' : 'Reject'}
                                                </button>
                                            </>
                                        )}

                                        {appointment.status === 'CONFIRMED' && (
                                            <button
                                                className="doc-appt-btn doc-appt-btn-success"
                                                onClick={() => handleComplete(appointment.id)}
                                                disabled={isWorking}
                                            >
                                                {isWorking ? 'Working...' : 'Mark as Completed'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && totalPages > 1 && (
                <div className="doc-appt-pagination">
                    <button
                        className="doc-appt-page-btn"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>
                    <span className="doc-appt-page-info">Page {page} of {totalPages}</span>
                    <button
                        className="doc-appt-page-btn"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
