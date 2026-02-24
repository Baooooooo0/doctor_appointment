import { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * Trang test tạm thời để kiểm tra kết nối Frontend → Backend
 * Xóa sau khi đã xác nhận kết nối OK.
 */
export default function ConnectionTest() {
    const [tests, setTests] = useState([]);
    const [running, setRunning] = useState(false);

    const addResult = (label, status, data) => {
        setTests(prev => [...prev, { label, status, data, time: new Date().toLocaleTimeString() }]);
    };

    async function runTests() {
        setTests([]);
        setRunning(true);

        // Test 1: GET /doctors (public)
        try {
            const res = await api.get('/doctors?page=1&limit=3');
            addResult('GET /doctors (public)', 'OK', `${res.data.meta?.total} doctors, page 1/${res.data.meta?.totalPages}`);
        } catch (e) {
            addResult('GET /doctors (public)', 'FAIL', e.message);
        }

        // Test 2: GET /doctors/search
        try {
            const res = await api.get('/doctors/search?specialty=Tim');
            addResult('GET /doctors/search?specialty=Tim', 'OK', `${res.data.length} results`);
        } catch (e) {
            addResult('GET /doctors/search?specialty=Tim', 'FAIL', e.message);
        }

        // Test 3: POST /auth/login với sai credentials → phải trả 401
        try {
            await api.post('/auth/login', { email: 'nobody@x.com', password: 'wrong' }, { skipAuthRedirect: true });
            addResult('POST /auth/login (wrong creds)', 'UNEXPECTED 200', '');
        } catch (e) {
            if (e.response?.status === 401) {
                addResult('POST /auth/login (wrong creds)', 'OK', '401 Unauthorized – expected');
            } else {
                addResult('POST /auth/login (wrong creds)', 'FAIL', e.message);
            }
        }

        // Test 4: Protected route → 401 without token
        try {
            await api.get('/appointments/me', { skipAuthRedirect: true });
            addResult('GET /appointments/me (no token)', 'UNEXPECTED 200', '');
        } catch (e) {
            if (e.response?.status === 401) {
                addResult('GET /appointments/me (no token)', 'OK', '401 Unauthorized – expected');
            } else {
                addResult('GET /appointments/me (no token)', 'FAIL', e.message);
            }
        }

        setRunning(false);
    }

    useEffect(() => { runTests(); }, []);

    return (
        <div style={{ fontFamily: 'monospace', padding: '32px', maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ marginBottom: 4 }}>🔌 Frontend ↔ Backend Connection Test</h2>
            <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
                Frontend: Vite proxy /api → <strong>localhost:3000</strong>
            </p>

            <button
                onClick={runTests}
                disabled={running}
                style={{
                    padding: '8px 20px', marginBottom: 24, cursor: running ? 'not-allowed' : 'pointer',
                    background: '#136dec', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14
                }}
            >
                {running ? '⏳ Running...' : '🔄 Run Again'}
            </button>

            {tests.map((t, i) => (
                <div key={i} style={{
                    padding: '12px 16px', marginBottom: 8, borderRadius: 6,
                    background: t.status === 'OK' ? '#f0fff4' : '#fff0f0',
                    border: `1px solid ${t.status === 'OK' ? '#b7f5c8' : '#ffc9c9'}`
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</span>
                        <span style={{ color: t.status === 'OK' ? '#2d9a4a' : '#e03131', fontSize: 12 }}>
                            {t.status === 'OK' ? '✅' : '❌'} {t.status}
                        </span>
                    </div>
                    {t.data && <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{t.data}</div>}
                </div>
            ))}
        </div>
    );
}
