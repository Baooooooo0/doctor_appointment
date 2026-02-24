import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

/**
 * AuthProvider: bọc toàn bộ app, cung cấp thông tin đăng nhập
 * Dùng: const { user, login, logout, isAuthenticated, role } = useAuth();
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const [accessToken, setAccessToken] = useState(() =>
        localStorage.getItem('accessToken') || null
    );

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
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setAccessToken(null);
        setUser(null);
    }, []);

    const value = {
        user,
        accessToken,
        isAuthenticated: !!accessToken,
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
