import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Filter, Calendar } from 'lucide-react';
import api from '../../api/axios';
import './DoctorSearchPage.css';

export default function DoctorSearchPage() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch doctors based on filters and pagination
    const fetchDoctors = async (searchParams, pageNum = 1) => {
        setLoading(true);
        try {
            // Check if we are searching or getting all
            let endpoint = '/doctors';
            const params = { page: pageNum, limit: 12 };

            if (searchParams.name || searchParams.specialty) {
                endpoint = '/doctors/search';
                if (searchParams.name) params.name = searchParams.name;
                if (searchParams.specialty) params.specialty = searchParams.specialty;
                // Note: Pagination on search might be different, but let's assume it accepts standard params
            }

            const response = await api.get(endpoint, { params });

            if (response.data.data) {
                setDoctors(response.data.data);
                if (response.data.meta) {
                    setTotalPages(response.data.meta.totalPages || 1);
                }
            } else if (Array.isArray(response.data)) {
                // Handle search response if it doesn't wrap in { data, meta }
                setDoctors(response.data);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchDoctors({}, page);
    }, [page]);

    // Handle search form submission
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // Reset to page 1 on new search
        fetchDoctors({ name: searchTerm, specialty });
    };

    return (
        <div className="search-page-container">
            <header className="page-header">
                <h1>Find a Doctor</h1>
                <p>Search and book appointments with the best specialists.</p>
            </header>

            {/* ── Search Filters Bar ── */}
            <div className="search-filters-bar">
                <form className="search-form" onSubmit={handleSearch}>
                    <div className="search-input-group flex-2">
                        <Search size={18} className="text-gray" />
                        <input
                            type="text"
                            placeholder="Search by doctor name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="divider-vertical"></div>

                    <div className="search-input-group flex-1">
                        <Filter size={18} className="text-gray" />
                        <select
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                        >
                            <option value="">All Specialties</option>
                            <option value="Cardiologist">Cardiologist</option>
                            <option value="Dermatologist">Dermatologist</option>
                            <option value="Neurologist">Neurologist</option>
                            <option value="Pediatrician">Pediatrician</option>
                            <option value="Orthopedist">Orthopedist</option>
                            <option value="Psychiatrist">Psychiatrist</option>
                            <option value="General Practice">General Practice</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary search-btn">Search</button>
                </form>
            </div>

            {loading ? (
                <div className="results-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div className="doctor-card" key={i}>
                            <div className="doctor-card-header">
                                <div className="skeleton" style={{ width: 64, height: 64, borderRadius: 12 }}></div>
                                <div className="skeleton skeleton-line w-12" style={{ height: 24, borderRadius: 12 }}></div>
                            </div>
                            <div className="doctor-card-body">
                                <div className="skeleton skeleton-line w-full"></div>
                                <div className="skeleton skeleton-line w-24"></div>
                                <div className="skeleton skeleton-line w-24" style={{ marginTop: 16 }}></div>
                            </div>
                            <div className="doctor-card-footer">
                                <div className="skeleton skeleton-line" style={{ height: 38, flex: 1, borderRadius: 8, marginBottom: 0 }}></div>
                                <div className="skeleton skeleton-line" style={{ height: 38, flex: 1, borderRadius: 8, marginBottom: 0 }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : doctors.length === 0 ? (
                <div className="empty-state">
                    <h2>No doctors found</h2>
                    <p>Try adjusting your search criteria or resetting filters.</p>
                    <button className="btn btn-outline" onClick={() => {
                        setSearchTerm('');
                        setSpecialty('');
                        fetchDoctors({});
                    }}>Reset Filters</button>
                </div>
            ) : (
                <>
                    <div className="results-grid">
                        {doctors.map((doctor, index) => (
                            <div className="doctor-card" key={doctor.id || doctor.doctorId} style={{ '--delay': `${index * 0.05}s` }}>
                                <div className="doctor-card-header">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name || 'Doc')}&background=136dec&color=fff`}
                                        alt={doctor.name}
                                        className="doctor-avatar"
                                    />
                                    <div className="doctor-rating">
                                        <Star size={14} className="star-icon" />
                                        <span>{doctor.rating || 'New'}</span>
                                    </div>
                                </div>
                                <div className="doctor-card-body">
                                    <h3>{doctor.name}</h3>
                                    <p className="specialty-text">{doctor.specialty}</p>

                                    <div className="doctor-details">
                                        <div className="detail-item">
                                            <Calendar size={14} />
                                            <span>{doctor.experienceYears || doctor.experience_years} Years Experience</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="doctor-card-footer">
                                    <Link
                                        to={`/doctors/${encodeURIComponent(doctor.doctorId || doctor.id)}`}
                                        state={{ doctor }}
                                        className="btn btn-outline-primary btn-block text-center"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        View Profile
                                    </Link>
                                    <Link
                                        to={`/doctors/${encodeURIComponent(doctor.doctorId || doctor.id)}`}
                                        state={{ doctor }}
                                        className="btn btn-primary btn-block text-center"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        Book Appt
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="btn-page"
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                Previous
                            </button>
                            <span className="page-info">Page {page} of {totalPages}</span>
                            <button
                                className="btn-page"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
