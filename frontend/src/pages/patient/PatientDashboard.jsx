import { useAuth } from '../../context/AuthContext';
import {
    Calendar, Activity, Weight, Droplets,
    Search, MapPin, Plus, Leaf, Video
} from 'lucide-react';
import './PatientDashboard.css';

export default function PatientDashboard() {
    const { user } = useAuth();
    const firstName = user?.name ? user.name.split(' ')[0] : 'User';

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
                        <div className="stat-card">
                            <div className="stat-icon bg-blue-light text-blue"><Calendar size={20} /></div>
                            <div className="stat-info">
                                <div className="stat-label">Appointments</div>
                                <div className="stat-value">2</div>
                                <div className="stat-subtext text-green">+1 this week</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon bg-purple-light text-purple"><Activity size={20} /></div>
                            <div className="stat-info">
                                <div className="stat-label">Heart Rate</div>
                                <div className="stat-value">72 <span className="text-sm">bpm</span></div>
                                <div className="stat-subtext">Normal range</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon bg-orange-light text-orange"><Weight size={20} /></div>
                            <div className="stat-info">
                                <div className="stat-label">Weight</div>
                                <div className="stat-value">68 <span className="text-sm">kg</span></div>
                                <div className="stat-subtext text-red">-2kg since last visit</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon bg-green-light text-green"><Droplets size={20} /></div>
                            <div className="stat-info">
                                <div className="stat-label">Blood Pressure</div>
                                <div className="stat-value">120/80</div>
                                <div className="stat-subtext">Last check: 2d ago</div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Appointments */}
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h3>Upcoming Appointments</h3>
                            <a href="#" className="link-view-all">View All</a>
                        </div>

                        <div className="appointment-list">
                            {/* Appt Card 1 */}
                            <div className="card appointment-card">
                                <div className="appt-header">
                                    <span className="badge badge-blue">Confirmed</span>
                                    <div className="appt-time"><Calendar size={14} /> Tue, Oct 24 • 10:00 AM</div>
                                </div>
                                <div className="appt-body">
                                    <div className="doc-avatar"><img src="https://i.pravatar.cc/150?img=5" alt="Doctor" /></div>
                                    <div className="doc-info">
                                        <h4>Dr. Sarah Smith</h4>
                                        <p>Cardiologist • Heart Care Center</p>
                                    </div>
                                </div>
                                <div className="appt-footer">
                                    <button className="btn btn-primary"><Video size={16} /> Join Video Call</button>
                                    <button className="btn btn-outline">Reschedule</button>
                                </div>
                            </div>

                            {/* Appt Card 2 */}
                            <div className="card appointment-card">
                                <div className="appt-header">
                                    <span className="badge badge-orange">Pending</span>
                                    <div className="appt-time"><Calendar size={14} /> Thu, Nov 02 • 02:30 PM</div>
                                </div>
                                <div className="appt-body">
                                    <div className="doc-avatar"><img src="https://i.pravatar.cc/150?img=11" alt="Doctor" /></div>
                                    <div className="doc-info">
                                        <h4>Dr. James Wilson</h4>
                                        <p>Dermatologist • Skin Health Clinic</p>
                                    </div>
                                </div>
                                <div className="appt-footer">
                                    <button className="btn btn-outline">View Details</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Top Doctors Nearby */}
                    <section className="dashboard-section">
                        <div className="section-header">
                            <h3>Top Doctors Nearby</h3>
                        </div>
                        <div className="doctors-grid">
                            <div className="card mini-doc-card">
                                <div className="doc-avatar-sm"><img src="https://i.pravatar.cc/150?img=9" alt="Doctor" /></div>
                                <div className="doc-info-sm">
                                    <h4>Dr. Emily Chen</h4>
                                    <p>Pediatrician</p>
                                </div>
                                <button className="btn-icon-light"><Plus size={16} /></button>
                            </div>

                            <div className="card mini-doc-card">
                                <div className="doc-avatar-sm"><img src="https://i.pravatar.cc/150?img=12" alt="Doctor" /></div>
                                <div className="doc-info-sm">
                                    <h4>Dr. Michael Ross</h4>
                                    <p>Neurologist</p>
                                </div>
                                <button className="btn-icon-light"><Plus size={16} /></button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* ── Right Column ── */}
                <div className="side-col">

                    {/* Find Specialist Card */}
                    <div className="search-specialist-card">
                        <h3>Find a Specialist</h3>
                        <p>Search for doctors, clinics, or specific treatments.</p>

                        <div className="search-inputs">
                            <div className="input-with-icon">
                                <Search size={16} className="input-icon" />
                                <input type="text" placeholder="Condition, procedure..." />
                            </div>
                            <div className="input-with-icon">
                                <MapPin size={16} />
                                <input type="text" placeholder="Location (City, Zip)" />
                            </div>
                        </div>

                        <button className="btn btn-dark-full">Search Now</button>
                    </div>

                    {/* Recent Activity */}
                    <div className="card recent-activity-card">
                        <div className="section-header">
                            <h3>Recent Activity</h3>
                            <a href="#" className="link-view-all text-xs">Mark all read</a>
                        </div>

                        <div className="activity-timeline">
                            <div className="activity-item">
                                <div className="activity-dot bg-blue"></div>
                                <div className="activity-content">
                                    <h4>Lab results available</h4>
                                    <p>Your blood test results from Oct 20 are ready.</p>
                                    <span className="activity-time">2 hours ago</span>
                                </div>
                            </div>

                            <div className="activity-item">
                                <div className="activity-dot bg-gray"></div>
                                <div className="activity-content">
                                    <h4>Appointment Reminder</h4>
                                    <p>Don't forget your checkup with Dr. Smith tomorrow.</p>
                                    <span className="activity-time">Yesterday</span>
                                </div>
                            </div>

                            <div className="activity-item">
                                <div className="activity-dot bg-gray"></div>
                                <div className="activity-content">
                                    <h4>Prescription Renewed</h4>
                                    <p>Pharmacy has received your renewal request.</p>
                                    <span className="activity-time">Oct 19</span>
                                </div>
                            </div>
                        </div>

                        <div className="card-footer-center">
                            <a href="#" className="link-view-all">View All Activity</a>
                        </div>
                    </div>

                    {/* Health Tip */}
                    <div className="health-tip-card">
                        <div className="tip-header">
                            <Leaf size={16} className="text-green" />
                            <h4>Health Tip</h4>
                        </div>
                        <p>"Drinking water before meals can help you feel fuller and aid in weight management."</p>
                    </div>

                </div>
            </div>
        </div>
    );
}
