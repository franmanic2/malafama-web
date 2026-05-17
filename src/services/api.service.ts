import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export const apiService = {
  async getAll<T>(resource: string): Promise<T[]> {
    const querySnapshot = await getDocs(collection(db, resource));
    return querySnapshot.docs.map(docSnap => docSnap.data() as T);
  },

  async getOne<T>(resource: string, id: string | number): Promise<T> {
    const docRef = doc(db, resource, id.toString());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as T;
    }
    throw new Error(`Document not found in ${resource}`);
  },

  async create<T>(resource: string, data: any): Promise<T> {
    const docId = data.id?.toString();
    if (docId) {
      await setDoc(doc(db, resource, docId), data);
      return data as T;
    } else {
      const newDocRef = doc(collection(db, resource));
      data.id = newDocRef.id;
      await setDoc(newDocRef, data);
      return data as T;
    }
  },

  async update<T>(resource: string, id: string | number, data: any): Promise<T> {
    const docRef = doc(db, resource, id.toString());
    await setDoc(docRef, data, { merge: true });
    
    // Fetch and return the updated document
    const updatedSnap = await getDoc(docRef);
    return updatedSnap.data() as T;
  },

  async delete(resource: string, id: string | number): Promise<void> {
    const docRef = doc(db, resource, id.toString());
    await deleteDoc(docRef);
  },
};
