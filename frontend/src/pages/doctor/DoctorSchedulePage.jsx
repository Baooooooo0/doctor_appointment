import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Trash2, Clock, Calendar, CheckCircle, XCircle,
    Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './DoctorSchedulePage.css';

// Build next 14 days
function buildDays(count = 14) {
    const days = [];
    for (let i = 0; i < count; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
}

const TIME_OPTIONS = [];
for (let h = 6; h <= 22; h++) {
    for (const m of ['00', '30']) {
        TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${m}`);
    }
}

function formatDateFull(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
}
function formatDayLabel(dateStr) {
    const d = new Date(dateStr);
    return {
        week: d.toLocaleDateString('en-US', { weekday: 'short' }),
        day: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' })
    };
}
function formatTime(t) { return t?.slice(0, 5) || '--:--'; }

function calcDuration(start, end) {
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins <= 0) return '';
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim() : `${mins}m`;
}

export default function DoctorSchedulePage() {
    const days = buildDays(14);
    const todayStr = days[0];

    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);

    // Side panel: 'single' | 'bulk' | null
    const [panel, setPanel] = useState(null);

    // Single add form
    const [newStart, setNewStart] = useState('09:00');
    const [newEnd, setNewEnd] = useState('10:00');
    const [creating, setCreating] = useState(false);

    // Bulk add form
    const [bulkSlots, setBulkSlots] = useState([{ date: selectedDate, startTime: '09:00', endTime: '10:00' }]);
    const [bulkCreating, setBulkCreating] = useState(false);

    const fetchSlots = useCallback(async (date) => {
        setLoadingSlots(true);
        try {
            const res = await api.get('/schedules/me', { params: { date } });
            setSlots(res.data || []);
        } catch {
            toast.error('Failed to load schedules.');
        } finally {
            setLoadingSlots(false);
        }
    }, []);

    useEffect(() => { fetchSlots(selectedDate); }, [selectedDate, fetchSlots]);

    /* ── Actions ── */
    const handleCreateSlot = async (e) => {
        e.preventDefault();
        if (newStart >= newEnd) { toast.error('Start time must be before end time.'); return; }
        setCreating(true);
        try {
            await api.post('/schedules', { date: selectedDate, startTime: newStart, endTime: newEnd });
            toast.success('Slot created!');
            setPanel(null);
            fetchSlots(selectedDate);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to create slot.');
        } finally { setCreating(false); }
    };

    const handleCancelSlot = async (id) => {
        if (!window.confirm('Cancel this slot?')) return;
        setCancellingId(id);
        try {
            await api.put(`/schedules/${id}/cancel`);
            toast.success('Slot cancelled.');
            fetchSlots(selectedDate);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Cannot cancel this slot.');
        } finally { setCancellingId(null); }
    };

    const handleBulkCreate = async (e) => {
        e.preventDefault();
        for (const s of bulkSlots) {
            if (s.startTime >= s.endTime) { toast.error('Each slot: start must be before end.'); return; }
        }
        setBulkCreating(true);
        try {
            const res = await api.post('/schedules/bulk', { slots: bulkSlots });
            const { created = [], skipped = [] } = res.data;
            toast.success(`${created.length} slot(s) created${skipped.length ? `, ${skipped.length} skipped` : ''}.`);
            setPanel(null);
            setBulkSlots([{ date: selectedDate, startTime: '09:00', endTime: '10:00' }]);
            fetchSlots(selectedDate);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Bulk create failed.');
        } finally { setBulkCreating(false); }
    };

    const availableCount = slots.filter(s => s.isAvailable).length;
    const bookedCount = slots.filter(s => !s.isAvailable).length;

    return (
        <div className="sch-page">
            {/* ══ Page Title ══ */}
            <div className="sch-top-bar">
                <div>
                    <h1 className="sch-title">Schedule Manager</h1>
                    <p className="sch-subtitle">Manage your availability and upcoming appointments</p>
                </div>
                <div className="sch-top-actions">
                    <button
                        className={`sch-btn sch-btn-ghost ${panel === 'bulk' ? 'active' : ''}`}
                        onClick={() => setPanel(panel === 'bulk' ? null : 'bulk')}
                    >
                        <Plus size={16} /> Bulk Add
                    </button>
                    <button
                        className={`sch-btn sch-btn-primary ${panel === 'single' ? 'active' : ''}`}
                        onClick={() => setPanel(panel === 'single' ? null : 'single')}
                    >
                        <Plus size={16} /> Add Slot
                    </button>
                </div>
            </div>

            {/* ══ Main 2-Column Layout ══ */}
            <div className="sch-layout">

                {/* LEFT: Calendar strip + slots list */}
                <div className="sch-main">

                    {/* ── Day Chooser strip ── */}
                    <div className="sch-day-strip card">
                        <div className="sch-day-strip-header">
                            <Calendar size={16} className="sch-icon-blue" />
                            <span>{formatDateFull(selectedDate)}</span>
                        </div>
                        <div className="sch-day-scroller">
                            {days.map(d => {
                                const { week, day } = formatDayLabel(d);
                                const active = d === selectedDate;
                                const isToday = d === todayStr;
                                return (
                                    <button
                                        key={d}
                                        className={`sch-day-chip ${active ? 'sch-day-chip--active' : ''} ${isToday && !active ? 'sch-day-chip--today' : ''}`}
                                        onClick={() => setSelectedDate(d)}
                                    >
                                        <span className="sch-day-week">{week}</span>
                                        <span className="sch-day-num">{day}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Slot List ── */}
                    <div className="sch-slots-list card">
                        <div className="sch-slots-header">
                            <h3>Slots for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h3>
                            <span className="sch-slot-count">{slots.length} slot{slots.length !== 1 ? 's' : ''}</span>
                        </div>

                        {loadingSlots ? (
                            <div className="sch-loading"><Loader2 size={28} className="spin-icon" /><p>Loading…</p></div>
                        ) : slots.length === 0 ? (
                            <div className="sch-empty">
                                <Clock size={40} className="sch-empty-icon" />
                                <p className="sch-empty-title">No slots for this day</p>
                                <p className="sch-empty-hint">Click <strong>Add Slot</strong> to create availability.</p>
                            </div>
                        ) : (
                            <div className="sch-slot-items">
                                {slots.map(slot => {
                                    const avail = slot.isAvailable;
                                    const dur = calcDuration(slot.startTime, slot.endTime);
                                    return (
                                        <div key={slot.id} className={`sch-slot-row ${avail ? 'sch-slot-row--avail' : 'sch-slot-row--booked'}`}>
                                            <div className="sch-slot-time-col">
                                                <div className="sch-slot-timeline-dot" />
                                                <div>
                                                    <p className="sch-slot-time-range">
                                                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                                                    </p>
                                                    {dur && <p className="sch-slot-dur">Standard Consultation • {dur}</p>}
                                                </div>
                                            </div>
                                            <div className="sch-slot-actions-col">
                                                <span className={`sch-badge ${avail ? 'sch-badge--avail' : 'sch-badge--booked'}`}>
                                                    {avail ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                    {avail ? 'Available' : 'Booked'}
                                                </span>
                                                {avail && (
                                                    <button
                                                        className="sch-btn-icon-danger"
                                                        onClick={() => handleCancelSlot(slot.id)}
                                                        disabled={cancellingId === slot.id}
                                                        title="Cancel slot"
                                                    >
                                                        {cancellingId === slot.id
                                                            ? <Loader2 size={14} className="spin-icon" />
                                                            : <Trash2 size={14} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Stats + Panel */}
                <div className="sch-sidebar">

                    {/* Stats Card */}
                    <div className="card sch-stats-card">
                        <h3 className="sch-stats-title">Today's Overview</h3>
                        <div className="sch-stat-item">
                            <span className="sch-stat-label"><Calendar size={14} /> Total Slots</span>
                            <span className="sch-stat-value">{slots.length}</span>
                        </div>
                        <div className="sch-stat-item">
                            <span className="sch-stat-label"><CheckCircle size={14} className="sch-icon-green" /> Available</span>
                            <span className="sch-stat-value sch-stat-value--green">{availableCount}</span>
                        </div>
                        <div className="sch-stat-item">
                            <span className="sch-stat-label"><XCircle size={14} className="sch-icon-red" /> Booked</span>
                            <span className="sch-stat-value sch-stat-value--red">{bookedCount}</span>
                        </div>
                        <div className="sch-capacity-bar">
                            <div
                                className="sch-capacity-fill"
                                style={{ width: slots.length ? `${(bookedCount / slots.length) * 100}%` : '0%' }}
                            />
                        </div>
                        <p className="sch-capacity-label">
                            {slots.length ? `${Math.round((bookedCount / slots.length) * 100)}% Booked` : 'No slots yet'}
                        </p>
                    </div>

                    {/* Single Add Panel */}
                    {panel === 'single' && (
                        <div className="card sch-form-card">
                            <div className="sch-form-card-head">
                                <Plus size={18} className="sch-icon-blue" />
                                <h3>Create Availability</h3>
                            </div>
                            <p className="sch-form-card-hint">Add a single time slot for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.</p>
                            <form onSubmit={handleCreateSlot}>
                                <div className="sch-form-field">
                                    <label>Start Time</label>
                                    <select value={newStart} onChange={e => setNewStart(e.target.value)}>
                                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="sch-form-field">
                                    <label>End Time</label>
                                    <select value={newEnd} onChange={e => setNewEnd(e.target.value)}>
                                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                {newStart && newEnd && newStart < newEnd && (
                                    <div className="sch-dur-preview">
                                        Duration: <strong>{calcDuration(newStart + ':00', newEnd + ':00')}</strong>
                                    </div>
                                )}
                                <div className="sch-form-actions">
                                    <button type="submit" className="sch-btn sch-btn-primary sch-btn-full" disabled={creating}>
                                        {creating ? <Loader2 size={16} className="spin-icon" /> : <Plus size={16} />}
                                        {creating ? 'Creating…' : 'Create Slot'}
                                    </button>
                                    <button type="button" className="sch-btn sch-btn-ghost sch-btn-full" onClick={() => setPanel(null)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Bulk Add Panel */}
                    {panel === 'bulk' && (
                        <div className="card sch-form-card">
                            <div className="sch-form-card-head">
                                <Plus size={18} className="sch-icon-blue" />
                                <h3>Bulk Add Slots</h3>
                            </div>
                            <form onSubmit={handleBulkCreate}>
                                {bulkSlots.map((s, idx) => (
                                    <div key={idx} className="sch-bulk-row">
                                        <div className="sch-form-field">
                                            <label>Date</label>
                                            <input type="date" value={s.date} onChange={e => setBulkSlots(prev => prev.map((r, i) => i === idx ? { ...r, date: e.target.value } : r))} required />
                                        </div>
                                        <div className="sch-bulk-time-row">
                                            <div className="sch-form-field">
                                                <label>Start</label>
                                                <select value={s.startTime} onChange={e => setBulkSlots(prev => prev.map((r, i) => i === idx ? { ...r, startTime: e.target.value } : r))}>
                                                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="sch-form-field">
                                                <label>End</label>
                                                <select value={s.endTime} onChange={e => setBulkSlots(prev => prev.map((r, i) => i === idx ? { ...r, endTime: e.target.value } : r))}>
                                                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <button type="button" className="sch-btn-icon-danger sch-bulk-del" onClick={() => setBulkSlots(prev => prev.filter((_, i) => i !== idx))} disabled={bulkSlots.length === 1}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" className="sch-btn sch-btn-ghost sch-btn-full" onClick={() => setBulkSlots(prev => [...prev, { date: selectedDate, startTime: '09:00', endTime: '10:00' }])}>
                                    <Plus size={14} /> Add Another Row
                                </button>
                                <div className="sch-form-actions" style={{ marginTop: 12 }}>
                                    <button type="submit" className="sch-btn sch-btn-primary sch-btn-full" disabled={bulkCreating}>
                                        {bulkCreating ? <Loader2 size={16} className="spin-icon" /> : <Plus size={16} />}
                                        {bulkCreating ? 'Creating…' : `Create ${bulkSlots.length} Slot(s)`}
                                    </button>
                                    <button type="button" className="sch-btn sch-btn-ghost sch-btn-full" onClick={() => setPanel(null)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
