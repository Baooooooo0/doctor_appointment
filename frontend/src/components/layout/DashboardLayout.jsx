import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Search, Calendar, MessageSquare,
    Clock, User, CreditCard, HelpCircle, Bell, Settings,
    ChevronDown, HeartPulse, Stethoscope, Users, Activity
} from 'lucide-react';
import './DashboardLayout.css';

// ─── Menu Configuration ────────────────────────────────────────────────────────
const MENU_CONFIG = {
    PATIENT: {
        main: [
            { label: 'Dashboard', icon: LayoutDashboard, path: '/patient/dashboard' },
            { label: 'Search Doctors', icon: Search, path: '/doctors' },
            { label: 'My Appointments', icon: Calendar, path: '/patient/appointments' },
            { label: 'Messages', icon: MessageSquare, path: '/messages', badge: 2 },
            { label: 'Medical History', icon: Clock, path: '/patient/history' },
        ],
        settings: [
            { label: 'Profile', icon: User, path: '/profile' },
            { label: 'Billing', icon: CreditCard, path: '/billing' },
            { label: 'Help & Support', icon: HelpCircle, path: '/support' },
        ]
    },
    DOCTOR: {
        main: [
            { label: 'Dashboard', icon: LayoutDashboard, path: '/doctor/dashboard' },
            { label: 'My Schedule', icon: Calendar, path: '/doctor/schedules' },
            { label: 'Patients', icon: Users, path: '/doctor/patients' },
            { label: 'Messages', icon: MessageSquare, path: '/messages', badge: 5 },
        ],
        settings: [
            { label: 'Profile', icon: User, path: '/profile' },
            { label: 'Help & Support', icon: HelpCircle, path: '/support' },
        ]
    },
    ADMIN: {
        main: [
            { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
            { label: 'Manage Users', icon: Users, path: '/admin/users' },
            { label: 'System Stats', icon: Activity, path: '/admin/stats' },
        ],
        settings: [
            { label: 'Profile', icon: User, path: '/profile' },
            { label: 'Settings', icon: Settings, path: '/admin/settings' },
        ]
    }
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }) {
    const { user, role, logout } = useAuth();

    // Mặc định hiển thị menu PATIENT nếu chưa có role chuẩn
    const currentMenu = MENU_CONFIG[role] || MENU_CONFIG.PATIENT;

    return (
        <div className="layout-container">
            {/* ── Sidebar ── */}
            <aside className="layout-sidebar">
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="logo-icon"><HeartPulse size={20} strokeWidth={2.5} /></div>
                    <span>HealthPlus</span>
                </div>

                <div className="sidebar-scrollable">
                    {/* Main Menu */}
                    <div className="menu-group">
                        <div className="menu-title">MAIN MENU</div>
                        <nav className="menu-nav">
                            {currentMenu.main.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                                >
                                    <item.icon size={18} className="menu-icon" />
                                    <span className="menu-label">{item.label}</span>
                                    {item.badge && <span className="menu-badge">{item.badge}</span>}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Settings */}
                    <div className="menu-group">
                        <div className="menu-title">SETTINGS</div>
                        <nav className="menu-nav">
                            {currentMenu.settings.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
                                >
                                    <item.icon size={18} className="menu-icon" />
                                    <span className="menu-label">{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Pro Plan Card */}
                    <div className="pro-plan-card">
                        <div className="pro-icon">★</div>
                        <div className="pro-title">Pro Plan</div>
                        <p className="pro-desc">Get priority support and advanced health analytics.</p>
                        <button className="btn-upgrade">Upgrade Now</button>
                    </div>
                </div>
            </aside>

            {/* ── Main Content Area ── */}
            <div className="layout-main">
                {/* Header */}
                <header className="layout-header">
                    <div className="header-search">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Search doctors, clinics..." />
                    </div>

                    <div className="header-actions">
                        <button className="icon-btn">
                            <Bell size={18} />
                            <span className="notification-dot"></span>
                        </button>
                        <button className="icon-btn">
                            <Settings size={18} />
                        </button>

                        <div className="user-profile-dropdown">
                            <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
                            <div className="user-info">
                                <div className="user-name">{user?.name || 'Unknown User'}</div>
                                <div className="user-role">{user?.role === 'PATIENT' ? 'Patient' : user?.role === 'DOCTOR' ? 'Doctor' : 'Admin'}</div>
                            </div>
                            <ChevronDown size={16} className="dropdown-icon" />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="layout-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
