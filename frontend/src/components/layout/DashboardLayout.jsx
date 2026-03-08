import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard, Search, Calendar,
    User, Bell, Settings, LogOut, Menu, X,
    ChevronDown, HeartPulse, Users, Activity
} from 'lucide-react';
import './DashboardLayout.css';

// ─── Menu Configuration ────────────────────────────────────────────────────────
const MENU_CONFIG = {
    PATIENT: {
        main: [
            { label: 'Dashboard', icon: LayoutDashboard, path: '/patient/dashboard' },
            { label: 'Search Doctors', icon: Search, path: '/doctors' },
            { label: 'My Appointments', icon: Calendar, path: '/patient/appointments' },
        ],
        settings: [
            { label: 'Profile', icon: User, path: '/profile' },
        ]
    },
    DOCTOR: {
        main: [
            { label: 'Dashboard', icon: LayoutDashboard, path: '/doctor/dashboard' },
            { label: 'My Schedule', icon: Calendar, path: '/doctor/schedules' },
            { label: 'Patients', icon: Users, path: '/doctor/patients' },
        ],
        settings: [
            { label: 'Profile', icon: User, path: '/profile' },
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Mặc định hiển thị menu PATIENT nếu chưa có role chuẩn
    const currentMenu = MENU_CONFIG[role] || MENU_CONFIG.PATIENT;

    return (
        <div className="layout-container">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            {/* ── Sidebar ── */}
            <aside className={`layout-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="logo-icon"><HeartPulse size={20} strokeWidth={2.5} /></div>
                    <span>HealthPlus</span>
                    <button
                        className="mobile-close-btn"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X size={20} />
                    </button>
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
                                    onClick={() => setIsMobileMenuOpen(false)}
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
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <item.icon size={18} className="menu-icon" />
                                    <span className="menu-label">{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="sidebar-footer">
                    <button className="menu-item logout-btn" onClick={logout}>
                        <LogOut size={18} className="menu-icon" />
                        <span className="menu-label">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Content Area ── */}
            <div className="layout-main">
                {/* Header */}
                <header className="layout-header">
                    <div className="header-left">
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <div className="header-search">
                            <Search size={18} className="search-icon" />
                            <input type="text" placeholder="Search doctors, clinics..." />
                        </div>
                    </div>

                    <div className="header-actions">
                        <button className="icon-btn">
                            <Bell size={18} />
                            <span className="notification-dot"></span>
                        </button>
                        <button className="icon-btn hidden-on-mobile">
                            <Settings size={18} />
                        </button>

                        <div className="user-profile-dropdown">
                            <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
                            <div className="user-info hidden-on-mobile">
                                <div className="user-name">{user?.name || 'Unknown User'}</div>
                                <div className="user-role">{user?.role === 'PATIENT' ? 'Patient' : user?.role === 'DOCTOR' ? 'Doctor' : 'Admin'}</div>
                            </div>
                            <ChevronDown size={16} className="dropdown-icon hidden-on-mobile" />
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
