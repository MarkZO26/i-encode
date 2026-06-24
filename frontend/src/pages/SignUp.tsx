import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SignUp() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  // Pinalitan ang advisory ng gender
  const [gender, setGender] = useState<string>(''); 
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverMessage, setServerMessage] = useState<string>('');

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setServerMessage('');

    try {
      const response = await fetch(`${API_URL}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Ipinapasa na ang gender sa halip na advisory
        body: JSON.stringify({ 
          email, 
          password, 
          fullName, 
          gender 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message); 
        navigate('/'); 
      } else {
        setServerMessage(result.message || 'Registration failed.');
      }
    } catch (error) {
      setServerMessage('Connection Failed. Check your .env or backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '20px' }}>
      <h1>EncodeGrade</h1>
      <p>Teacher Registration</p>
      
      <form onSubmit={handleSignup} style={{ marginTop: '20px' }}>
        {serverMessage && (
          <div style={{ 
            padding: '12px', 
            marginBottom: '15px', 
            borderRadius: '6px', 
            backgroundColor: '#fff3cd', 
            color: '#856404',
            fontSize: '0.85rem',
            border: '1px solid #ffeeba',
            lineHeight: '1.4'
          }}>
            {serverMessage}
          </div>
        )}

        {/* Full Name Input */}
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            style={{ width: '100%', padding: '8px' }}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name (e.g. Juan Dela Cruz)"
            required
            disabled={isLoading}
          />
        </div>

        {/* Gender Dropdown */}
        <div style={{ marginBottom: '10px' }}>
          <select
            style={{ width: '100%', padding: '8px' }}
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
            disabled={isLoading}
          >
            <option value="" disabled>Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            style={{ width: '100%', padding: '8px' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Teacher Email Address"
            required
            disabled={isLoading}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="password"
            style={{ width: '100%', padding: '8px' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit" 
          style={{ width: '100%', padding: '10px', cursor: 'pointer' }}
          disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Register Teacher'}
        </button>
      </form>

      <p style={{ marginTop: '15px' }}>
        Already have an account? <span style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }} onClick={() => navigate('/')}>Login</span>
      </p>
    </div>
  );
}

export default SignUp;