import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NAVIGATION_DATA, type PageId } from './NavigationConfig';

const NavigationSideBar: React.FC = () => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  // In-update natin ang state para may 'fullName' at 'gender'
  const [userData, setUserData] = useState<{ email: string; id: number; fullName?: string; gender?: string } | null>(null);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        // 1. Decode Token
        const base64Url = token.split('.')[1]; 
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        const decoded = JSON.parse(jsonPayload);
        
        // I-set muna ang initial data mula sa token
        setUserData(decoded);

        // 2. Fetch Full Profile mula sa Backend gamit ang ID
        fetchProfile(decoded.id, token);

      } catch (error) {
        console.error("Error decoding token:", error);
        handleLogout();
      }
    } else {
      navigate('/');
    }
  }, []);

  // Bagong function para kunin ang details mula sa teachers_info
  const fetchProfile = async (userId: number, token: string) => {
    try {
      // Dito mo tatawagin ang endpoint na gagawin natin sa Express mamaya
      const response = await fetch(`${API_URL}/api/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();

      if (response.ok) {
        // I-merge ang data mula sa token at data mula sa database
        setUserData(prev => prev ? { ...prev, fullName: result.data.fullname, gender: result.data.gender } : null);
      }
    } catch (err) {
      console.error("Failed to fetch teacher profile:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const currentPage = NAVIGATION_DATA.find(item => item.id === activePage) || NAVIGATION_DATA[0];

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: '"Inter", sans-serif', background: '#f4f6f9' }}>
      <aside style={{ width: '260px', background: '#0f2d4a', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '18px' }}>EncodeGrade</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '4px' }}>Grading Management</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAVIGATION_DATA.map((item) => (
            <div key={item.id} onClick={() => setActivePage(item.id)} style={{
              padding: '12px 16px', borderRadius: '8px', marginBottom: '4px', cursor: 'pointer', fontSize: '14px',
              color: activePage === item.id ? '#fff' : 'rgba(255,255,255,0.55)',
              background: activePage === item.id ? '#2a7de1' : 'transparent',
            }}>
              {item.label}
            </div>
          ))}
        </nav>

        {/* ── Footer/User Section (DYNAMIC NA PANGALAN) ── */}
        <div style={{ padding: '20px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '0 4px', marginBottom: '12px' }}>
            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
              {/* Name muna ang priority, email kung wala pa */}
              {userData?.fullName ? userData.fullName : userData?.email || 'Loading...'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
              {userData?.gender ? `${userData.gender} | ` : ''} ID: {userData?.id || '--'}
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '10px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer'
          }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #dde3ec', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600, color: '#1a2332' }}>{currentPage.title}</div>
          <div style={{ color: '#64748b', fontSize: '13px' }}>Academic Year: 2025-2026</div>
        </header>
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {currentPage.component}
        </main>
      </div>
    </div>
  );
};

export default NavigationSideBar;