import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { Star, MapPin, Award, ChevronLeft, Calendar as CalendarIcon, MessageSquare } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './DoctorDetailPage.css';

export default function DoctorDetailPage() {
    const rawId = useParams().id;
    const id = decodeURIComponent(rawId || '');
    const location = useLocation();
    const navigate = useNavigate();

    const [doctor, setDoctor] = useState(location.state?.doctor || null);
    const [loadingDoc, setLoadingDoc] = useState(!doctor);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [schedules, setSchedules] = useState([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [booking, setBooking] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState({ totalReviews: 0, avgRating: null });
    const [loadingReviews, setLoadingReviews] = useState(false);

    // If doctor data not in state, attempt to fetch it (fallback)
    useEffect(() => {
        if (!doctor) {
            const fetchDoctorFallback = async () => {
                try {
                    setLoadingDoc(true);
                    // This is a workaround since backend doesn't have /doctors/:id
                    const res = await api.get('/doctors', { params: { limit: 100 } });
                    const docs = res.data.data || [];
                    const found = docs.find(d => (d.doctorId || d.id) === id);
                    if (found) {
                        setDoctor(found);
                    } else {
                        toast.error("Doctor not found.");
                        navigate('/doctors');
                    }
                } catch (error) {
                    toast.error("Error finding doctor details.");
                    navigate('/doctors');
                } finally {
                    setLoadingDoc(false);
                }
            };
            fetchDoctorFallback();
        }
    }, [doctor, id, navigate]);

    // Fetch schedules when doctor or date changes
    useEffect(() => {
        if (doctor && selectedDate) {
            const fetchSchedules = async () => {
                setLoadingSchedules(true);
                setSelectedSlot(null); // Reset selection on date change
                try {
                    const docId = doctor.doctorId || doctor.id;
                    const res = await api.get('/schedules', {
                        params: { doctorId: docId, date: selectedDate }
                    });
                    setSchedules(res.data);
                } catch (error) {
                    console.error("Error fetching schedules:", error);
                    toast.error("Failed to load available slots.");
                } finally {
                    setLoadingSchedules(false);
                }
            };
            fetchSchedules();
        }
    }, [doctor, selectedDate]);

    // Fetch reviews when doctor is loaded
    useEffect(() => {
        if (doctor) {
            const fetchReviews = async () => {
                setLoadingReviews(true);
                try {
                    const docId = doctor.doctorId || doctor.id;
                    const res = await api.get(`/reviews/doctor/${docId}`);
                    setReviews(res.data.reviews || []);
                    setReviewStats(res.data.stats || { totalReviews: 0, avgRating: null });
                } catch (error) {
                    console.error('Error fetching reviews:', error);
                } finally {
                    setLoadingReviews(false);
                }
            };
            fetchReviews();
        }
    }, [doctor]);

    // Handle Book
    const handleBookAppointment = async () => {
        if (!selectedSlot) return;
        setBooking(true);
        try {
            const docId = doctor.doctorId || doctor.id;
            await api.post('/appointments', {
                doctorId: docId,
                scheduleId: selectedSlot.id
            });
            toast.success('Appointment booked successfully!');
            navigate('/patient/dashboard');
        } catch (error) {
            // Backend now always returns { error: string } - safe to read directly
            const raw = error.response?.data?.error;
            const msg = typeof raw === 'string' ? raw : 'This slot is no longer available. Please choose another.';
            toast.error(msg);
            // Refresh slot list so booked slots are removed from the UI
            const docId = doctor.doctorId || doctor.id;
            try {
                const res = await api.get('/schedules', { params: { doctorId: docId, date: selectedDate } });
                setSchedules(res.data);
            } catch (_) { /* ignore refresh error */ }
            setSelectedSlot(null);
        } finally {
            setBooking(false);
        }
    };

    // Relative time helper
    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const days = Math.floor(diff / 86400000);
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 30) return `${days} days ago`;
        const months = Math.floor(days / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    };

    // Date formatting helper
    const formatDateObj = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    // Generate date buttons (Next 7 days)
    const renderDateButtons = () => {
        const buttons = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const isoString = d.toISOString().split('T')[0];
            const isSelected = selectedDate === isoString;

            buttons.push(
                <button
                    key={isoString}
                    className={`date-select-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedDate(isoString)}
                >
                    <span className="date-day">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="date-num">{d.getDate()}</span>
                </button>
            );
        }
        return buttons;
    };

    if (loadingDoc) {
        return (
            <div className="detail-loading">
                <div className="spinner"></div>
                <p>Loading doctor profile...</p>
            </div>
        );
    }

    if (!doctor) return null;

    return (
        <div className="doctor-detail-page">
            {/* Header / Back */}
            <div className="detail-header-nav">
                <Link to="/doctors" className="back-link">
                    <ChevronLeft size={18} /> Back to Search
                </Link>
            </div>

            <div className="detail-grid">
                {/* ── Left Column: Doctor Profile ── */}
                <div className="profile-col">
                    <div className="card profile-card">
                        <div className="profile-header-main">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name || 'Doc')}&background=random&size=150`}
                                alt={doctor.name}
                                className="profile-avatar-large"
                            />
                            <div className="profile-titles">
                                <h2>{doctor.name}</h2>
                                <span className="badge badge-specialty">{doctor.specialty}</span>

                                <div className="rating-badge-large">
                                    <Star size={16} className="star-icon" />
                                    <span>{doctor.rating ? `${doctor.rating} Rating` : 'New Doctor'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="profile-stats">
                            <div className="p-stat">
                                <Award size={20} className="text-blue" />
                                <div>
                                    <h4>Experience</h4>
                                    <p>{doctor.experienceYears || doctor.experience_years} Years</p>
                                </div>
                            </div>
                            <div className="p-stat">
                                <MapPin size={20} className="text-green" />
                                <div>
                                    <h4>Location</h4>
                                    <p>HealthPlus Center</p>
                                </div>
                            </div>
                        </div>

                        <div className="profile-about">
                            <h3>About Doctor</h3>
                            <p>{doctor.description || "An experienced professional dedicated to providing the best healthcare services."}</p>
                        </div>
                    </div>

                    {/* ── Reviews Section ── */}
                    <div className="card reviews-card">
                        <div className="reviews-header">
                            <div className="reviews-title-row">
                                <MessageSquare size={20} className="text-blue" />
                                <h3>Patient Reviews</h3>
                            </div>
                            {reviewStats.totalReviews > 0 && (
                                <div className="reviews-stats">
                                    <span className="avg-rating-big">
                                        <Star size={18} className="star-icon" />
                                        {reviewStats.avgRating?.toFixed(1)}
                                    </span>
                                    <span className="total-reviews-text">{reviewStats.totalReviews} review{reviewStats.totalReviews > 1 ? 's' : ''}</span>
                                </div>
                            )}
                        </div>

                        {loadingReviews ? (
                            <div className="spinner-sm-container"><div className="spinner spinner-sm"></div></div>
                        ) : reviews.length === 0 ? (
                            <div className="no-reviews">
                                <p>No reviews yet. Be the first to leave one after your appointment!</p>
                            </div>
                        ) : (
                            <div className="reviews-list">
                                {reviews.map(review => (
                                    <div className="review-item" key={review.id}>
                                        <div className="review-item-header">
                                            <div className="review-avatar">
                                                {(review.patient_id || 'P').slice(0, 1).toUpperCase()}
                                            </div>
                                            <div className="review-meta">
                                                <span className="reviewer-name">Patient</span>
                                                <span className="review-date">{timeAgo(review.created_at)}</span>
                                            </div>
                                            <div className="review-stars">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} size={14} className={s <= review.rating ? 'star-filled' : 'star-empty'} />
                                                ))}
                                            </div>
                                        </div>
                                        {review.comment && (
                                            <p className="review-comment">{review.comment}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Column: Booking Widget ── */}
                <div className="booking-col">
                    <div className="card booking-widget">
                        <h3>Book Appointment</h3>
                        <p className="booking-subtitle">Select a date and available time slot.</p>

                        <div className="date-selector">
                            <div className="date-header-row">
                                <CalendarIcon size={16} />
                                <h4>{formatDateObj(selectedDate)}</h4>
                            </div>
                            <div className="date-buttons-scroll">
                                {renderDateButtons()}
                            </div>
                        </div>

                        <div className="time-selector">
                            <h4>Available Slots</h4>

                            {loadingSchedules ? (
                                <div className="spinner-sm-container"><div className="spinner spinner-sm"></div></div>
                            ) : schedules.length === 0 ? (
                                <div className="no-slots">
                                    <p>No available slots for this date.</p>
                                </div>
                            ) : (
                                <div className="slots-grid">
                                    {schedules.map(slot => (
                                        <button
                                            key={slot.id}
                                            className={`slot-btn ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedSlot(slot)}
                                        >
                                            {(slot.startTime || slot.start_time || '').slice(0, 5)} - {(slot.endTime || slot.end_time || '').slice(0, 5)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="booking-summary">
                            <div className="summary-row">
                                <span>Consultation Fee</span>
                                <span className="fee-amount">Free (Covered)</span>
                            </div>
                            <button
                                className="btn btn-primary btn-book-final"
                                disabled={!selectedSlot || booking}
                                onClick={handleBookAppointment}
                            >
                                {booking ? 'Booking...' : (selectedSlot ? 'Confirm Booking' : 'Select a Slot')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
