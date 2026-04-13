/*import { useState } from 'react';
import { signInWithGoogle } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h1>Ace AI</h1>
      <p>Sign in to get started</p>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <button 
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '20px',
          cursor: loading ? 'not-allowed' : 'pointer',
          backgroundColor: '#B0E0E6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          marginTop: '20px'
        }}
      >
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </button>
    </div>
  );
};

export default Login;
*/

import { useState } from 'react';
import { signInWithGoogle } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Logo and Title Section */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        marginBottom: '16px'
      }}>
        <img 
          src="/ace-of-spades.png" 
          alt="Ace AI Logo" 
          style={{ 
            width: '48px', 
            height: '48px',
            objectFit: 'contain'
          }} 
        />
        <h1 style={{ 
          margin: 0, 
          fontSize: '2.5rem',
          color: '#1e293b'
        }}>
          Ace AI
        </h1>
      </div>
      
      <p style={{ color: '#64748b', marginBottom: '20px' }}>Sign in to get started</p>
      
      {error && <p style={{ color: '#dc2626', marginBottom: '16px' }}>{error}</p>}
      
      <button 
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          backgroundColor: '#1e293b',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          marginTop: '20px',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!loading) e.target.style.backgroundColor = '#0f172a';
        }}
        onMouseLeave={(e) => {
          if (!loading) e.target.style.backgroundColor = '#1e293b';
        }}
      >
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </button>
    </div>
  );
};

export default Login;