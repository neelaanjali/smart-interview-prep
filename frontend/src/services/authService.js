import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const db = getFirestore();

export const signInWithGoogle = async () => {
try {
await setPersistence(auth, browserSessionPersistence);
const result = await signInWithPopup(auth, googleProvider);
// Check if user already exists in Firestore
const userRef = doc(db, 'users', result.user.uid);
const userDoc = await getDoc(userRef);
// Prepare user data
const userData = {
userid: result.user.uid,
email: result.user.email,
displayName: result.user.displayName || '',
};
// If it's a new user, add createdAt timestamp
if (!userDoc.exists()) {
userData.createdAt = serverTimestamp();
userData.isNewUser = true;
console.log('New user created:', result.user.uid);
} else {
userData.isNewUser = false;
console.log('Existing user logged in:', result.user.uid);
}
await setDoc(userRef, userData, { merge: true });
return { user: result.user, isNewUser: !userDoc.exists() };
} catch (error) {
console.error('Error signing in with Google:', error);
throw error;
}
};

export const logout = async () => {
try {
await signOut(auth);
} catch (error) {
console.error('Error signing out:', error);
throw error;
}
};