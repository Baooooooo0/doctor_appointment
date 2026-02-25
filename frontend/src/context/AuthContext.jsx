import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Decode JWT payload và kiểm tra token còn hạn không.
 * Không verify signature — chỉ check expiry để UX.
 */
function isTokenValid(token) {
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp là seconds, Date.now() là milliseconds
        return payload.exp * 1000 > Date.now();
    } catch {
        return false; // token malformed → coi như không hợp lệ
    }
}

/** Xóa tất cả auth keys khỏi localStorage */
function clearStorage() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
}

// ─── Provider ─────────────────────────────────────────────────────────────────
/**
 * AuthProvider: bọc toàn bộ app, cung cấp thông tin đăng nhập
 * Dùng: const { user, login, logout, isAuthenticated, role } = useAuth();
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const token = localStorage.getItem('accessToken');
            // Nếu token hết hạn → auto-logout ngay khi app khởi động
            if (!isTokenValid(token)) {
                clearStorage();
                return null;
            }
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            clearStorage();
            return null;
        }
    });

    const [accessToken, setAccessToken] = useState(() => {
        const token = localStorage.getItem('accessToken');
        if (!isTokenValid(token)) {
            clearStorage();
            return null;
        }
        return token;
    });

    // Gọi sau khi đăng nhập / đăng ký thành công
    const login = useCallback((data) => {
        const { accessToken, refreshToken, user } = data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        setAccessToken(accessToken);
        setUser(user);
    }, []);

    // Xóa toàn bộ session
    const logout = useCallback(() => {
        clearStorage();
        setAccessToken(null);
        setUser(null);
    }, []);

    const value = {
        user,
        accessToken,
        isAuthenticated: !!accessToken && isTokenValid(accessToken),
        role: user?.role || null,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
