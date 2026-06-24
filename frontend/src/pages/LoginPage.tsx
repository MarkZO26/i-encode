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
        // ✅ I-save ang token bago mag-navigate
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
    <div>
      <h1>Login</h1>
      <p>Welcome to CityDocTrack</p>

      <form onSubmit={handleLogin}>
        {serverMessage && (
          <div style={{
            padding: '12px',
            marginBottom: '15px',
            borderRadius: '6px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            fontSize: '0.85rem',
            border: '1px solid #ffeeba',
          }}>
            {serverMessage}
          </div>
        )}

        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            autoComplete="username"
            onChange={e => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <br />

        <div>
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <br />

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p>
        No account yet?{' '}
        <span onClick={() => navigate('/signup')} style={{ cursor: 'pointer', color: '#1a73e8' }}>
          Create Account
        </span>
      </p>
    </div>
  );
};

export default LoginPage;