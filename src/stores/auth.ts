import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { apiService } from '../services/api.service';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null);
  const router = useRouter();
  const loadingSession = ref(true);

  const isAuthenticated = computed(() => !!user.value);

  let authInitialized = false;
  let authResolve: () => void;
  const initPromise = new Promise<void>((res) => { authResolve = res; });

  // Initialize session from Firebase Auth
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Fetch user metadata (like role) from Firestore
        const userData = await apiService.getOne('users', firebaseUser.uid);
        user.value = userData;
      } catch (error) {
        console.error('Error fetching user metadata:', error);
      }
    } else {
      user.value = null;
    }
    loadingSession.value = false;
    if (!authInitialized) {
      authInitialized = true;
      authResolve();
    }
  });

  async function login(username: string, password: string) {
    const email = `${username}@malafama.com`;
    let userCredential;
    
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // If the user doesn't exist in Firebase yet, try creating it (auto-provision)
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
           userCredential = await createUserWithEmailAndPassword(auth, email, password);
           // Define initial roles based on the username created
           let role = 'staff';
           let name = 'Personal';
           if (username === 'admin') {
             role = 'admin';
             name = 'Administrador';
           } else if (username === 'malafama1') {
             role = 'staff';
             name = 'Mala Fama 1';
           }
           const newUser = { id: userCredential.user.uid, username, name, role };
           // Save to Firestore
           await apiService.create('users', newUser);
           user.value = newUser;
           return true;
        } catch (createError: any) {
           throw new Error('Error al registrar usuario: ' + createError.message);
        }
      } else {
        throw new Error('Credenciales incorrectas');
      }
    }
    
    // If login was successful, fetch user data from Firestore
    try {
      const userData = await apiService.getOne('users', userCredential.user.uid);
      user.value = userData;
    } catch (error) {
       // If document doesn't exist, recreate it
       let role = username === 'admin' ? 'admin' : 'staff';
       let name = username === 'admin' ? 'Administrador' : username;
       const newUser = { id: userCredential.user.uid, username, name, role };
       await apiService.create('users', newUser);
       user.value = newUser;
    }
    
    return true;
  }

  async function logout() {
    await signOut(auth);
    user.value = null;
    router.push('/login');
  }

  return {
    user,
    isAuthenticated,
    loadingSession,
    initPromise,
    login,
    logout,
  };
});
