import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

// User-related database operations
interface UserData {
  id: string;
  email: string;
  displayName: string;
  subscriptionTier: 'free' | 'pro' | 'business';
  subscriptionEnd?: Timestamp;
  createdAt: Timestamp;
  featuresUsage: {
    codesGenerated: number;
    dailyCodesUsed: number;
    lastDailyReset: Timestamp;
  };
}

// Save or update user data in Firestore
export const saveUserData = async (user: User) => {
  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving user data:', error);
    return false;
  }
};

// Get user data from Firestore
export async function getUserData(userId: string) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
}

// QR Code and Barcode related database operations
interface CodeData {
  id: string;
  userId: string;
  name: string;
  content: string;
  type: 'qrcode' | 'barcode';
  format?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stats: {
    scans: number;
    lastScan?: Timestamp;
  };
  settings?: {
    foregroundColor?: string;
    backgroundColor?: string;
    [key: string]: any;
  };
}

// Save a new code (QR code or barcode)
export async function saveCode(userId: string, codeData: Omit<CodeData, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  try {
    const codesRef = collection(db, 'codes');
    const newCodeRef = doc(codesRef);
    
    await setDoc(newCodeRef, {
      id: newCodeRef.id,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...codeData
    });
    
    return newCodeRef.id;
  } catch (error) {
    console.error("Error saving code:", error);
    throw error;
  }
}

// Get codes for a specific user
export async function getUserCodes(userId: string) {
  try {
    const codesRef = collection(db, 'codes');
    const q = query(
      codesRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const codes: CodeData[] = [];
    
    querySnapshot.forEach((doc) => {
      codes.push(doc.data() as CodeData);
    });
    
    return codes;
  } catch (error) {
    console.error("Error getting user codes:", error);
    throw error;
  }
}

// Get a specific code by ID
export async function getCodeById(codeId: string) {
  try {
    const codeRef = doc(db, 'codes', codeId);
    const codeSnap = await getDoc(codeRef);
    
    if (codeSnap.exists()) {
      return codeSnap.data() as CodeData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting code:", error);
    throw error;
  }
}

// Update an existing code
export async function updateCode(codeId: string, codeData: Partial<CodeData>) {
  try {
    const codeRef = doc(db, 'codes', codeId);
    
    await updateDoc(codeRef, {
      ...codeData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating code:", error);
    throw error;
  }
}

// Delete a code
export async function deleteCode(codeId: string) {
  try {
    const codeRef = doc(db, 'codes', codeId);
    await deleteDoc(codeRef);
  } catch (error) {
    console.error("Error deleting code:", error);
    throw error;
  }
}

// Track code usage
export async function incrementCodeScan(codeId: string) {
  try {
    const codeRef = doc(db, 'codes', codeId);
    const codeSnap = await getDoc(codeRef);
    
    if (codeSnap.exists()) {
      const codeData = codeSnap.data() as CodeData;
      const currentScans = codeData.stats?.scans || 0;
      
      await updateDoc(codeRef, {
        'stats.scans': currentScans + 1,
        'stats.lastScan': serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error incrementing code scan:", error);
    throw error;
  }
} 