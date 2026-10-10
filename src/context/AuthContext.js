import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { getAuthErrorMessage } from '../utils/authErrors';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favoriteTeam, setFavoriteTeam] = useState(null);
  const [favoriteTeamLoading, setFavoriteTeamLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  // Update favorite team — writes to Firestore and updates local state so
  // every screen reading `favoriteTeam` (Profile, News) stays in sync.
  const updateFavoriteTeam = async (team) => {
    try {
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, { favoriteTeam: team }, { merge: true });
      setFavoriteTeam(team);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Could not save your team. Please try again.' };
    }
  };

  const isBookmarked = (articleId) => bookmarks.some((a) => a.id === articleId);

  // Saved articles live in a users/{uid}/bookmarks subcollection, one doc per
  // article. Guardian article ids contain slashes, which Firestore doc ids
  // can't, so the id is URI-encoded for the doc id and kept as-is in the data.
  const toggleBookmark = async (article) => {
    const docId = encodeURIComponent(article.id);
    const ref = doc(db, 'users', user.uid, 'bookmarks', docId);
    const alreadySaved = isBookmarked(article.id);
    try {
      if (alreadySaved) {
        await deleteDoc(ref);
        setBookmarks((prev) => prev.filter((a) => a.id !== article.id));
      } else {
        const payload = {
          id: article.id,
          title: article.title,
          description: article.description ?? '',
          published: article.published,
          links: article.links,
          imageUrl: article.imageUrl ?? null,
          savedAt: Date.now(),
        };
        await setDoc(ref, payload);
        setBookmarks((prev) => [payload, ...prev]);
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to update bookmark:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign up with email/password
  const signup = async (email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user);
      
      return {
        success: true,
        user: result.user,
        message: 'Account created! Please check your email to verify your account.'
      };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }
  };

  // Login with email/password
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (!result.user.emailVerified) {
        return { 
          success: false, 
          error: 'Please verify your email before logging in. Check your inbox.',
          needsVerification: true,
          user: result.user
        };
      }
      
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return { success: true, message: 'Verification email sent!' };
      }
      return { success: false, error: 'No user logged in' };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }
  };

  // Change password — requires current password to re-authenticate first
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      return { success: true };
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        return { success: false, error: 'Current password is incorrect.' };
      }
      return { success: false, error: getAuthErrorMessage(error) };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
        setFavoriteTeamLoading(true);
        getDoc(doc(db, 'users', currentUser.uid))
          .then((snap) => {
            setFavoriteTeam(snap.exists() ? snap.data().favoriteTeam ?? null : null);
          })
          .catch((error) => {
            console.error('Failed to load favorite team:', error);
          })
          .finally(() => setFavoriteTeamLoading(false));

        setBookmarksLoading(true);
        getDocs(collection(db, 'users', currentUser.uid, 'bookmarks'))
          .then((snap) => {
            const loaded = snap.docs.map((d) => d.data());
            loaded.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
            setBookmarks(loaded);
          })
          .catch((error) => {
            console.error('Failed to load bookmarks:', error);
          })
          .finally(() => setBookmarksLoading(false));
      } else {
        setUser(null);
        setFavoriteTeam(null);
        setBookmarks([]);
      }
      setLoading(false);
      console.log('Auth state changed:', currentUser ? 'Logged in' : 'Logged out');
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    signup,
    login,
    logout,
    loading,
    resendVerificationEmail,
    changePassword,
    favoriteTeam,
    favoriteTeamLoading,
    updateFavoriteTeam,
    bookmarks,
    bookmarksLoading,
    isBookmarked,
    toggleBookmark
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}