import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { API_BASE } from '../api/base';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);


      if (user) {
        try {
          const idToken = await user.getIdToken();
          const res = await fetch(`${API_BASE}/me`, {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          const data = await res.json();
          console.log("Backend /me:", data);
        } catch (err) {
          console.error("Backend /me failed:", err);
        }
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
};