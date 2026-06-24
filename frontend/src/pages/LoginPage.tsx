import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setServerMessage('');

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('token', result.token);
        navigate('/teacher-dashboard');
      } else {
        setServerMessage(result.message || 'Login failed.');
      }
    } catch (error) {
      setServerMessage('Connection Failed. Check kung tumatakbo ang backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      justifyContent: 'center', minHeight: '100vh', 
      // Background: Deep Blue Gradient (School Theme)
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '40px', borderRadius: '15px', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)', width: '100%', maxWidth: '400px' 
      }}>
        {/* Title: Darker Blue */}
        <h1 style={{ textAlign: 'center', color: '#1e3a8a', margin: '0 0 10px 0' }}>CityDocTrack</h1>
        <p style={{ textAlign: 'center', color: '#555', marginBottom: '30px' }}>School Information System</p>

        <form onSubmit={handleLogin}>
          {serverMessage && (
            <div style={{ 
              padding: '10px', marginBottom: '20px', borderRadius: '6px', 
              backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.9rem', border: '1px solid #fecaca' 
            }}>
              {serverMessage}
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#1e3a8a', fontWeight: 'bold', fontSize: '0.9rem' }}>Email Address</label>
            <input
              type="email" placeholder="Enter your email" value={email} autoComplete="username"
              onChange={e => setEmail(e.target.value)} required disabled={isLoading}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #dbeafe', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#1e3a8a', fontWeight: 'bold', fontSize: '0.9rem' }}>Password</label>
            <input
              type="password" placeholder="Enter your password" autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #dbeafe', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <button type="submit" disabled={isLoading} style={{ 
            width: '100%', padding: '14px', backgroundColor: '#1e40af', color: '#fff', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
            transition: '0.3s', boxShadow: '0 4px 6px rgba(30, 64, 175, 0.2)'
          }}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '0.9rem', color: '#666' }}>
          No account yet?{' '}
          <span onClick={() => navigate('/signup')} style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}>
            Create Account
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;