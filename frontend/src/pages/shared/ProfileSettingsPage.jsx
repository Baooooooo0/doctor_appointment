import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Shield, Briefcase, Award, FileText, Save, Loader2, Heart } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './ProfileSettingsPage.css';

export default function ProfileSettingsPage() {
    const { user, role } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Common fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Patient-specific
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [medicalHistory, setMedicalHistory] = useState('');

    // Doctor-specific
    const [specialty, setSpecialty] = useState('');
    const [experienceYears, setExperienceYears] = useState('');
    const [description, setDescription] = useState('');
    const [rating, setRating] = useState(null);

    // memberId for display
    const [memberId, setMemberId] = useState('');
    const [memberSince, setMemberSince] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            if (role === 'PATIENT') {
                const res = await api.get('/patients/me');
                const p = res.data;
                setName(p.name || '');
                setEmail(p.email || '');
                setPhone(p.phone || '');
                setDateOfBirth(p.dateOfBirth || p.date_of_birth || '');
                setGender(p.gender || '');
                setMedicalHistory(p.medicalHistory || p.medical_history || '');
                setMemberId(p.patientId?.slice(0, 8) || p.id?.slice(0, 8) || '???');
                setMemberSince(p.createdAt || p.created_at || '');
            } else if (role === 'DOCTOR') {
                const res = await api.get('/doctors/me');
                const d = res.data;
                setName(d.name || '');
                setEmail(d.email || '');
                setPhone(d.phone || '');
                setSpecialty(d.specialty || '');
                setExperienceYears(d.experienceYears || d.experience_years || '');
                setDescription(d.description || '');
                setRating(d.rating);
                setMemberId(d.doctorId?.slice(0, 8) || d.id?.slice(0, 8) || '???');
                setMemberSince(d.createdAt || d.created_at || '');
            }
        } catch (err) {
            toast.error('Failed to load profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (role === 'PATIENT') {
                await api.put('/patients/me', {
                    name: name || undefined,
                    phone: phone || undefined,
                    dateOfBirth: dateOfBirth || undefined,
                    gender: gender || undefined,
                    medicalHistory: medicalHistory || undefined,
                });
            } else if (role === 'DOCTOR') {
                await api.put('/doctors/me', {
                    specialty: specialty || undefined,
                    experienceYears: experienceYears ? Number(experienceYears) : undefined,
                    description: description || undefined,
                });
            }
            toast.success('Profile updated successfully!');
        } catch (err) {
            const raw = err.response?.data?.error;
            const msg = typeof raw === 'string' ? raw : 'Failed to update profile.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const formatMemberDate = () => {
        if (!memberSince) return '';
        const d = new Date(memberSince);
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <Loader2 size={32} className="spin-icon" />
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-settings-page">
            {/* ── Page Header ── */}
            <div className="ps-page-header">
                <div>
                    <h1>Profile Settings</h1>
                    <p>Manage your personal information and {role === 'DOCTOR' ? 'professional' : 'health'} details.</p>
                </div>
            </div>

            {/* ── Profile Card ── */}
            <div className="ps-profile-card card">
                <div className="ps-profile-top">
                    <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=136dec&color=fff&size=120&bold=true`}
                        alt={name}
                        className="ps-avatar"
                    />
                    <div className="ps-profile-info">
                        <h2>{name || 'User'}</h2>
                        <p className="ps-profile-sub">
                            {formatMemberDate() && `Member since ${formatMemberDate()}`}
                            {memberId && ` • ID: #${memberId.toUpperCase()}`}
                        </p>
                        <span className={`ps-role-badge ps-role-${role?.toLowerCase()}`}>
                            <Shield size={13} />
                            {role}
                        </span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave}>
                {/* ── Personal Information ── */}
                <div className="ps-section card">
                    <div className="ps-section-header">
                        <User size={20} className="ps-icon-blue" />
                        <h3>Personal Information</h3>
                    </div>

                    <div className="ps-form-grid">
                        <div className="ps-field">
                            <label><User size={14} /> Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                            />
                        </div>

                        <div className="ps-field">
                            <label><Mail size={14} /> Email Address</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="ps-disabled"
                            />
                            <span className="ps-field-hint">Email cannot be changed.</span>
                        </div>

                        <div className="ps-field">
                            <label><Phone size={14} /> Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter phone number"
                            />
                        </div>

                        {role === 'PATIENT' && (
                            <>
                                <div className="ps-field">
                                    <label><Calendar size={14} /> Date of Birth</label>
                                    <input
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                    />
                                </div>

                                <div className="ps-field">
                                    <label><Shield size={14} /> Gender</label>
                                    <select value={gender} onChange={(e) => setGender(e.target.value)}>
                                        <option value="">Select gender</option>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    {role === 'PATIENT' && (
                        <div className="ps-field ps-field-full">
                            <label><Heart size={14} /> Medical History</label>
                            <textarea
                                rows={4}
                                value={medicalHistory}
                                onChange={(e) => setMedicalHistory(e.target.value)}
                                placeholder="Any known allergies, conditions, or medications..."
                            />
                        </div>
                    )}
                </div>

                {/* ── Professional Details (Doctor Only) ── */}
                {role === 'DOCTOR' && (
                    <div className="ps-section card">
                        <div className="ps-section-header">
                            <Briefcase size={20} className="ps-icon-blue" />
                            <h3>Professional Details</h3>
                        </div>

                        <div className="ps-form-grid">
                            <div className="ps-field">
                                <label><Briefcase size={14} /> Specialty</label>
                                <input
                                    type="text"
                                    value={specialty}
                                    onChange={(e) => setSpecialty(e.target.value)}
                                    placeholder="e.g. Cardiology, Pediatrics"
                                />
                            </div>

                            <div className="ps-field">
                                <label><Award size={14} /> Years of Experience</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={experienceYears}
                                    onChange={(e) => setExperienceYears(e.target.value)}
                                    placeholder="e.g. 10"
                                />
                            </div>

                            {rating !== null && rating !== undefined && (
                                <div className="ps-field">
                                    <label><Award size={14} /> Rating</label>
                                    <input
                                        type="text"
                                        value={`⭐ ${rating}`}
                                        disabled
                                        className="ps-disabled"
                                    />
                                    <span className="ps-field-hint">Rating is calculated from patient reviews.</span>
                                </div>
                            )}
                        </div>

                        <div className="ps-field ps-field-full">
                            <label><FileText size={14} /> About / Bio</label>
                            <textarea
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Write a short professional bio or description of your practice..."
                            />
                        </div>
                    </div>
                )}

                {/* ── Save Button ── */}
                <div className="ps-save-row">
                    <button type="submit" className="ps-btn-save" disabled={saving}>
                        {saving ? (
                            <><Loader2 size={16} className="spin-icon" /> Saving...</>
                        ) : (
                            <><Save size={16} /> Save Changes</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
