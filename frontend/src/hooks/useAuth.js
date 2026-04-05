import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { API_BASE } from "../api/base";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const storeUserInFirestore = async (user) => {
    try {
      if (!user || !user.uid) return;

      console.log("Storing user in Firestore from useAuth:", user.uid);
      const userRef = doc(db, "users", user.uid);

      await setDoc(
        userRef,
        {
          userid: user.uid,
          email: user.email,
          displayName: user.displayName || "",
        },
        { merge: true },
      );

      console.log("✅ User stored in Firestore from useAuth");
    } catch (error) {
      console.error("Error storing user in Firestore from useAuth:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        await storeUserInFirestore(user);
      }

      if (user) {
        try {
          const idToken = await user.getIdToken();
          const res = await fetch(`${API_BASE}/me`, {
            headers: { Authorization: `Bearer ${idToken}` },
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
