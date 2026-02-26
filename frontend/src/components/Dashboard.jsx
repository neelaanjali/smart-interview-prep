import { logout } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1>Smart Interview Prep</h1>
      <h2>Welcome, {user?.displayName || 'User'}! 👋</h2>
      <p>Email: {user?.email}</p>
      
      <button
        onClick={handleLogout}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Sign Out
      </button>
    </div>
  );
};

export default Dashboard;
