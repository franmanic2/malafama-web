import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

function cleanUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      cleaned[key] = cleanUndefined(obj[key]);
    }
  }
  return cleaned;
}

export const apiService = {
  async getAll<T>(resource: string): Promise<T[]> {
    const querySnapshot = await getDocs(collection(db, resource));
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as unknown as T));
  },

  async getOne<T>(resource: string, id: string | number): Promise<T> {
    const docRef = doc(db, resource, id.toString());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as unknown as T;
    }
    throw new Error(`Document not found in ${resource}`);
  },

  async create<T>(resource: string, data: any): Promise<T> {
    const cleanedData = cleanUndefined(data);
    const docId = cleanedData.id?.toString();
    if (docId) {
      await setDoc(doc(db, resource, docId), cleanedData);
      return cleanedData as T;
    } else {
      const newDocRef = doc(collection(db, resource));
      cleanedData.id = newDocRef.id;
      await setDoc(newDocRef, cleanedData);
      return cleanedData as T;
    }
  },

  async update<T>(resource: string, id: string | number, data: any): Promise<T> {
    const cleanedData = cleanUndefined(data);
    const docRef = doc(db, resource, id.toString());
    await setDoc(docRef, cleanedData, { merge: true });
    
    // Fetch and return the updated document
    const updatedSnap = await getDoc(docRef);
    return updatedSnap.data() as T;
  },

  async delete(resource: string, id: string | number): Promise<void> {
    const docRef = doc(db, resource, id.toString());
    await deleteDoc(docRef);
  },
};
